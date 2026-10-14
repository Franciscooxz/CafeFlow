import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.customer.findMany({
      where: { tenantId },
      include: { _count: { select: { orders: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async search(tenantId: string, q: string) {
    return this.prisma.customer.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
      orderBy: { name: 'asc' },
    });
  }

  async create(tenantId: string, data: { name: string; phone?: string; email?: string }) {
    return this.prisma.customer.create({ data: { tenantId, ...data } });
  }

  async update(
    id: string,
    tenantId: string,
    data: { name?: string; phone?: string; email?: string },
  ) {
    const customer = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return this.prisma.customer.update({ where: { id }, data });
  }

  async getOrders(id: string, tenantId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id, tenantId } });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return this.prisma.order.findMany({
      where: { customerId: id, tenantId },
      include: { items: { include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
