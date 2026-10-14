'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePosStore } from '@/store/pos.store';
import { useShiftOrders } from '@/hooks/usePOS';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatAmount } from '@/lib/currency';
import {
  History,
  X,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
} from '@/components/icons';
import type { Product, SelectedModifier } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PaymentIcon({ method }: { method: string }) {
  if (method === 'CASH') return <Banknote size={11} className="text-green-500" />;
  if (method === 'CARD') return <CreditCard size={11} className="text-blue-500" />;
  return <ArrowLeftRight size={11} className="text-purple-500" />;
}

function statusLabel(status: string) {
  if (status === 'COMPLETED') return { label: 'Completada', cls: 'text-green-600 bg-green-50' };
  if (status === 'CANCELLED') return { label: 'Cancelada', cls: 'text-red-500 bg-red-50' };
  return { label: 'Pendiente', cls: 'text-amber-600 bg-amber-50' };
}

// ─── CancelOrderButton ────────────────────────────────────────────────────────

function CancelOrderButton({ orderId, tenantId }: { orderId: string; tenantId: string }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      await api.post(`/pos/orders/${orderId}/cancel`, { reason: 'Cancelado desde POS' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      window.alert(err?.response?.data?.message ?? 'No se pudo anular la venta');
    },
  });

  const handleClick = () => {
    if (window.confirm('¿Anular esta venta? Se devolverá el stock y se revertirán descuento y puntos.')) {
      mutation.mutate();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={mutation.isPending}
      title="Cancelar orden"
      className="p-1 rounded-md text-cafe-grayLight hover:text-red-500 hover:bg-red-50 transition-colors"
    >
      <X size={12} />
    </button>
  );
}

// ─── ShiftOrdersPanel ─────────────────────────────────────────────────────────

interface ShiftOrdersPanelProps {
  currency?: string;
}

export function ShiftOrdersPanel({ currency = 'COP' }: ShiftOrdersPanelProps) {
  const fmt = (n: number) => formatAmount(n, currency);
  const [open, setOpen] = useState(false);
  const { activeShift, addToCart } = usePosStore();
  const qc = useQueryClient();

  const { data: orders, isLoading, refetch } = useShiftOrders(activeShift?.id ?? null);

  const completedOrders = orders?.filter((o) => o.status === 'COMPLETED') ?? [];
  const totalSales = completedOrders.reduce((sum, o) => sum + o.total, 0);

  const handleRepeatOrder = (order: any) => {
    const allProducts = qc.getQueryData<Product[]>(['products']);
    const items: any[] = order.items ?? [];
    let added = 0;

    for (const item of items) {
      const productId = item.product?.id ?? item.productId;
      const fullProduct = allProducts?.find((p) => p.id === productId);
      if (!fullProduct || !fullProduct.isActive) continue;

      const mods: SelectedModifier[] = (item.modifiers ?? []).map((m: any) => ({
        groupId: '',
        groupName: '',
        modifierId: m.modifierId ?? m.id,
        name: m.name,
        priceAdjustment: m.priceAdjustment,
      }));

      // addToCart siempre suma 1; para qty > 1 llamamos múltiples veces
      for (let q = 0; q < (item.quantity ?? 1); q++) {
        addToCart(fullProduct, mods);
      }
      added++;
    }

    if (added > 0) setOpen(false);
  };

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cafe-cream hover:bg-cafe-beige text-cafe-black text-xs font-medium transition-colors"
      >
        <History size={13} />
        <span>Órdenes</span>
        {orders && orders.length > 0 && (
          <span className="bg-cafe-terracota text-cafe-onBrand text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">
            {orders.length}
          </span>
        )}
        <ChevronUp
          size={12}
          className={`transition-transform duration-200 ${open ? '' : 'rotate-180'}`}
        />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full left-0 mb-2 w-80 bg-cafe-white rounded-2xl shadow-cafe-xl border border-cafe-beige overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-cafe-beige flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-cafe-black">Órdenes del turno</p>
                {orders && (
                  <p className="text-xs text-cafe-gray">
                    {completedOrders.length} completadas · ${fmt(totalSales)} total
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => refetch()}
                  className="p-1.5 rounded-lg text-cafe-grayLight hover:text-cafe-black hover:bg-cafe-cream transition-colors"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-cafe-grayLight hover:text-cafe-black hover:bg-cafe-cream transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            {/* Lista */}
            <div className="max-h-72 overflow-y-auto divide-y divide-cafe-beige/60">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-cafe-cream rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : !orders || orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-cafe-grayLight">
                  <History size={32} strokeWidth={1} className="opacity-40 mb-2" />
                  <p className="text-xs">Sin órdenes en este turno</p>
                </div>
              ) : (
                orders.map((order) => {
                  const { label, cls } = statusLabel(order.status);
                  return (
                    <div
                      key={order.id}
                      className="px-4 py-2.5 flex items-center gap-3 hover:bg-cafe-cream/50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-cafe-cream flex items-center justify-center shrink-0">
                        <PaymentIcon method={order.paymentMethod} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-cafe-black">
                            #{order.ticketNumber}
                          </p>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cls}`}>
                            {label}
                          </span>
                        </div>
                        <p className="text-[10px] text-cafe-grayLight">
                          {(order as any)._count?.items ?? order.items?.length ?? 0} ítems
                          {(order as any).customer?.name && ` · ${(order as any).customer.name}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-cafe-terracota">${fmt(order.total)}</p>
                        <p className="text-[10px] text-cafe-grayLight">
                          {new Date(order.createdAt).toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {order.status === 'COMPLETED' && (
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleRepeatOrder(order)}
                            title="Repetir pedido"
                            className="p-1 rounded-md text-cafe-grayLight hover:text-cafe-terracota hover:bg-cafe-cream transition-colors"
                          >
                            <RotateCcw size={12} />
                          </button>
                          <CancelOrderButton orderId={order.id} tenantId="" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {orders && orders.length > 0 && (
              <div className="px-4 py-2.5 border-t border-cafe-beige bg-cafe-cream/60">
                <div className="flex justify-between text-xs text-cafe-gray">
                  <span>Total ventas del turno</span>
                  <span className="font-bold text-cafe-black">${fmt(totalSales)}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
