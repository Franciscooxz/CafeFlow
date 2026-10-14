'use client';

import { create } from 'zustand';
import type { Product, CartItem, CartTotals, Shift, SelectedModifier } from '@/types';

interface PosState {
  // Carrito
  cart: CartItem[];
  discountCode: string;
  discountAmount: number;
  discountLabel: string;

  // Turno activo
  activeShift: Shift | null;

  // Modifier modal
  modifierProduct: Product | null;

  // UI
  selectedCategoryId: string | null;
  searchQuery: string;
  isPaymentModalOpen: boolean;

  // Optimistic: productos con stock actualizado localmente
  localStockUpdates: Record<string, number>;

  // Actions — carrito
  addToCart: (product: Product, modifiers?: SelectedModifier[]) => void;
  removeFromCart: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  setDiscountCode: (code: string, amount: number, label: string) => void;
  clearDiscount: () => void;
  clearCart: () => void;

  // Actions — modifier modal
  openModifierModal: (product: Product) => void;
  closeModifierModal: () => void;

  // Actions — turno
  setActiveShift: (shift: Shift | null) => void;

  // Actions — UI
  setSelectedCategory: (categoryId: string | null) => void;
  setSearchQuery: (q: string) => void;
  setPaymentModalOpen: (open: boolean) => void;

  // Actions — stock optimista
  applyOptimisticStock: (updates: Record<string, number>) => void;
  clearOptimisticStock: () => void;

  // Computed
  getTotals: (taxRate?: number) => CartTotals;
  getCartItemCount: () => number;
}

function buildCartKey(productId: string, modifiers: SelectedModifier[]): string {
  const mIds = modifiers.map((m) => m.modifierId).sort().join(',');
  return `${productId}|${mIds}`;
}

export const usePosStore = create<PosState>()((set, get) => ({
  cart: [],
  discountCode: '',
  discountAmount: 0,
  discountLabel: '',
  activeShift: null,
  modifierProduct: null,
  selectedCategoryId: null,
  searchQuery: '',
  isPaymentModalOpen: false,
  localStockUpdates: {},

  addToCart: (product, modifiers = []) =>
    set((state) => {
      const cartKey = buildCartKey(product.id, modifiers);
      const existing = state.cart.find((i) => i.cartKey === cartKey);
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.cartKey === cartKey
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        };
      }
      return {
        cart: [...state.cart, { cartKey, product, quantity: 1, selectedModifiers: modifiers }],
      };
    }),

  removeFromCart: (cartKey) =>
    set((state) => ({
      cart: state.cart.filter((i) => i.cartKey !== cartKey),
    })),

  updateQuantity: (cartKey, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { cart: state.cart.filter((i) => i.cartKey !== cartKey) };
      }
      return {
        cart: state.cart.map((i) =>
          i.cartKey === cartKey ? { ...i, quantity } : i,
        ),
      };
    }),

  setDiscountCode: (code, amount, label) =>
    set({ discountCode: code, discountAmount: amount, discountLabel: label }),

  clearDiscount: () =>
    set({ discountCode: '', discountAmount: 0, discountLabel: '' }),

  clearCart: () =>
    set({ cart: [], discountCode: '', discountAmount: 0, discountLabel: '' }),

  openModifierModal: (product) => set({ modifierProduct: product }),
  closeModifierModal: () => set({ modifierProduct: null }),

  setActiveShift: (shift) => set({ activeShift: shift }),
  setSelectedCategory: (categoryId) => set({ selectedCategoryId: categoryId }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setPaymentModalOpen: (open) => set({ isPaymentModalOpen: open }),

  applyOptimisticStock: (updates) =>
    set((state) => ({
      localStockUpdates: { ...state.localStockUpdates, ...updates },
    })),

  clearOptimisticStock: () => set({ localStockUpdates: {} }),

  getTotals: () => {
    const { cart, discountAmount } = get();
    const subtotal = cart.reduce((sum, item) => {
      const modAdj = item.selectedModifiers.reduce(
        (s, m) => s + m.priceAdjustment,
        0,
      );
      return sum + (item.product.price + modAdj) * item.quantity;
    }, 0);
    const taxAmount = cart.reduce((sum, item) => {
      const modAdj = item.selectedModifiers.reduce(
        (s, m) => s + m.priceAdjustment,
        0,
      );
      return (
        sum +
        (item.product.price + modAdj) * item.quantity * item.product.taxRate
      );
    }, 0);
    const total = Math.max(0, subtotal + taxAmount - discountAmount);
    return { subtotal, taxAmount, discountAmount, total };
  },

  getCartItemCount: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
