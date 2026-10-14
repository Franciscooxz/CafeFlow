'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { usePosStore } from '@/store/pos.store';
import { Button } from '@/components/ui/Button';
import { formatAmount } from '@/lib/currency';
import { ShoppingCart, Tag } from '@/components/icons';
import type { CartItem } from '@/types';

// ─── CartLine ──────────────────────────────────────────────────────────────────

function CartLine({ item, currency }: { item: CartItem; currency: string }) {
  const { updateQuantity, removeFromCart } = usePosStore();
  const modAdj = item.selectedModifiers.reduce((s, m) => s + m.priceAdjustment, 0);
  const unitPrice = item.product.price + modAdj;
  const lineTotal = unitPrice * item.quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 py-3 border-b border-cafe-beige last:border-0"
    >
      {/* Controles cantidad */}
      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
        <button
          onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
          className="w-7 h-7 rounded-lg bg-cafe-beige hover:bg-cafe-grayLight text-cafe-black text-sm font-bold transition-colors flex items-center justify-center"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold text-cafe-black">
          {item.quantity}
        </span>
        <button
          onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
          className="w-7 h-7 rounded-lg bg-cafe-beige hover:bg-cafe-grayLight text-cafe-black text-sm font-bold transition-colors flex items-center justify-center"
        >
          +
        </button>
      </div>

      {/* Nombre + modifiers */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-cafe-black font-medium leading-tight">
          {item.product.name}
        </p>
        {item.selectedModifiers.length > 0 && (
          <p className="text-xs text-cafe-gray mt-0.5 leading-tight">
            {item.selectedModifiers.map((m) => m.name).join(', ')}
          </p>
        )}
      </div>

      {/* Precio */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-cafe-black">
          {formatAmount(lineTotal, currency)}
        </p>
        <p className="text-xs text-cafe-gray">
          × {formatAmount(unitPrice, currency)}
        </p>
      </div>

      {/* Eliminar */}
      <button
        onClick={() => removeFromCart(item.cartKey)}
        className="shrink-0 text-cafe-grayLight hover:text-red-400 transition-colors text-lg leading-none mt-0.5"
        aria-label="Eliminar"
      >
        ×
      </button>
    </motion.div>
  );
}

// ─── Cart ──────────────────────────────────────────────────────────────────────

interface CartProps {
  currency?: string;
}

export function Cart({ currency = 'COP' }: CartProps) {
  const t = useTranslations('pos');
  const {
    cart,
    discountAmount,
    discountLabel,
    clearDiscount,
    setPaymentModalOpen,
    activeShift,
    getTotals,
  } = usePosStore();
  const totals = getTotals();

  // Confirmación antes de limpiar el carrito
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fmt = (n: number) => formatAmount(n, currency);

  const handleClearConfirmed = () => {
    usePosStore.getState().clearCart();
    setShowClearConfirm(false);
  };

  return (
    <div className="flex flex-col h-full bg-cafe-white rounded-2xl shadow-cafe overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-cafe-beige">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-cafe-black">{t('cart')}</h2>

          {/* Botón "Limpiar" con confirmación inline */}
          {cart.length > 0 && (
            <AnimatePresence mode="wait">
              {showClearConfirm ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <span className="text-cafe-gray">¿Limpiar todo?</span>
                  <button
                    onClick={handleClearConfirmed}
                    className="text-red-500 hover:text-red-600 font-semibold transition-colors"
                  >
                    Sí
                  </button>
                  <span className="text-cafe-grayLight">/</span>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="text-cafe-gray hover:text-cafe-black transition-colors"
                  >
                    No
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="limpiar"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowClearConfirm(true)}
                  className="text-xs text-cafe-gray hover:text-red-400 transition-colors"
                >
                  Limpiar
                </motion.button>
              )}
            </AnimatePresence>
          )}
        </div>
        {activeShift && (
          <p className="text-xs text-cafe-gray mt-0.5">
            {t('currentShift')} · {activeShift.store?.currency ?? currency}
          </p>
        )}
      </div>

      {/* Items */}
      <div
        className="flex-1 overflow-y-auto px-4"
        // Cerrar la confirmación si el usuario empieza a interactuar con el carrito
        onClick={() => showClearConfirm && setShowClearConfirm(false)}
      >
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-cafe-grayLight">
            <ShoppingCart size={40} strokeWidth={1.2} className="mb-2" />
            <p className="text-sm">{t('emptyCart')}</p>
            <p className="text-xs mt-1 opacity-60">Selecciona productos del catálogo</p>
          </div>
        ) : (
          <AnimatePresence>
            {cart.map((item) => (
              <CartLine key={item.cartKey} item={item} currency={currency} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Descuento activo */}
      {discountAmount > 0 && (
        <div className="px-4 py-2 border-t border-cafe-beige">
          <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2">
            <Tag size={14} className="text-green-600 shrink-0" />
            <span className="text-xs text-green-700 font-medium flex-1">
              {discountLabel || 'Descuento aplicado'}
            </span>
            <span className="text-xs font-bold text-green-700">−{fmt(discountAmount)}</span>
            <button
              onClick={clearDiscount}
              className="text-green-500 hover:text-red-400 text-sm leading-none ml-1"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Totales */}
      {cart.length > 0 && (
        <div className="px-4 py-4 border-t border-cafe-beige space-y-1.5">
          <div className="flex justify-between text-sm text-cafe-gray">
            <span>{t('subtotal')}</span>
            <span>{fmt(totals.subtotal)}</span>
          </div>
          {totals.taxAmount > 0 && (
            <div className="flex justify-between text-sm text-cafe-gray">
              <span>{t('tax')}</span>
              <span>{fmt(totals.taxAmount)}</span>
            </div>
          )}
          {totals.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>− {t('discount')}</span>
              <span>−{fmt(totals.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-cafe-black pt-1 border-t border-cafe-beige">
            <span>{t('total')}</span>
            <span className="text-cafe-terracota">{fmt(totals.total)}</span>
          </div>
        </div>
      )}

      {/* Botón pagar */}
      <div className="px-4 pb-4">
        <Button
          fullWidth
          size="lg"
          disabled={cart.length === 0 || !activeShift}
          onClick={() => setPaymentModalOpen(true)}
        >
          {t('pay')} →
        </Button>
        {!activeShift && cart.length > 0 && (
          <p className="text-xs text-center text-red-500 mt-2">{t('noShift')}</p>
        )}
        {cart.length > 0 && activeShift && (
          <p className="text-xs text-center text-cafe-grayLight mt-1.5">
            Atajo: <kbd className="font-mono">F2</kbd> para cobrar
          </p>
        )}
      </div>
    </div>
  );
}
