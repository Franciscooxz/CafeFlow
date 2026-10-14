import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string | null;
  storeId: string | null;
}

// Cache en memoria: evita un query a la DB en cada request autenticado.
// TTL de 60 s — si el usuario es desactivado, tarda máx 1 min en reflejarse.
const USER_CACHE_TTL_MS = 60_000;
interface CacheEntry {
  user: Record<string, any>;
  expiresAt: number;
}
const userCache = new Map<string, CacheEntry>();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const fromCookie = (req: Request) =>
      req?.cookies?.['access_token'] ?? null;
    const fromBearer = ExtractJwt.fromAuthHeaderAsBearerToken();

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([fromCookie, fromBearer]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload) {
    const now = Date.now();
    const cached = userCache.get(payload.sub);

    if (cached && cached.expiresAt > now) {
      return cached.user;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        storeId: true,
        isActive: true,
        locale: true,
      },
    });

    if (!user || !user.isActive) {
      userCache.delete(payload.sub);
      throw new UnauthorizedException('Usuario no encontrado o inactivo');
    }

    userCache.set(payload.sub, { user, expiresAt: now + USER_CACHE_TTL_MS });
    return user;
  }
}
