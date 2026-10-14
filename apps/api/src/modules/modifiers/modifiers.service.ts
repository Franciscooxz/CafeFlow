import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ModifiersService {
  constructor(private prisma: PrismaService) {}

  // ─── GROUPS ──────────────────────────────────────────────────────────────

  async findAll(tenantId: string) {
    return this.prisma.modifierGroup.findMany({
      where: { tenantId },
      include: {
        modifiers: { orderBy: { name: 'asc' } },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createGroup(
    tenantId: string,
    data: { name: string; required?: boolean; multiSelect?: boolean; sortOrder?: number },
  ) {
    return this.prisma.modifierGroup.create({
      data: { tenantId, ...data },
      include: { modifiers: true },
    });
  }

  async updateGroup(
    id: string,
    tenantId: string,
    data: { name?: string; required?: boolean; multiSelect?: boolean; sortOrder?: number },
  ) {
    const group = await this.prisma.modifierGroup.findFirst({ where: { id, tenantId } });
    if (!group) throw new NotFoundException('Grupo de modificadores no encontrado');
    return this.prisma.modifierGroup.update({
      where: { id },
      data,
      include: { modifiers: true },
    });
  }

  async toggleGroup(id: string, tenantId: string) {
    const group = await this.prisma.modifierGroup.findFirst({ where: { id, tenantId } });
    if (!group) throw new NotFoundException('Grupo de modificadores no encontrado');
    return this.prisma.modifierGroup.update({
      where: { id },
      data: { isActive: !group.isActive },
      select: { id: true, name: true, isActive: true },
    });
  }

  // ─── ITEMS ────────────────────────────────────────────────────────────────

  async addItem(
    groupId: string,
    tenantId: string,
    data: { name: string; priceAdjustment?: number },
  ) {
    const group = await this.prisma.modifierGroup.findFirst({ where: { id: groupId, tenantId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    return this.prisma.modifier.create({ data: { groupId, ...data } });
  }

  async updateItem(
    groupId: string,
    itemId: string,
    tenantId: string,
    data: { name?: string; priceAdjustment?: number },
  ) {
    const modifier = await this.prisma.modifier.findFirst({
      where: { id: itemId, groupId, group: { tenantId } },
    });
    if (!modifier) throw new NotFoundException('Modificador no encontrado');
    return this.prisma.modifier.update({ where: { id: itemId }, data });
  }

  async toggleItem(groupId: string, itemId: string, tenantId: string) {
    const modifier = await this.prisma.modifier.findFirst({
      where: { id: itemId, groupId, group: { tenantId } },
    });
    if (!modifier) throw new NotFoundException('Modificador no encontrado');
    return this.prisma.modifier.update({
      where: { id: itemId },
      data: { isActive: !modifier.isActive },
      select: { id: true, name: true, isActive: true },
    });
  }

  // ─── PRODUCT ASSIGNMENT ───────────────────────────────────────────────────

  async assignGroupsToProduct(productId: string, tenantId: string, groupIds: string[]) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!product) throw new NotFoundException('Producto no encontrado');

    // FIX: validar que TODOS los groupIds pertenecen al mismo tenant
    if (groupIds.length > 0) {
      const validGroups = await this.prisma.modifierGroup.findMany({
        where: { id: { in: groupIds }, tenantId },
        select: { id: true },
      });
      if (validGroups.length !== groupIds.length) {
        throw new BadRequestException(
          'Uno o más grupos de modificadores no existen o no pertenecen a este tenant',
        );
      }
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        modifierGroups: {
          set: groupIds.map((id) => ({ id })),
        },
      },
      include: { modifierGroups: { include: { modifiers: true } } },
    });
  }

  async getProductModifierGroups(productId: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
      include: {
        modifierGroups: {
          where: { isActive: true },
          include: { modifiers: { where: { isActive: true }, orderBy: { name: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product.modifierGroups;
  }
}
