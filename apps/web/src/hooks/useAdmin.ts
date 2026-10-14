'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ─── PRODUCTOS ────────────────────────────────────────────────────────────────

export function useAllProducts() {
  return useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const { data } = await api.get('/products');
      return data.data as any[];
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: any) => {
      const { data } = await api.post('/products', dto);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useProductHistory(productId: string | null) {
  return useQuery({
    queryKey: ['product-history', productId],
    queryFn: async () => {
      const { data } = await api.get(`/products/${productId}/history`);
      return data.data as any[];
    },
    enabled: !!productId,
  });
}

export function useBulkCreateProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: any[]) => {
      const { data } = await api.post('/products/bulk', { items });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: any) => {
      const { data } = await api.put(`/products/${id}`, dto);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useToggleProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/products/${id}/toggle`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, adjustment }: { id: string; adjustment: number }) => {
      const { data } = await api.patch(`/products/${id}/stock`, { adjustment });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const { data } = await api.get('/products/categories');
      return data.data as any[];
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { name: string; color?: string }) => {
      const { data } = await api.post('/products/categories', dto);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; name?: string; color?: string }) => {
      const { data } = await api.put(`/products/categories/${id}`, dto);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// ─── USUARIOS ─────────────────────────────────────────────────────────────────

export function useAllUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data.data as any[];
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: any) => {
      const { data } = await api.post('/users', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data } = await api.patch(`/users/${id}/toggle-active`, { isActive });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

// ─── SEDES ────────────────────────────────────────────────────────────────────

export function useAllStores() {
  return useQuery({
    queryKey: ['admin', 'stores'],
    queryFn: async () => {
      const { data } = await api.get('/stores');
      return data.data as any[];
    },
  });
}

export function useUpdateStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: any) => {
      const { data } = await api.put(`/stores/${id}`, dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'stores'] }),
  });
}

// ─── MODIFICADORES ────────────────────────────────────────────────────────────

export function useModifierGroups() {
  return useQuery({
    queryKey: ['admin', 'modifiers'],
    queryFn: async () => {
      const { data } = await api.get('/modifiers');
      return data.data as any[];
    },
  });
}

export function useCreateModifierGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { name: string; required?: boolean; multiSelect?: boolean }) => {
      const { data } = await api.post('/modifiers', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'modifiers'] }),
  });
}

export function useUpdateModifierGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; name?: string; required?: boolean; multiSelect?: boolean }) => {
      const { data } = await api.put(`/modifiers/${id}`, dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'modifiers'] }),
  });
}

export function useToggleModifierGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/modifiers/${id}/toggle`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'modifiers'] }),
  });
}

export function useAddModifierItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, name, priceAdjustment }: { groupId: string; name: string; priceAdjustment?: number }) => {
      const { data } = await api.post(`/modifiers/${groupId}/items`, { name, priceAdjustment });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'modifiers'] }),
  });
}

export function useUpdateModifierItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, itemId, ...dto }: { groupId: string; itemId: string; name?: string; priceAdjustment?: number }) => {
      const { data } = await api.put(`/modifiers/${groupId}/items/${itemId}`, dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'modifiers'] }),
  });
}

export function useToggleModifierItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, itemId }: { groupId: string; itemId: string }) => {
      const { data } = await api.patch(`/modifiers/${groupId}/items/${itemId}/toggle`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'modifiers'] }),
  });
}

export function useAssignModifierGroups() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, groupIds }: { productId: string; groupIds: string[] }) => {
      const { data } = await api.post(`/modifiers/products/${productId}/assign`, { groupIds });
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ─── CLIENTES ─────────────────────────────────────────────────────────────────

export function useAllCustomers() {
  return useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: async () => {
      const { data } = await api.get('/customers');
      return data.data as any[];
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { name: string; phone?: string; email?: string }) => {
      const { data } = await api.post('/customers', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'customers'] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; name?: string; phone?: string; email?: string }) => {
      const { data } = await api.put(`/customers/${id}`, dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'customers'] }),
  });
}

export function useSearchCustomers(query: string) {
  return useQuery({
    queryKey: ['customers', 'search', query],
    queryFn: async () => {
      const { data } = await api.get(`/customers/search?q=${encodeURIComponent(query)}`);
      return data.data as any[];
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });
}

// ─── DESCUENTOS ───────────────────────────────────────────────────────────────

export function useAllDiscounts() {
  return useQuery({
    queryKey: ['admin', 'discounts'],
    queryFn: async () => {
      const { data } = await api.get('/discounts');
      return data.data as any[];
    },
  });
}

export function useCreateDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { code: string; type: 'PERCENTAGE' | 'FIXED'; value: number; minOrder?: number; maxUses?: number; expiresAt?: string }) => {
      const { data } = await api.post('/discounts', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'discounts'] }),
  });
}

export function useToggleDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/discounts/${id}/toggle`);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'discounts'] }),
  });
}

// ─── AUDIT ────────────────────────────────────────────────────────────────────

export function useAuditLogs(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['admin', 'audit', page],
    queryFn: async () => {
      const { data } = await api.get(`/audit/logs?page=${page}&limit=${limit}`);
      return data.data as { logs: any[]; pagination: any };
    },
  });
}

// ─── MESAS ────────────────────────────────────────────────────────────────────

export function useTables(storeId?: string) {
  const params = storeId ? `?storeId=${storeId}` : '';
  return useQuery({
    queryKey: ['admin', 'tables', storeId],
    queryFn: async () => {
      const { data } = await api.get(`/tables${params}`);
      return data.data as any[];
    },
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dto: { storeId: string; number: number; name?: string; capacity?: number; notes?: string }) => {
      const { data } = await api.post('/tables', dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'tables'] }),
  });
}

export function useUpdateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; name?: string; capacity?: number; notes?: string }) => {
      const { data } = await api.patch(`/tables/${id}`, dto);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'tables'] }),
  });
}

export function useUpdateTableStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' }) => {
      const { data } = await api.patch(`/tables/${id}/status`, { status });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'tables'] }),
  });
}

export function useDeleteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tables/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'tables'] }),
  });
}

// ─── STOCK MOVEMENTS ──────────────────────────────────────────────────────────

export function useStockMovements(productId: string | null, limit = 20) {
  return useQuery({
    queryKey: ['admin', 'stock-movements', productId],
    queryFn: async () => {
      const { data } = await api.get(`/products/${productId}/stock-movements?limit=${limit}`);
      return data.data as any[];
    },
    enabled: !!productId,
    staleTime: 1000 * 30,
  });
}
