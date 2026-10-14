import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ─── Productos ─────────────────────────────────────────────────────────────

  async create(dto: CreateProductDto, tenantId: string) {
    return this.prisma.product.create({
      data: { ...dto, tenantId },
      include: { category: { select: { id: true, name: true, color: true } } },
    });
  }

  async bulkCreate(items: Partial<CreateProductDto>[], tenantId: string) {
    if (!items || items.length === 0) {
      throw new BadRequestException('No hay productos para importar');
    }
    if (items.length > 500) {
      throw new BadRequestException('Máximo 500 productos por importación');
    }

    const results = await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.product.create({
          data: {
            name: item.name!,
            description: item.description ?? '',
            price: item.price ?? 0,
            taxRate: item.taxRate ?? 0,
            stock: item.stock ?? 0,
            lowStockAlert: item.lowStockAlert ?? 5,
            categoryId: item.categoryId ?? null,
            tenantId,
            isActive: true,
          },
          select: { id: true, name: true },
        }),
      ),
    );

    return { created: results.length, products: results };
  }

  async findAll(tenantId: string, activeOnly = false) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        ...(activeOnly && { isActive: true }),
      },
      include: { category: { select: { id: true, name: true, color: true } } },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });
  }

  async findOne(id: string, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { category: { select: { id: true, name: true, color: true } } },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: string, tenantId: string, data: Partial<CreateProductDto>) {
    await this.findOne(id, tenantId);
    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true, color: true } } },
    });
  }

  async toggleProductActive(id: string, tenantId: string) {
    const product = await this.findOne(id, tenantId);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
      select: { id: true, isActive: true, name: true },
    });
  }

  async adjustStock(
    id: string,
    tenantId: string,
    adjustment: number,
    userId?: string,
    notes?: string,
  ) {
    const product = await this.findOne(id, tenantId);
    const previousStock = product.stock;
    const newStock = Math.max(0, previousStock + adjustment);

    const [updated] = await this.prisma.$transaction([
      this.prisma.product.update({
        where: { id },
        data: { stock: newStock },
        select: { id: true, name: true, stock: true },
      }),
      this.prisma.stockMovement.create({
        data: {
          tenantId,
          productId: id,
          userId: userId ?? null,
          type: 'ADJUSTMENT',
          quantity: adjustment,
          previousStock,
          newStock,
          notes: notes ?? (adjustment > 0 ? 'Entrada manual' : 'Salida manual'),
        },
      }),
    ]);

    return updated;
  }

  async getStockMovements(id: string, tenantId: string, limit = 20) {
    await this.findOne(id, tenantId);
    return this.prisma.stockMovement.findMany({
      where: { productId: id, tenantId },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getProductHistory(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.auditLog.findMany({
      // entity sale de la URL en AuditLogInterceptor: /products/:id → 'products'
      where: { tenantId, entity: 'products', entityId: id },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // ─── Categorías ────────────────────────────────────────────────────────────

  async findCategories(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId, isActive: true },
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(tenantId: string, name: string, color?: string, sortOrder?: number) {
    return this.prisma.category.create({
      data: { tenantId, name, color, sortOrder: sortOrder ?? 0 },
    });
  }

  async updateCategory(
    id: string,
    tenantId: string,
    data: { name?: string; color?: string; sortOrder?: number },
  ) {
    const existing = await this.prisma.category.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Categoría no encontrada');
    return this.prisma.category.update({ where: { id }, data });
  }

  async toggleCategoryActive(id: string, tenantId: string) {
    const existing = await this.prisma.category.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Categoría no encontrada');
    return this.prisma.category.update({
      where: { id },
      data: { isActive: !existing.isActive },
      select: { id: true, isActive: true, name: true },
    });
  }
}
