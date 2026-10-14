import { BadRequestException } from '@nestjs/common';
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

const sell = (dto: Parameters<PosService['createOrder']>[0], c: Cafe = cafe) =>
  pos.createOrder(dto, c.cashier.id, c.tenant.id);

describe('createOrder: totales', () => {
  it('calcula subtotal, IVA y total por línea en COP', async () => {
    const { order } = await sell(
      orderDto(cafe, [
        { productId: cafe.latte.id, quantity: 2 },
        { productId: cafe.croissant.id, quantity: 1 },
      ]),
    );

    expect(order.subtotal.toString()).toBe('21500');
    expect(order.taxAmount.toString()).toBe('3040');
    expect(order.total.toString()).toBe('24540');
    expect(order.items.map((i) => i.subtotal.toString()).sort()).toEqual(['19040', '5500']);
  });

  it('redondea el IVA half-up a pesos enteros', async () => {
    const { order } = await sell(orderDto(cafe, [{ productId: cafe.empanada.id, quantity: 1 }]));

    expect(order.taxAmount.toString()).toBe('485');
    expect(order.total.toString()).toBe('3035');
  });

  it('usa 2 decimales en USD', async () => {
    const usd = await seedCafe({ currency: 'USD' });
    await prisma.product.update({
      where: { id: usd.latte.id },
      data: { price: '3.35', taxRate: '0.075' },
    });

    const { order } = await sell(orderDto(usd, [{ productId: usd.latte.id, quantity: 3 }]), usd);

    expect(order.subtotal.toString()).toBe('10.05');
    expect(order.taxAmount.toString()).toBe('0.75');
    expect(order.total.toString()).toBe('10.8');
  });

  it('suma el modificador al precio unitario y guarda una copia de su precio', async () => {
    const { order } = await sell(
      orderDto(cafe, [{ productId: cafe.latte.id, quantity: 1, modifierIds: [cafe.almond.id] }]),
    );

    expect(order.items[0].unitPrice.toString()).toBe('9500');
    expect(order.total.toString()).toBe('11305');
    expect(order.items[0].modifiers[0].priceAdjustment.toString()).toBe('1500');
  });

  it('calcula el vuelto en efectivo', async () => {
    const { order } = await sell(
      orderDto(cafe, [{ productId: cafe.latte.id, quantity: 1 }], { cashReceived: 10000 }),
    );

    expect(order.change.toString()).toBe('480');
  });
});

