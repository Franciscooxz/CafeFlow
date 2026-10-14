import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Super Admin
  const passwordHash = await bcrypt.hash('cafeflow2024!', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@cafeflow.app' },
    update: {},
    create: {
      email: 'admin@cafeflow.app',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      isActive: true,
      locale: 'es',
    },
  });

  console.log('✅ Super Admin created:', superAdmin.email);

  // Demo Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-cafe' },
    update: {},
    create: {
      name: 'Demo Café',
      slug: 'demo-cafe',
      onboardingCompleted: true,
    },
  });

  console.log('✅ Demo tenant created:', tenant.name);

  // Demo Store
  const store = await prisma.store.upsert({
    where: { id: 'store-demo-1' },
    update: {},
    create: {
      id: 'store-demo-1',
      tenantId: tenant.id,
      name: 'Demo Café - Principal',
      address: 'Calle 123 #45-67, Bogotá',
      currency: 'COP',
      taxRate: 0.19,
      timezone: 'America/Bogota',
    },
  });

  console.log('✅ Demo store created:', store.name);

  // Demo Owner
  const ownerPassword = await bcrypt.hash('owner2024!', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@demo-cafe.com' },
    update: {},
    create: {
      email: 'owner@demo-cafe.com',
      passwordHash: ownerPassword,
      firstName: 'Carlos',
      lastName: 'García',
      role: Role.OWNER,
      tenantId: tenant.id,
      storeId: store.id,
      isActive: true,
      locale: 'es',
    },
  });

  console.log('✅ Demo owner created:', owner.email);

  // Demo Cashier
  const cashierPassword = await bcrypt.hash('cashier2024!', 12);
  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@demo-cafe.com' },
    update: {},
    create: {
      email: 'cashier@demo-cafe.com',
      passwordHash: cashierPassword,
      firstName: 'Ana',
      lastName: 'López',
      role: Role.CASHIER,
      tenantId: tenant.id,
      storeId: store.id,
      isActive: true,
      locale: 'es',
    },
  });

  console.log('✅ Demo cashier created:', cashier.email);

  // Demo Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat-bebidas' },
      update: {},
      create: {
        id: 'cat-bebidas',
        tenantId: tenant.id,
        name: 'Bebidas',
        color: '#C4704A',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-alimentos' },
      update: {},
      create: {
        id: 'cat-alimentos',
        tenantId: tenant.id,
        name: 'Alimentos',
        color: '#6B6B6B',
        sortOrder: 2,
      },
    }),
  ]);

  console.log('✅ Categories created:', categories.length);

  // Demo Products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'prod-espresso' },
      update: {},
      create: {
        id: 'prod-espresso',
        tenantId: tenant.id,
        categoryId: categories[0].id,
        name: 'Espresso',
        description: 'Café espresso doble shot',
        price: 4500,
        taxRate: 0,
        stock: 100,
        lowStockAlert: 10,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-latte' },
      update: {},
      create: {
        id: 'prod-latte',
        tenantId: tenant.id,
        categoryId: categories[0].id,
        name: 'Café Latte',
        description: 'Espresso con leche vaporizada',
        price: 7000,
        taxRate: 0,
        stock: 80,
        lowStockAlert: 10,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-cappuccino' },
      update: {},
      create: {
        id: 'prod-cappuccino',
        tenantId: tenant.id,
        categoryId: categories[0].id,
        name: 'Cappuccino',
        description: 'Espresso, leche vaporizada y espuma',
        price: 7500,
        taxRate: 0,
        stock: 80,
        lowStockAlert: 10,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-croissant' },
      update: {},
      create: {
        id: 'prod-croissant',
        tenantId: tenant.id,
        categoryId: categories[1].id,
        name: 'Croissant',
        description: 'Croissant de mantequilla',
        price: 5500,
        taxRate: 0.19,
        stock: 20,
        lowStockAlert: 5,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-muffin' },
      update: {},
      create: {
        id: 'prod-muffin',
        tenantId: tenant.id,
        categoryId: categories[1].id,
        name: 'Muffin de arándanos',
        description: 'Muffin artesanal de arándanos',
        price: 6000,
        taxRate: 0.19,
        stock: 15,
        lowStockAlert: 5,
      },
    }),
  ]);

  console.log('✅ Products created:', products.length);

  // Demo Tables
  const tables = await Promise.all(
    [1, 2, 3, 4, 5, 6].map((n) =>
      prisma.table.upsert({
        where: { tenantId_storeId_number: { tenantId: tenant.id, storeId: store.id, number: n } },
        update: {},
        create: {
          tenantId: tenant.id,
          storeId: store.id,
          number: n,
          name: `Mesa ${n}`,
          capacity: n <= 2 ? 2 : n <= 4 ? 4 : 6,
          status: 'AVAILABLE',
        },
      }),
    ),
  );

  console.log('✅ Tables created:', tables.length);

  // Demo Modifier Group (Tamaño)
  const sizeGroup = await prisma.modifierGroup.upsert({
    where: { id: 'mg-tamanio' },
    update: {},
    create: {
      id: 'mg-tamanio',
      tenantId: tenant.id,
      name: 'Tamaño',
      required: false,
      multiSelect: false,
      sortOrder: 1,
      isActive: true,
    },
  });

  await Promise.all([
    prisma.modifier.upsert({
      where: { id: 'mod-pequenio' },
      update: {},
      create: { id: 'mod-pequenio', groupId: sizeGroup.id, name: 'Pequeño', priceAdjustment: -1500, isActive: true },
    }),
    prisma.modifier.upsert({
      where: { id: 'mod-grande' },
      update: {},
      create: { id: 'mod-grande', groupId: sizeGroup.id, name: 'Grande', priceAdjustment: 2000, isActive: true },
    }),
  ]);

  console.log('✅ Modifier group created:', sizeGroup.name);

  // Demo Discount
  await prisma.discount.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'DEMO10' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'DEMO10',
      type: 'PERCENTAGE',
      value: 10,
      minOrder: 0,
      maxUses: 100,
      isActive: true,
    },
  });

  console.log('✅ Discount created: DEMO10 (10%)');

  console.log('');
  console.log('─────────────────────────────────────────');
  console.log('🎉 Seed complete!');
  console.log('─────────────────────────────────────────');
  console.log('Super Admin:  admin@cafeflow.app / cafeflow2024!');
  console.log('Owner:        owner@demo-cafe.com / owner2024!');
  console.log('Cashier:      cashier@demo-cafe.com / cashier2024!');
  console.log('Descuento:    DEMO10 (10% off)');
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
