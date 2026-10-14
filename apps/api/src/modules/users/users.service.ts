import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto, tenantId: string) {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        role: dto.role,
        storeId: dto.storeId,
        locale: dto.locale ?? 'es',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        storeId: true,
        isActive: true,
        locale: true,
        createdAt: true,
      },
    });
    return user;
  }

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        storeId: true,
        isActive: true,
        locale: true,
        createdAt: true,
        store: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        storeId: true,
        isActive: true,
        locale: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async toggleActive(id: string, tenantId: string, isActive: boolean) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role === Role.OWNER) {
      throw new ForbiddenException('No puedes desactivar al dueño');
    }
    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, isActive: true },
    });
  }

  async updateLocale(id: string, locale: string) {
    return this.prisma.user.update({
      where: { id },
      data: { locale },
      select: { id: true, locale: true },
    });
  }
}
