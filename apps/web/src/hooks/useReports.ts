'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

export interface DashboardKPIs {
  today: { sales: number; orders: number; avgTicket: number };
  week: { sales: number; orders: number };
  month: { sales: number; orders: number; growth: number | null };
  inventory: { totalProducts: number; lowStockProducts: number };
}

export interface SalesTrendPoint {
  date: string;
  label: string;
  total: number;
  orders: number;
}

export interface TopProduct {
  product: {
    id: string;
    name: string;
    price: number;
    category?: { name: string; color?: string };
  };
  quantity: number;
  revenue: number;
}

export interface RecentOrder {
  id: string;
  ticketNumber: number;
  total: number;
  discountAmount: number;
  paymentMethod: string;
  createdAt: string;
  user: { firstName: string; lastName: string };
  store: { name: string };
  customer?: { name: string } | null;
  _count: { items: number };
}

export interface CategoryStat {
  id: string;
  name: string;
  color: string | null;
  revenue: number;
  quantity: number;
}

export interface PaymentStat {
  method: string;
  label: string;
  total: number;
  count: number;
}

export interface RangeSummary {
  summary: {
    totalSales: number;
    totalOrders: number;
    avgTicket: number;
    totalDiscount: number;
  };
  trend: SalesTrendPoint[];
  categories: CategoryStat[];
  payments: PaymentStat[];
  topProducts: TopProduct[];
}

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────

export function useDashboardKPIs() {
  const { isAuthenticated } = useAuthStore();
  return useQuery<DashboardKPIs>({
    queryKey: ['reports', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/reports/dashboard');
      return data.data;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });
}

// ─── Tendencia de ventas ──────────────────────────────────────────────────────

export function useSalesTrend(days: 7 | 30 = 7, from?: string, to?: string) {
  const { isAuthenticated } = useAuthStore();
  const params = new URLSearchParams({ days: String(days) });
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  return useQuery<SalesTrendPoint[]>({
    queryKey: ['reports', 'sales-trend', days, from, to],
    queryFn: async () => {
      const { data } = await api.get(`/reports/sales-trend?${params.toString()}`);
      return data.data;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Top productos ────────────────────────────────────────────────────────────

export function useTopProducts(from?: string, to?: string) {
  const { isAuthenticated } = useAuthStore();
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();

  return useQuery<TopProduct[]>({
    queryKey: ['reports', 'top-products', from, to],
    queryFn: async () => {
      const { data } = await api.get(`/reports/top-products${qs ? `?${qs}` : ''}`);
      return data.data;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Últimas ventas ───────────────────────────────────────────────────────────

export function useRecentOrders(from?: string, to?: string) {
  const { isAuthenticated } = useAuthStore();
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();

  return useQuery<RecentOrder[]>({
    queryKey: ['reports', 'recent-orders', from, to],
    queryFn: async () => {
      const { data } = await api.get(`/reports/recent-orders${qs ? `?${qs}` : ''}`);
      return data.data;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60,
  });
}

// ─── Resumen por rango ────────────────────────────────────────────────────────

export function useRangeSummary(from?: string, to?: string) {
  const { isAuthenticated } = useAuthStore();
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();

  return useQuery<RangeSummary>({
    queryKey: ['reports', 'summary', from, to],
    queryFn: async () => {
      const { data } = await api.get(`/reports/summary${qs ? `?${qs}` : ''}`);
      return data.data;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });
}

// ─── Ventas por categoría ─────────────────────────────────────────────────────

export function useSalesByCategory(from?: string, to?: string) {
  const { isAuthenticated } = useAuthStore();
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();

  return useQuery<CategoryStat[]>({
    queryKey: ['reports', 'by-category', from, to],
    queryFn: async () => {
      const { data } = await api.get(`/reports/by-category${qs ? `?${qs}` : ''}`);
      return data.data;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Estadísticas de pago ─────────────────────────────────────────────────────

export function usePaymentStats(from?: string, to?: string) {
  const { isAuthenticated } = useAuthStore();
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();

  return useQuery<PaymentStat[]>({
    queryKey: ['reports', 'payment-stats', from, to],
    queryFn: async () => {
      const { data } = await api.get(`/reports/payment-stats${qs ? `?${qs}` : ''}`);
      return data.data;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Stock bajo (para sidebar badge) ─────────────────────────────────────────

export function useLowStockCount() {
  const { isAuthenticated } = useAuthStore();
  return useQuery<number>({
    queryKey: ['pos', 'low-stock-count'],
    queryFn: async () => {
      const { data } = await api.get('/pos/low-stock-count');
      return data.data as number;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
    refetchInterval: 1000 * 60 * 5,
  });
}
