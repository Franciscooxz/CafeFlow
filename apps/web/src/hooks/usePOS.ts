'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePosStore } from '@/store/pos.store';
import api from '@/lib/api';
import type { Product, Order, Shift } from '@/types';

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get('/products?active=true');
      return data.data as Product[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/products/categories');
      return data.data as Array<{ id: string; name: string; color?: string }>;
    },
  });
}

// ─── TURNO ────────────────────────────────────────────────────────────────────

export function useCurrentShift() {
  const { setActiveShift } = usePosStore();

  return useQuery({
    queryKey: ['shift', 'current'],
    queryFn: async () => {
      const { data } = await api.get('/pos/shifts/current');
      const shift = data.data as Shift | null;
      setActiveShift(shift);
      return shift;
    },
    staleTime: 1000 * 60,
  });
}

export function useOpenShift() {
  const qc = useQueryClient();
  const { setActiveShift } = usePosStore();

  return useMutation({
    mutationFn: async (dto: { storeId: string; openingCash: number }) => {
      const { data } = await api.post('/pos/shifts/open', dto);
      return data.data as Shift;
    },
    onSuccess: (shift) => {
      setActiveShift(shift);
      qc.invalidateQueries({ queryKey: ['shift', 'current'] });
    },
  });
}

export function useCloseShift() {
  const qc = useQueryClient();
  const { setActiveShift } = usePosStore();

  return useMutation({
    mutationFn: async ({
      shiftId,
      closingCash,
    }: {
      shiftId: string;
      closingCash: number;
    }) => {
      const { data } = await api.post(`/pos/shifts/${shiftId}/close`, { closingCash });
      return data.data;
    },
    onSuccess: () => {
      setActiveShift(null);
      qc.invalidateQueries({ queryKey: ['shift', 'current'] });
    },
  });
}

// ─── ÓRDENES ─────────────────────────────────────────────────────────────────

export function useCreateOrder() {
  const qc = useQueryClient();
  const { clearCart, applyOptimisticStock, cart } = usePosStore();

  return useMutation({
    mutationFn: async (dto: {
      storeId: string;
      shiftId: string;
      items: Array<{ productId: string; quantity: number; modifierIds?: string[] }>;
      paymentMethod: 'CASH' | 'CARD' | 'MIXED';
      cashReceived?: number;
      cardAmount?: number;
      discountCode?: string;
      discountAmount?: number;
      customerId?: string;
      callName?: string;
    }) => {
      const { data } = await api.post('/pos/orders', dto);
      return data.data as Order;
    },
    onMutate: () => {
      const optimisticUpdates: Record<string, number> = {};
      for (const item of cart) {
        optimisticUpdates[item.product.id] =
          (optimisticUpdates[item.product.id] ?? item.product.stock) - item.quantity;
      }
      applyOptimisticStock(optimisticUpdates);
    },
    onSuccess: () => {
      clearCart();
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => {
      applyOptimisticStock({});
    },
  });
}

export function useValidateDiscount() {
  return useMutation({
    mutationFn: async ({
      code,
      orderTotal,
      storeId,
    }: {
      code: string;
      orderTotal: number;
      storeId?: string;
    }) => {
      const { data } = await api.post('/discounts/validate', { code, orderTotal, storeId });
      return data.data as { discount: any; discountAmount: number };
    },
  });
}

export function useProductModifierGroups(productId: string | null) {
  return useQuery({
    queryKey: ['product-modifiers', productId],
    queryFn: async () => {
      const { data } = await api.get(`/modifiers/products/${productId}`);
      return data.data as any[];
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useShiftOrders(shiftId: string | null) {
  return useQuery({
    queryKey: ['orders', shiftId],
    queryFn: async () => {
      const { data } = await api.get(`/pos/shifts/${shiftId}/orders`);
      return data.data as Order[];
    },
    enabled: !!shiftId,
  });
}
