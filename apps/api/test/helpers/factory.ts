import { Role } from '@prisma/client';
import { prisma } from './db';

let sequence = 0;

/**
 * Una cafetería lista para vender: tienda, cajeros, gerente, turno abierto del
 * cajero principal, productos, un modificador, un descuento, una mesa y un cliente.
 *
 * Precios pensados para cuentas fáciles en COP:
 * - latte 8.000 con IVA 19 % (stock 10)
 * - croissant 5.500 sin IVA (stock 1: sirve para probar la última unidad)
 * - empanada 2.550 con IVA 19 % (el IVA es 484,5: prueba el redondeo half-up)
 */
export async function seedCafe(options: { currency?: string } = {}) {
  const n = ++sequence;
  const tenant = await prisma.tenant.create({
    data: { name: `Café ${n}`, slug: `cafe-${n}`, onboardingCompleted: true },
  });
  const store = await prisma.store.create({
    data: { tenantId: tenant.id, name: `Sede ${n}`, currency: options.currency ?? 'COP' },
  });

  const user = (role: Role, label: string) =>
    prisma.user.create({
      data: {
        tenantId: tenant.id,
        storeId: role === Role.OWNER ? null : store.id,
        email: `${label}-${n}@test.local`,
        passwordHash: 'not-used',
        firstName: label,
        lastName: 'Test',
        role,
      },
    });

  const [cashier, otherCashier, manager, owner] = await Promise.all([
    user(Role.CASHIER, 'cashier'),
    user(Role.CASHIER, 'cashier2'),
    user(Role.MANAGER, 'manager'),
    user(Role.OWNER, 'owner'),
  ]);

  const shift = await prisma.shift.create({
    data: { tenantId: tenant.id, storeId: store.id, userId: cashier.id, openingCash: 100000 },
  });

  const product = (name: string, price: number | string, taxRate: number | string, stock: number) =>
    prisma.product.create({ data: { tenantId: tenant.id, name, price, taxRate, stock } });

  const [latte, croissant, empanada] = await Promise.all([
    product('Latte', 8000, 0.19, 10),
    product('Croissant', 5500, 0, 1),
    product('Empanada', 2550, 0.19, 50),
  ]);

  const group = await prisma.modifierGroup.create({
    data: {
      tenantId: tenant.id,
      name: 'Leche',
      modifiers: { create: { name: 'Almendra', priceAdjustment: 1500 } },
    },
    include: { modifiers: true },
  });

  const discount = await prisma.discount.create({
    data: { tenantId: tenant.id, code: 'DEMO10', type: 'PERCENTAGE', value: 10 },
  });
  const table = await prisma.table.create({
    data: { tenantId: tenant.id, storeId: store.id, number: 1 },
  });
  const customer = await prisma.customer.create({
    data: { tenantId: tenant.id, name: 'Ana María Pérez' },
  });

  return {
    tenant,
    store,
    cashier,
    otherCashier,
    manager,
    owner,
    shift,
    latte,
    croissant,
    empanada,
    almond: group.modifiers[0],
    discount,
    table,
    customer,
  };
}

export type Cafe = Awaited<ReturnType<typeof seedCafe>>;
