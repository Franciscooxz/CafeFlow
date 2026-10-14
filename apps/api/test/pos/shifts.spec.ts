import { ConflictException, NotFoundException } from '@nestjs/common';
import { PosService } from '../../src/modules/pos/pos.service';
import { prisma, resetDatabase } from '../helpers/db';
import { Cafe, seedCafe } from '../helpers/factory';

const pos = new PosService(prisma);

let cafe: Cafe;

beforeEach(async () => {
  await resetDatabase();
  cafe = await seedCafe();
});

afterAll(() => prisma.$disconnect());

describe('turnos', () => {
  it('no permite abrir un segundo turno sin cerrar el primero', async () => {
    await expect(
      pos.openShift({ storeId: cafe.store.id, openingCash: 0 }, cafe.cashier.id, cafe.tenant.id),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('cierra el turno con el efectivo contado y permite abrir otro', async () => {
    const closed = await pos.closeShift(
      cafe.shift.id,
      { closingCash: 150000 },
      cafe.cashier.id,
      cafe.tenant.id,
    );

    expect(closed.closedAt).not.toBeNull();
    expect(closed.closingCash?.toString()).toBe('150000');
    await expect(
      pos.openShift({ storeId: cafe.store.id, openingCash: 50000 }, cafe.cashier.id, cafe.tenant.id),
    ).resolves.toMatchObject({ closedAt: null });
  });

  it('no permite abrir turno en una sede de otra cafetería', async () => {
    const other = await seedCafe();

    await expect(
      pos.openShift({ storeId: other.store.id, openingCash: 0 }, cafe.otherCashier.id, cafe.tenant.id),
    ).rejects.toThrow('Sede no encontrada');
  });

  it('no permite cerrar dos veces ni cerrar el turno de otro', async () => {
    await expect(
      pos.closeShift(cafe.shift.id, { closingCash: 0 }, cafe.otherCashier.id, cafe.tenant.id),
    ).rejects.toBeInstanceOf(NotFoundException);

    await pos.closeShift(cafe.shift.id, { closingCash: 0 }, cafe.cashier.id, cafe.tenant.id);
    await expect(
      pos.closeShift(cafe.shift.id, { closingCash: 0 }, cafe.cashier.id, cafe.tenant.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
