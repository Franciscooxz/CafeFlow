import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStoreDto, tenantId: string) {
    return this.prisma.store.create({
      data: { ...dto, tenantId },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.store.findMany({
      where: { tenantId, isActive: true },
      include: {
        _count: { select: { users: true, orders: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const store = await this.prisma.store.findFirst({
      where: { id, tenantId },
    });
    if (!store) throw new NotFoundException('Sede no encontrada');
    return store;
  }

  async update(id: string, tenantId: string, data: Partial<CreateStoreDto>) {
    await this.findOne(id, tenantId);
    return this.prisma.store.update({ where: { id }, data });
  }
}
