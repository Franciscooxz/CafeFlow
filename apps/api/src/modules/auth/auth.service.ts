import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';
import { passwordResetEmail } from './password-reset.email';

const REFRESH_ROTATION_GRACE_MS = 30_000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// SHA-256 sin sal basta: el token ya tiene 256 bits aleatorios, no hay
// diccionario que probar (a diferencia de una contraseña, que va con bcrypt).
function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        tenant: { select: { id: true, name: true, slug: true, onboardingCompleted: true } },
        store: { select: { id: true, name: true, currency: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.generateTokens(user);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt,
      },
    });

    // Log audit
    await this.prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        action: 'LOGIN',
        entity: 'auth',
      },
    });

    const { passwordHash: _, ...userSafe } = user;

    return {
      user: userSafe,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string | null, refreshToken: string) {
    // Si no tenemos userId (token expirado), intentamos obtenerlo desde el refresh token
    let resolvedUserId = userId;
    if (!resolvedUserId && refreshToken) {
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        select: { userId: true },
      });
      resolvedUserId = tokenRecord?.userId ?? null;
    }

    // Eliminar el refresh token (por token exacto para máxima precisión)
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: resolvedUserId
          ? { userId: resolvedUserId, token: refreshToken }
          : { token: refreshToken },
      });
    }

    // Audit log solo si tenemos usuario
    if (resolvedUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: resolvedUserId } });
      if (user) {
        await this.prisma.auditLog.create({
          data: {
            tenantId: user.tenantId,
            userId: resolvedUserId,
            action: 'LOGOUT',
            entity: 'auth',
          },
        });
      }
    }
  }

  async refresh(user: User, usedToken: string) {
    const tokens = await this.generateTokens(user);

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 7);
    // Gracia en vez de borrado inmediato: si dos pestañas renuevan a la vez con
    // el mismo token, la segunda no pierde la sesión.
    const graceUntil = new Date(now.getTime() + REFRESH_ROTATION_GRACE_MS);

    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({
        where: { userId: user.id, expiresAt: { lt: now } },
      }),
      this.prisma.refreshToken.updateMany({
        where: { token: usedToken, expiresAt: { gt: graceUntil } },
        data: { expiresAt: graceUntil },
      }),
      this.prisma.refreshToken.create({
        data: { userId: user.id, token: tokens.refreshToken, expiresAt },
      }),
    ]);

    return tokens;
  }

  async forgotPassword(email: string) {
    const response = { message: 'Si el email existe, recibirás un enlace de recuperación' };

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return response;

    const token = randomBytes(32).toString('base64url');
    const now = new Date();

    await this.prisma.$transaction([
      // Solo el enlace más reciente sirve; los viejos (y los ya usados) sobran.
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashResetToken(token),
          expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS),
        },
      }),
    ]);

    const appUrl = (this.config.get<string>('APP_URL') || 'http://localhost:3000').replace(/\/$/, '');
    const locale = /^(es|en|pt)$/.test(user.locale) ? user.locale : 'es';
    const link = `${appUrl}/${locale}/reset-password?token=${token}`;

    // Sin await: si respondiéramos después del SMTP, el tiempo de respuesta
    // delataría qué emails existen.
    this.mail
      .send(passwordResetEmail(user.firstName, user.email, link))
      .catch((err: unknown) =>
        this.logger.error(`No se pudo enviar el correo de recuperación: ${String(err)}`),
      );

    return response;
  }

  async resetPassword(token: string, newPassword: string) {
    const invalid = new UnauthorizedException('El enlace no es válido o ya expiró. Solicita uno nuevo.');
    const tokenHash = hashResetToken(token);
    const now = new Date();

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { userId: true, user: { select: { isActive: true } } },
    });
    if (!record || !record.user.isActive) throw invalid;

    // Hash fuera de la transacción: bcrypt tarda ~250 ms y no debe retener la conexión.
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      // Reclamo condicional: de dos peticiones simultáneas con el mismo enlace,
      // solo una ve count = 1.
      const claimed = await tx.passwordResetToken.updateMany({
        where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count === 0) throw invalid;

      await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
      // Quien tuviera la contraseña vieja pierde sus sesiones abiertas.
      await tx.refreshToken.deleteMany({ where: { userId: record.userId } });
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      storeId: user.storeId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN') ?? '15m',
      }),
      // jwtid: sin él, dos tokens firmados en el mismo segundo son idénticos y
      // chocan con el @unique de refresh_tokens.token.
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
        jwtid: randomUUID(),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
