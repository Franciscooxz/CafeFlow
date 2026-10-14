import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PosService } from '../../src/modules/pos/pos.service';
import { prisma, resetDatabase } from '../helpers/db';
import { Cafe, seedCafe } from '../helpers/factory';
import { orderDto } from '../helpers/orders';

const pos = new PosService(prisma);

let cafe: Cafe;

beforeEach(async () => {
  await resetDatabase();
  cafe = await seedCafe();
});

afterAll(() => prisma.$disconnect());

/** Venta típica: 2 lattes + 1 croissant con DEMO10 y cliente → total 22.086, 22 puntos. */
async function sellWithEverything() {
  const { order } = await pos.createOrder(
    orderDto(
      cafe,
      [
        { productId: cafe.latte.id, quantity: 2 },
        { productId: cafe.croissant.id, quantity: 1 },
      ],
      { discountCode: 'DEMO10', customerId: cafe.customer.id },
    ),
    cafe.cashier.id,
    cafe.tenant.id,
  );
  return order;
}

const cancelAs = (orderId: string, user: { id: string; role: Cafe['cashier']['role'] }, reason?: string) =>
  pos.cancelOrder(orderId, user, cafe.tenant.id, reason);

describe('cancelOrder: reversa completa', () => {
  it('devuelve stock, el uso del código, el gasto y los puntos del cliente', async () => {
    const order = await sellWithEverything();

    const cancelled = await cancelAs(order.id, cafe.cashier, 'Cliente se arrepintió');

    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.notes).toBe('Cliente se arrepintió');

    const [latte, croissant, discount, customer] = await Promise.all([
      prisma.product.findUniqueOrThrow({ where: { id: cafe.latte.id } }),
      prisma.product.findUniqueOrThrow({ where: { id: cafe.croissant.id } }),
      prisma.discount.findUniqueOrThrow({ where: { id: cafe.discount.id } }),
      prisma.customer.findUniqueOrThrow({ where: { id: cafe.customer.id } }),
    ]);
    expect(latte.stock).toBe(10);
    expect(croissant.stock).toBe(1);
    expect(discount.usedCount).toBe(0);
    expect(customer.totalSpent.toString()).toBe('0');
    expect(customer.loyaltyPoints).toBe(0);
  });

  it('registra movimientos de devolución por producto', async () => {
    const order = await sellWithEverything();

    await cancelAs(order.id, cafe.cashier);

    const returns = await prisma.stockMovement.findMany({
      where: { orderId: order.id, type: 'RETURN' },
      orderBy: { quantity: 'asc' },
    });
    expect(returns.map(({ quantity, previousStock, newStock }) => ({ quantity, previousStock, newStock }))).toEqual([
      { quantity: 1, previousStock: 0, newStock: 1 },
      { quantity: 2, previousStock: 8, newStock: 10 },
    ]);
  });

  it('si el cliente ya gastó los puntos, los deja en 0 y no en negativo', async () => {
    const order = await sellWithEverything();
    await prisma.customer.update({ where: { id: cafe.customer.id }, data: { loyaltyPoints: 5 } });

    await cancelAs(order.id, cafe.cashier);

    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: cafe.customer.id } });
    expect(customer.loyaltyPoints).toBe(0);
  });

  it('no permite anular dos veces', async () => {
    const order = await sellWithEverything();
    await cancelAs(order.id, cafe.cashier);

    await expect(cancelAs(order.id, cafe.cashier)).rejects.toThrow('La orden ya fue cancelada');
  });

  it('dos anulaciones simultáneas devuelven el stock una sola vez', async () => {
    const order = await sellWithEverything();

    const results = await Promise.allSettled([
      cancelAs(order.id, cafe.cashier),
      cancelAs(order.id, cafe.cashier),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rejected.reason).toBeInstanceOf(BadRequestException);

    const latte = await prisma.product.findUniqueOrThrow({ where: { id: cafe.latte.id } });
    expect(latte.stock).toBe(10);
    const discount = await prisma.discount.findUniqueOrThrow({ where: { id: cafe.discount.id } });
    expect(discount.usedCount).toBe(0);
    expect(await prisma.stockMovement.count({ where: { type: 'RETURN' } })).toBe(2);
  });
});

describe('cancelOrder: permisos', () => {
  it('el cajero anula ventas de su propio turno abierto', async () => {
    const order = await sellWithEverything();

    await expect(cancelAs(order.id, cafe.cashier)).resolves.toMatchObject({ status: 'CANCELLED' });
  });

  it('el cajero no puede anular ventas del turno de otro cajero', async () => {
    const order = await sellWithEverything();

    await expect(cancelAs(order.id, cafe.otherCashier)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('el cajero no puede anular ventas de un turno cerrado', async () => {
    const order = await sellWithEverything();
    await pos.closeShift(cafe.shift.id, { closingCash: 122086 }, cafe.cashier.id, cafe.tenant.id);

    await expect(cancelAs(order.id, cafe.cashier)).rejects.toBeInstanceOf(ForbiddenException);
    const stillCompleted = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(stillCompleted.status).toBe('COMPLETED');
  });

  it('gerente y dueño sí pueden anular ventas de un turno cerrado', async () => {
    const first = await sellWithEverything();
    const { order: second } = await pos.createOrder(
      orderDto(cafe, [{ productId: cafe.empanada.id, quantity: 1 }]),
      cafe.cashier.id,
      cafe.tenant.id,
    );
    await pos.closeShift(cafe.shift.id, { closingCash: 0 }, cafe.cashier.id, cafe.tenant.id);

    await expect(cancelAs(first.id, cafe.manager)).resolves.toMatchObject({ status: 'CANCELLED' });
    await expect(cancelAs(second.id, cafe.owner)).resolves.toMatchObject({ status: 'CANCELLED' });
  });

  it('nadie puede anular órdenes de otra cafetería', async () => {
    const order = await sellWithEverything();
    const other = await seedCafe();

    await expect(pos.cancelOrder(order.id, other.owner, other.tenant.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
