import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { FulfillmentStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ACTIVE_FULFILLMENT, FULFILLMENT_FLOW, KDS_ORDER_INCLUDE, toKdsOrder } from './kds.mapper';
import { CreateOrderDto } from './dto/create-order.dto';
import { OpenShiftDto, CloseShiftDto } from './dto/open-shift.dto';
import { Decimal, ZERO, roundMoney, sumMoney } from '../../common/money';
import { computeDiscountAmount } from '../discounts/discounts.service';
import { currencyDecimals } from '../../common/currency';

function sumQuantitiesByProduct(items: { productId: string; quantity: number }[]) {
  const totals = new Map<string, number>();
  for (const { productId, quantity } of items) {
    totals.set(productId, (totals.get(productId) ?? 0) + quantity);
  }
  return totals;
}

function isPrismaError(err: unknown, code: string) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === code;
}

@Injectable()
export class PosService {
  constructor(private prisma: PrismaService) {}

  // ─── SHIFTS ───────────────────────────────────────────────────────────────

  async openShift(dto: OpenShiftDto, userId: string, tenantId: string) {
    // createOrder toma la tienda del turno, así que validarla aquí cubre todas las ventas.
    const store = await this.prisma.store.findFirst({
      where: { id: dto.storeId, tenantId, isActive: true },
      select: { id: true },
    });
    if (!store) throw new NotFoundException('Sede no encontrada');

    const existing = await this.prisma.shift.findFirst({
      where: { userId, tenantId, closedAt: null },
    });
    if (existing) {
      throw new ConflictException(
        'Ya tienes un turno abierto. Ciérralo antes de abrir uno nuevo.',
      );
    }
    return this.prisma.shift.create({
      data: {
        tenantId,
        storeId: dto.storeId,
        userId,
        openingCash: dto.openingCash ?? 0,
        notes: dto.notes,
      },
    });
  }

