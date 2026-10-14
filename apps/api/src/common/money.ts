import { Prisma } from '@prisma/client';

export const Decimal = Prisma.Decimal;
export type Decimal = Prisma.Decimal;

export const ZERO = new Decimal(0);

export function roundMoney(value: Prisma.Decimal.Value, decimals = 2): Decimal {
  return new Decimal(value).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
}

export function sumMoney(values: Array<Prisma.Decimal.Value | null | undefined>): Decimal {
  return values.reduce<Decimal>((acc, v) => (v == null ? acc : acc.plus(v)), ZERO);
}

/**
 * Convierte recursivamente los Decimal de Prisma a number para la respuesta JSON.
 * Sin esto, Decimal.toJSON() los serializa como string y el frontend
 * concatenaría en vez de sumar.
 */
export function decimalsToNumbers<T>(value: T): T {
  if (Decimal.isDecimal(value)) {
    return (value as unknown as Decimal).toNumber() as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map(decimalsToNumbers) as unknown as T;
  }
  if (value && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      result[key] = decimalsToNumbers(v);
    }
    return result as T;
  }
  return value;
}
