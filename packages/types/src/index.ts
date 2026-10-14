// Re-export all types for use across apps
export type Role = 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'CASHIER';
export type Locale = 'es' | 'en' | 'pt';
export type OrderStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'MIXED';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  onboardingCompleted: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Store {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  currency: string;
  taxRate: number;
  timezone: string;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  tenantId: string | null;
  storeId: string | null;
  isActive: boolean;
  locale: Locale;
  tenant?: Tenant;
  store?: Store;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  taxRate: number;
  imageUrl?: string;
  isActive: boolean;
  stock: number;
  lowStockAlert: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}
