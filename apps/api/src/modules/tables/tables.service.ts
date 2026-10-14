import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TableStatus } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, storeId?: string) {
    return this.prisma.table.findMany({
      where: { tenantId, ...(storeId && { storeId }) },
      orderBy: { number: 'asc' },
    });
  }

  async create(
    tenantId: string,
    dto: { storeId: string; number: number; name?: string; capacity?: number; notes?: string },
  ) {
    const existing = await this.prisma.table.findFirst({
      where: { tenantId, storeId: dto.storeId, number: dto.number },
    });
    if (existing) {
      throw new ConflictException(`La mesa ${dto.number} ya existe en esta sede`);
    }
    return this.prisma.table.create({
      data: { tenantId, ...dto },
    });
  }

  async update(
    id: string,
    tenantId: string,
    dto: { name?: string; capacity?: number; notes?: string },
  ) {
    const existing = await this.prisma.table.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Mesa no encontrada');
    return this.prisma.table.update({ where: { id }, data: dto });
  }

  async updateStatus(id: string, tenantId: string, status: TableStatus) {
    const existing = await this.prisma.table.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Mesa no encontrada');
    return this.prisma.table.update({ where: { id }, data: { status } });
  }

  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.table.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Mesa no encontrada');
    return this.prisma.table.delete({ where: { id } });
  }
}
