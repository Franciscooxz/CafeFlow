'use client';

import { useMemo } from 'react';
import { usePosStore } from '@/store/pos.store';
import { useAllStores } from '@/hooks/useAdmin';
import { DEFAULT_CURRENCY, formatAmount, formatCompact } from '@/lib/currency';

/** Moneda de la tienda del turno activo o, fuera del POS, de la primera sede. */
export function useCurrency(): string {
  const shiftCurrency = usePosStore((s) => s.activeShift?.store?.currency);
  const { data: stores } = useAllStores();
  return shiftCurrency ?? stores?.[0]?.currency ?? DEFAULT_CURRENCY;
}

export function useMoney() {
  const currency = useCurrency();
  return useMemo(
    () => ({
      currency,
      fmt: (n: number | null | undefined) => formatAmount(n, currency),
      fmtCompact: (n: number) => formatCompact(n, currency),
    }),
    [currency],
  );
}
