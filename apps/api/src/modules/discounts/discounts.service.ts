import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DiscountType, Prisma } from '@prisma/client';
import { Decimal, roundMoney } from '../../common/money';
import { currencyDecimals } from '../../common/currency';

export function computeDiscountAmount(
  discount: { type: DiscountType; value: Decimal },
  orderTotal: Prisma.Decimal.Value,
  decimals: number,
): Decimal {
  const total = new Decimal(orderTotal);
  return discount.type === 'PERCENTAGE'
    ? roundMoney(total.times(discount.value).dividedBy(100), decimals)
    : Decimal.min(discount.value, total);
}

@Injectable()
export class DiscountsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.discount.findMany({
      where: { tenantId },
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    tenantId: string,
    data: {
      code: string;
      type: DiscountType;
      value: number;
      minOrder?: number;
      maxUses?: number;
      expiresAt?: string;
    },
  ) {
    const existing = await this.prisma.discount.findFirst({
      where: { tenantId, code: data.code.toUpperCase() },
    });
    if (existing) throw new BadRequestException('Ya existe un descuento con ese código');
    return this.prisma.discount.create({
      data: {
        tenantId,
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        minOrder: data.minOrder ?? 0,
        maxUses: data.maxUses ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
  }

  async toggle(id: string, tenantId: string) {
    const discount = await this.prisma.discount.findFirst({ where: { id, tenantId } });
    if (!discount) throw new NotFoundException('Descuento no encontrado');
    return this.prisma.discount.update({
      where: { id },
      data: { isActive: !discount.isActive },
      select: { id: true, code: true, isActive: true },
    });
  }

  async validate(tenantId: string, code: string, orderTotal: number, storeId?: string) {
    const store = storeId
      ? await this.prisma.store.findFirst({
          where: { id: storeId, tenantId },
          select: { currency: true },
        })
      : null;

    const discount = await this.prisma.discount.findFirst({
      where: { tenantId, code: code.toUpperCase(), isActive: true },
    });

    if (!discount) throw new NotFoundException('Código de descuento no válido');
    if (discount.expiresAt && discount.expiresAt < new Date()) {
      throw new BadRequestException('El código de descuento ha expirado');
    }
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      throw new BadRequestException('El código de descuento ha alcanzado su límite de usos');
    }
    if (discount.minOrder.greaterThan(orderTotal)) {
      throw new BadRequestException(
        `El pedido mínimo para este descuento es ${discount.minOrder.toString()}`,
      );
    }

    return {
      discount,
      discountAmount: computeDiscountAmount(
        discount,
        orderTotal,
        currencyDecimals(store?.currency),
      ),
    };
  }
}
