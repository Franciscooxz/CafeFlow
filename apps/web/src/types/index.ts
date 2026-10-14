// ─── SHARED TYPES ─────────────────────────────────────────────────────────────

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
}

export interface Store {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  currency: string;
  taxRate: number;
  timezone: string;
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

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface Modifier {
  id: string;
  groupId: string;
  name: string;
  priceAdjustment: number;
  isActive: boolean;
}

export interface ModifierGroup {
  id: string;
  tenantId: string;
  name: string;
  required: boolean;
  multiSelect: boolean;
  sortOrder: number;
  isActive: boolean;
  modifiers: Modifier[];
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone?: string;
  email?: string;
  loyaltyPoints: number;
  totalSpent: number;
  createdAt: string;
}

export interface Discount {
  id: string;
  tenantId: string;
  code: string;
  type: DiscountType;
  value: number;
  minOrder: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SelectedModifier {
  groupId: string;
  groupName: string;
  modifierId: string;
  name: string;
  priceAdjustment: number;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId?: string;
  category?: Category;
  name: string;
  description?: string;
  price: number;
  taxRate: number;
  imageUrl?: string;
  isActive: boolean;
  stock: number;
  lowStockAlert: number;
  modifierGroups?: ModifierGroup[];
}

export interface Shift {
  id: string;
  tenantId: string;
  storeId: string;
  userId: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingCash?: number;
  store?: Pick<Store, 'id' | 'name' | 'currency' | 'taxRate'>;
}

export interface OrderItem {
  id: string;
  productId: string;
  product?: Pick<Product, 'id' | 'name'>;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
}

export interface Order {
  id: string;
  tenantId: string;
  storeId: string;
  shiftId: string;
  userId: string;
  ticketNumber: number;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  cardAmount?: number;
  change?: number;
  notes?: string;
  callName?: string | null;
  fulfillmentStatus?: FulfillmentStatus;
  createdAt: string;
  items: OrderItem[];
}

// ─── BARRA / COCINA ───────────────────────────────────────────────────────────

export type FulfillmentStatus = 'RECEIVED' | 'PREPARING' | 'READY' | 'DELIVERED';

// Forma de toKdsOrder (apps/api/src/modules/pos/kds.mapper.ts).
export interface KdsOrder {
  id: string;
  storeId: string;
  ticketNumber: number;
  callName: string | null;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
  statusChangedAt: string;
  customer: string | null;
  table: string | null;
  items: Array<{ name: string; quantity: number; modifiers: string[] }>;
}

// ─── TABLE ────────────────────────────────────────────────────────────────────

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';

export interface Table {
  id: string;
  tenantId: string;
  storeId: string;
  number: number;
  name?: string;
  capacity: number;
  status: TableStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── STOCK MOVEMENT ───────────────────────────────────────────────────────────

export type StockMovementType = 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'IMPORT';

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  userId?: string;
  orderId?: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  createdAt: string;
  user?: { firstName: string; lastName: string };
}

// ─── CART (frontend only) ─────────────────────────────────────────────────────

export interface CartItem {
  cartKey: string;           // product.id + sorted modifierIds for uniqueness
  product: Product;
  quantity: number;
  selectedModifiers: SelectedModifier[];
}

export interface CartTotals {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

// ─── API RESPONSE ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