  async closeShift(
    shiftId: string,
    dto: CloseShiftDto,
    userId: string,
    tenantId: string,
  ) {
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, userId, tenantId, closedAt: null },
    });
    if (!shift) throw new NotFoundException('Turno no encontrado o ya cerrado');
    return this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        closedAt: new Date(),
        closingCash: dto.closingCash,
        notes: dto.notes,
      },
    });
  }

  async getCurrentShift(userId: string, tenantId: string) {
    return this.prisma.shift.findFirst({
      where: { userId, tenantId, closedAt: null },
      include: {
        store: { select: { id: true, name: true, currency: true, taxRate: true } },
        _count: { select: { orders: true } },
      },
    });
  }

  // ─── ORDERS ───────────────────────────────────────────────────────────────

  async createOrder(dto: CreateOrderDto, userId: string, tenantId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: { id: dto.shiftId, userId, tenantId, closedAt: null },
      include: { store: true },
    });
    if (!shift) {
      throw new BadRequestException(
        'Debes tener un turno abierto para registrar ventas',
      );
    }

    const requestedQty = sumQuantitiesByProduct(dto.items);
    const productIds = [...requestedQty.keys()];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, tenantId, isActive: true },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'Uno o mas productos no existen o estan inactivos',
      );
    }
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Rechazo temprano con el stock leído; la garantía bajo concurrencia es el
    // UPDATE condicional dentro de la transacción.
    for (const [productId, quantity] of requestedQty) {
      const product = productMap.get(productId)!;
      if (product.stock < quantity) {
        throw new BadRequestException(
          `Stock insuficiente para "${product.name}": disponible ${product.stock}, solicitado ${quantity}`,
        );
      }
    }

    const modifierIds = [...new Set(dto.items.flatMap((i) => i.modifierIds ?? []))];
    const modifiersData =
      modifierIds.length > 0
        ? await this.prisma.modifier.findMany({
            where: { id: { in: modifierIds }, isActive: true, group: { tenantId } },
          })
        : [];
    if (modifiersData.length !== modifierIds.length) {
      throw new BadRequestException('Uno o mas modificadores no existen o estan inactivos');
    }
    const modifierMap = new Map(modifiersData.map((m) => [m.id, m]));

    const customer = dto.customerId
      ? await this.prisma.customer.findFirst({
          where: { id: dto.customerId, tenantId },
          select: { id: true, name: true },
        })
      : null;
    if (dto.customerId && !customer) throw new BadRequestException('Cliente no encontrado');

    if (dto.tableId) {
      const table = await this.prisma.table.findFirst({
        where: { id: dto.tableId, tenantId, storeId: shift.storeId },
        select: { id: true },
      });
      if (!table) throw new BadRequestException('Mesa no encontrada');
    }

    const decimals = currencyDecimals(shift.store.currency);
    let subtotal = ZERO;
    let taxAmount = ZERO;

    // Se redondea por línea (no solo al final) para que el ticket impreso
    // cuadre: la suma de las líneas mostradas es igual al total cobrado.
    const orderItems = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const itemModifiers = (item.modifierIds ?? [])
        .map((mId) => modifierMap.get(mId)!)
        .filter(Boolean);
      const modifierAdj = sumMoney(itemModifiers.map((m) => m.priceAdjustment));
      // unitPrice nunca puede ser negativo (modifier con descuento grande)
      const unitPrice = Decimal.max(ZERO, product.price.plus(modifierAdj));
      const itemSubtotal = roundMoney(unitPrice.times(item.quantity), decimals);
      const itemTax = roundMoney(itemSubtotal.times(product.taxRate), decimals);
      subtotal = subtotal.plus(itemSubtotal);
      taxAmount = taxAmount.plus(itemTax);
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        taxRate: product.taxRate,
        subtotal: itemSubtotal.plus(itemTax),
        modifiers: {
          create: itemModifiers.map((m) => ({
            modifierId: m.id,
            name: m.name,
            priceAdjustment: m.priceAdjustment,
          })),
        },
      };
    });

    const rawTotal = subtotal.plus(taxAmount);

    // Validate discount code
    let discountAmount = roundMoney(dto.discountAmount ?? 0, decimals);
    let discountId: string | undefined;

    if (dto.discountCode) {
      const discount = await this.prisma.discount.findFirst({
        where: {
          tenantId,
          code: dto.discountCode.toUpperCase(),
          isActive: true,
        },
      });
      if (!discount) throw new BadRequestException('Codigo de descuento no valido');
      if (discount.expiresAt && discount.expiresAt < new Date()) {
        throw new BadRequestException('El codigo de descuento ha expirado');
      }
      if (
        discount.maxUses !== null &&
        discount.usedCount >= discount.maxUses
      ) {
        throw new BadRequestException(
          'El codigo ha alcanzado su limite de usos',
        );
      }
      if (rawTotal.lessThan(discount.minOrder)) {
        throw new BadRequestException(
          `El pedido minimo para este descuento es ${discount.minOrder.toString()}`,
        );
      }
      discountAmount = computeDiscountAmount(discount, rawTotal, decimals);
      discountId = discount.id;
    }

    discountAmount = Decimal.min(discountAmount, rawTotal);
    const total = rawTotal.minus(discountAmount);

    // La tienda sale del turno validado, no del body: dto.storeId podría
    // apuntar a una tienda de otro tenant.
    const storeId = shift.storeId;

    // Sin nombre explícito, se llama al cliente registrado por su primer nombre.
    const callName =
      dto.callName || customer?.name.trim().split(/\s+/)[0]?.slice(0, 40) || null;

    const { created: order, stockChanges } = await this.prisma.$transaction(async (tx) => {
      // UPDATE ... WHERE stock >= cantidad: si otra venta concurrente ya tomó
      // las unidades, Postgres reevalúa la condición tras su commit y no actualiza.
      const stockChanges: { productId: string; quantity: number; newStock: number }[] = [];
      for (const [productId, quantity] of requestedQty) {
        const { stock: newStock } = await tx.product
          .update({
            where: { id: productId, tenantId, stock: { gte: quantity } },
            data: { stock: { decrement: quantity } },
            select: { stock: true },
          })
          .catch((err: unknown) => {
            if (isPrismaError(err, 'P2025')) {
              throw new BadRequestException(
                `Stock insuficiente para "${productMap.get(productId)!.name}"`,
              );
            }
            throw err;
          });
        stockChanges.push({ productId, quantity, newStock });
      }

      if (discountId) {
        const claimed = await tx.discount.updateMany({
          where: {
            id: discountId,
            OR: [
              { maxUses: null },
              { usedCount: { lt: this.prisma.discount.fields.maxUses } },
            ],
          },
          data: { usedCount: { increment: 1 } },
        });
        if (claimed.count === 0) {
          throw new BadRequestException('El codigo ha alcanzado su limite de usos');
        }
      }

      // El lock de fila sobre la tienda serializa la numeración: dos ventas
      // simultáneas nunca obtienen el mismo ticket.
      const { lastTicketNumber: ticketNumber } = await tx.store.update({
        where: { id: storeId },
        data: { lastTicketNumber: { increment: 1 } },
        select: { lastTicketNumber: true },
      });

      const created = await tx.order.create({
        data: {
          tenantId,
          storeId,
          shiftId: dto.shiftId,
          userId,
          customerId: dto.customerId ?? null,
          discountId: discountId ?? null,
          tableId: dto.tableId ?? null,
          ticketNumber,
          subtotal,
          taxAmount,
          discountAmount,
          total,
          paymentMethod: dto.paymentMethod,
          cashReceived: dto.cashReceived,
          cardAmount: dto.cardAmount,
          notes: dto.notes,
          callName,
          items: { create: orderItems },
        },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true } },
              modifiers: true,
            },
          },
          user: { select: { firstName: true, lastName: true } },
          store: { select: { name: true, currency: true } },
          customer: { select: { id: true, name: true } },
          table: { select: { id: true, number: true, name: true } },
        },
      });

      await tx.orderStatusEvent.create({
        data: { tenantId, orderId: created.id, status: 'RECEIVED', userId },
      });

      await tx.stockMovement.createMany({
        data: stockChanges.map(({ productId, quantity, newStock }) => ({
          tenantId,
          productId,
          userId,
          orderId: created.id,
          type: 'SALE' as const,
          quantity: -quantity,
          previousStock: newStock + quantity,
          newStock,
          notes: `Venta ticket #${ticketNumber}`,
        })),
      });

      if (customer) {
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            totalSpent: { increment: total },
            loyaltyPoints: { increment: total.dividedToIntegerBy(1000).toNumber() },
          },
        });
      }

      // Free the table if assigned
      if (dto.tableId) {
        await tx.table.update({
          where: { id: dto.tableId },
          data: { status: 'OCCUPIED' },
        });
      }

      return { created, stockChanges };
    });

    const stockUpdates = stockChanges.map(({ productId, newStock }) => {
      const product = productMap.get(productId)!;
      return {
        id: productId,
        name: product.name,
        stock: newStock,
        isLow: newStock <= product.lowStockAlert,
      };
    });

    return {
      order: {
        ...order,
        change:
          dto.paymentMethod === 'CASH' && dto.cashReceived
            ? new Decimal(dto.cashReceived).minus(total)
            : 0,
      },
      stockUpdates,
    };
  }

  async getOrdersByShift(shiftId: string, tenantId: string) {
    return this.prisma.order.findMany({
      where: { shiftId, tenantId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true } },
            modifiers: true,
          },
        },
        customer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelOrder(
    orderId: string,
    actor: { id: string; role: Role },
    tenantId: string,
    reason?: string,
  ) {
    const userId = actor.id;
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: {
        items: { select: { productId: true, quantity: true } },
        shift: { select: { userId: true, closedAt: true } },
      },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.status === 'CANCELLED') {
      throw new BadRequestException('La orden ya fue cancelada');
    }
    // Un turno cerrado ya se cuadró: anular ahí cambia un arqueo entregado.
    if (
      actor.role === Role.CASHIER &&
      (order.shift.userId !== actor.id || order.shift.closedAt !== null)
    ) {
      throw new ForbiddenException(
        'Solo puedes anular ventas de tu turno abierto. Pide a un administrador que la anule.',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      // Condicionar el UPDATE al estado evita que dos cancelaciones simultáneas
      // devuelvan el stock dos veces.
      const claimed = await tx.order.updateMany({
        where: { id: orderId, tenantId, status: { not: 'CANCELLED' } },
        data: { status: 'CANCELLED', notes: reason },
      });
      if (claimed.count === 0) {
        throw new BadRequestException('La orden ya fue cancelada');
      }

      const movements: Prisma.StockMovementCreateManyInput[] = [];
      for (const [productId, quantity] of sumQuantitiesByProduct(order.items)) {
        const { stock: newStock } = await tx.product.update({
          where: { id: productId },
          data: { stock: { increment: quantity } },
          select: { stock: true },
        });
        movements.push({
          tenantId,
          productId,
          userId,
          orderId,
          type: 'RETURN',
          quantity,
          previousStock: newStock - quantity,
          newStock,
          notes: `Cancelación ticket #${order.ticketNumber}`,
        });
      }
      await tx.stockMovement.createMany({ data: movements });

      if (order.discountId) {
        await tx.discount.updateMany({
          where: { id: order.discountId, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
      }

      if (order.customerId) {
        // Misma fórmula que en createOrder: 1 punto por cada 1.000 del total.
        const points = order.total.dividedToIntegerBy(1000).toNumber();
        await tx.customer.update({
          where: { id: order.customerId },
          data: { totalSpent: { decrement: order.total } },
        });
        const reverted = await tx.customer.updateMany({
          where: { id: order.customerId, loyaltyPoints: { gte: points } },
          data: { loyaltyPoints: { decrement: points } },
        });
        if (reverted.count === 0) {
          await tx.customer.update({
            where: { id: order.customerId },
            data: { loyaltyPoints: 0 },
          });
        }
      }

      return tx.order.findUniqueOrThrow({ where: { id: orderId } });
    });
  }

  private lowStockWhere(tenantId: string) {
    return {
      tenantId,
      isActive: true,
      stock: { gt: 0, lte: this.prisma.product.fields.lowStockAlert },
    };
  }

  async getStockAlerts(tenantId: string) {
    return this.prisma.product.findMany({
      where: this.lowStockWhere(tenantId),
      include: { category: { select: { name: true } } },
    });
  }

  // ─── KDS ──────────────────────────────────────────────────────────────────

  async getKdsOrders(storeId: string, tenantId: string, hours = 4) {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);
    const orders = await this.prisma.order.findMany({
      where: {
        storeId,
        tenantId,
        status: { in: ['COMPLETED', 'PENDING'] },
        fulfillmentStatus: { in: ACTIVE_FULFILLMENT },
        createdAt: { gte: cutoff },
      },
      include: KDS_ORDER_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    return orders.map(toKdsOrder);
  }

  async updateFulfillment(
    orderId: string,
    status: FulfillmentStatus,
    userId: string,
    tenantId: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      select: { status: true, fulfillmentStatus: true },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      throw new BadRequestException('La orden fue cancelada');
    }

    const from = FULFILLMENT_FLOW.indexOf(order.fulfillmentStatus);
    const to = FULFILLMENT_FLOW.indexOf(status);
    if (to < from - 1) {
      throw new BadRequestException('Solo se puede deshacer un paso');
    }

    if (to !== from) {
      await this.prisma.$transaction(async (tx) => {
        // Condicionar al estado leído: si otro dispositivo lo cambió entre la
        // lectura y la escritura, no se pisan los cambios.
        const claimed = await tx.order.updateMany({
          where: {
            id: orderId,
            tenantId,
            fulfillmentStatus: order.fulfillmentStatus,
            status: { in: ['COMPLETED', 'PENDING'] },
          },
          data: { fulfillmentStatus: status },
        });
        if (claimed.count === 0) {
          throw new ConflictException('El pedido cambió de estado en otro dispositivo. Recarga.');
        }
        await tx.orderStatusEvent.create({
          data: { tenantId, orderId, status, userId },
        });
      });
    }

    const updated = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: KDS_ORDER_INCLUDE,
    });
    return toKdsOrder(updated);
  }

  async getLowStockCount(tenantId: string) {
    return this.prisma.product.count({ where: this.lowStockWhere(tenantId) });
  }
}