describe('createOrder: descuentos', () => {
  it('aplica el código porcentual sobre el total con IVA y suma un uso', async () => {
    const { order } = await sell(
      orderDto(
        cafe,
        [
          { productId: cafe.latte.id, quantity: 2 },
          { productId: cafe.croissant.id, quantity: 1 },
        ],
        { discountCode: 'demo10' },
      ),
    );

    expect(order.discountAmount.toString()).toBe('2454');
    expect(order.total.toString()).toBe('22086');
    const discount = await prisma.discount.findUniqueOrThrow({ where: { id: cafe.discount.id } });
    expect(discount.usedCount).toBe(1);
  });

  it('rechaza códigos vencidos, agotados o bajo el pedido mínimo', async () => {
    const items = [{ productId: cafe.latte.id, quantity: 1 }];
    const cases = [
      { data: { expiresAt: new Date(Date.now() - 1000) }, message: 'El codigo de descuento ha expirado' },
      { data: { maxUses: 1, usedCount: 1 }, message: 'El codigo ha alcanzado su limite de usos' },
      { data: { minOrder: 50000 }, message: 'El pedido minimo para este descuento es 50000' },
    ];

    for (const { data, message } of cases) {
      await prisma.discount.update({
        where: { id: cafe.discount.id },
        data: { expiresAt: null, maxUses: null, usedCount: 0, minOrder: 0, ...data },
      });
      await expect(sell(orderDto(cafe, items, { discountCode: 'DEMO10' }))).rejects.toThrow(message);
    }
  });

  it('no deja que el descuento manual deje el total en negativo', async () => {
    const { order } = await sell(
      orderDto(cafe, [{ productId: cafe.latte.id, quantity: 1 }], { discountAmount: 999999 }),
    );

    expect(order.discountAmount.toString()).toBe('9520');
    expect(order.total.toString()).toBe('0');
  });

  it('con maxUses 1, de dos ventas simultáneas solo una usa el código', async () => {
    await prisma.discount.update({ where: { id: cafe.discount.id }, data: { maxUses: 1 } });
    const dto = orderDto(cafe, [{ productId: cafe.latte.id, quantity: 1 }], { discountCode: 'DEMO10' });

    const results = await Promise.allSettled([sell(dto), sell(dto)]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const discount = await prisma.discount.findUniqueOrThrow({ where: { id: cafe.discount.id } });
    expect(discount.usedCount).toBe(1);
  });
});

describe('createOrder: inventario y numeración', () => {
  it('descuenta stock y registra el movimiento de venta', async () => {
    const { order, stockUpdates } = await sell(
      orderDto(cafe, [{ productId: cafe.latte.id, quantity: 3 }]),
    );

    expect(stockUpdates).toEqual([{ id: cafe.latte.id, name: 'Latte', stock: 7, isLow: false }]);
    const movement = await prisma.stockMovement.findFirstOrThrow({ where: { orderId: order.id } });
    expect(movement).toMatchObject({ type: 'SALE', quantity: -3, previousStock: 10, newStock: 7 });
  });

  it('suma cantidades del mismo producto en líneas distintas antes de validar stock', async () => {
    await expect(
      sell(
        orderDto(cafe, [
          { productId: cafe.croissant.id, quantity: 1 },
          { productId: cafe.croissant.id, quantity: 1 },
        ]),
      ),
    ).rejects.toThrow('Stock insuficiente para "Croissant": disponible 1, solicitado 2');
  });

  it('si falla, no deja rastro: ni stock descontado ni orden ni ticket consumido', async () => {
    await expect(
      sell(
        orderDto(cafe, [
          { productId: cafe.latte.id, quantity: 1 },
          { productId: cafe.croissant.id, quantity: 5 },
        ]),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    const latte = await prisma.product.findUniqueOrThrow({ where: { id: cafe.latte.id } });
    expect(latte.stock).toBe(10);
    expect(await prisma.order.count()).toBe(0);
    const store = await prisma.store.findUniqueOrThrow({ where: { id: cafe.store.id } });
    expect(store.lastTicketNumber).toBe(0);
  });

  it('dos ventas simultáneas de la última unidad: una gana y el stock no queda negativo', async () => {
    const dto = orderDto(cafe, [{ productId: cafe.croissant.id, quantity: 1 }]);

    const results = await Promise.allSettled([sell(dto), sell(dto)]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const croissant = await prisma.product.findUniqueOrThrow({ where: { id: cafe.croissant.id } });
    expect(croissant.stock).toBe(0);
    expect(await prisma.stockMovement.count({ where: { productId: cafe.croissant.id } })).toBe(1);
  });

  it('numera los tickets sin huecos ni duplicados bajo concurrencia', async () => {
    const dto = orderDto(cafe, [{ productId: cafe.empanada.id, quantity: 1 }]);

    await Promise.all(Array.from({ length: 6 }, () => sell(dto)));

    const orders = await prisma.order.findMany({ select: { ticketNumber: true } });
    expect(orders.map((o) => o.ticketNumber).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('registra el evento inicial RECEIVED para barra y cocina', async () => {
    const { order } = await sell(orderDto(cafe, [{ productId: cafe.latte.id, quantity: 1 }]));

    const events = await prisma.orderStatusEvent.findMany({ where: { orderId: order.id } });
    expect(events.map((e) => e.status)).toEqual(['RECEIVED']);
  });
});

describe('createOrder: cliente y fidelidad', () => {
  it('suma total gastado y 1 punto por cada 1.000', async () => {
    await sell(
      orderDto(cafe, [{ productId: cafe.latte.id, quantity: 2 }, { productId: cafe.croissant.id, quantity: 1 }], {
        customerId: cafe.customer.id,
      }),
    );

    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: cafe.customer.id } });
    expect(customer.totalSpent.toString()).toBe('24540');
    expect(customer.loyaltyPoints).toBe(24);
  });

  it('sin nombre explícito, llama al cliente por su primer nombre', async () => {
    const { order } = await sell(
      orderDto(cafe, [{ productId: cafe.latte.id, quantity: 1 }], { customerId: cafe.customer.id }),
    );

    expect(order.callName).toBe('Ana');
  });
});

describe('createOrder: turnos', () => {
  it('rechaza vender en un turno cerrado', async () => {
    await prisma.shift.update({ where: { id: cafe.shift.id }, data: { closedAt: new Date() } });

    await expect(sell(orderDto(cafe, [{ productId: cafe.latte.id, quantity: 1 }]))).rejects.toThrow(
      'Debes tener un turno abierto para registrar ventas',
    );
  });

  it('rechaza vender en el turno de otro cajero', async () => {
    await expect(
      pos.createOrder(
        orderDto(cafe, [{ productId: cafe.latte.id, quantity: 1 }]),
        cafe.otherCashier.id,
        cafe.tenant.id,
      ),
    ).rejects.toThrow('Debes tener un turno abierto para registrar ventas');
  });
});

describe('createOrder: aislamiento entre cafeterías', () => {
  let other: Cafe;

  beforeEach(async () => {
    other = await seedCafe();
  });

  it('rechaza productos de otra cafetería', async () => {
    await expect(sell(orderDto(cafe, [{ productId: other.latte.id, quantity: 1 }]))).rejects.toThrow(
      'Uno o mas productos no existen o estan inactivos',
    );
  });

  it('rechaza códigos de descuento de otra cafetería', async () => {
    await prisma.discount.update({ where: { id: other.discount.id }, data: { code: 'AJENO' } });

    await expect(
      sell(orderDto(cafe, [{ productId: cafe.latte.id, quantity: 1 }], { discountCode: 'AJENO' })),
    ).rejects.toThrow('Codigo de descuento no valido');
  });

  it('rechaza modificadores de otra cafetería', async () => {
    await expect(
      sell(orderDto(cafe, [{ productId: cafe.latte.id, quantity: 1, modifierIds: [other.almond.id] }])),
    ).rejects.toThrow('Uno o mas modificadores no existen o estan inactivos');
  });

  it('rechaza mesas de otra cafetería y no las toca', async () => {
    await expect(
      sell(orderDto(cafe, [{ productId: cafe.latte.id, quantity: 1 }], { tableId: other.table.id })),
    ).rejects.toThrow('Mesa no encontrada');

    const table = await prisma.table.findUniqueOrThrow({ where: { id: other.table.id } });
    expect(table.status).toBe('AVAILABLE');
  });

  it('rechaza clientes de otra cafetería y no expone su nombre', async () => {
    await expect(
      sell(orderDto(cafe, [{ productId: cafe.latte.id, quantity: 1 }], { customerId: other.customer.id })),
    ).rejects.toThrow('Cliente no encontrado');

    const customer = await prisma.customer.findUniqueOrThrow({ where: { id: other.customer.id } });
    expect(customer.totalSpent.toString()).toBe('0');
  });
});
