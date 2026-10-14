import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import * as bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';

const BRANDING_SELECT = {
  name: true,
  brandColor: true,
  logoUrl: true,
} satisfies Prisma.TenantSelect;

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto, ownerEmail: string, ownerPassword: string) {
    const tenant = await this.prisma.tenant.create({ data: dto });

    const passwordHash = await bcrypt.hash(ownerPassword, 12);
    const owner = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: ownerEmail,
        passwordHash,
        firstName: 'Owner',
        lastName: tenant.name,
        role: Role.OWNER,
      },
    });

    const { passwordHash: _, ...ownerSafe } = owner;
    return { tenant, owner: ownerSafe };
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      include: { _count: { select: { users: true, stores: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        stores: true,
        _count: { select: { users: true, orders: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
  }

  async getBranding(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: BRANDING_SELECT,
    });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
  }

  async updateBranding(tenantId: string, dto: UpdateBrandingDto) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { brandColor: dto.brandColor, logoUrl: dto.logoUrl },
      select: BRANDING_SELECT,
    });
  }

  async completeOnboarding(tenantId: string) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { onboardingCompleted: true },
    });
  }

  async toggleActive(id: string, isActive: boolean) {
    return this.prisma.tenant.update({
      where: { id },
      data: { isActive },
    });
  }
}
