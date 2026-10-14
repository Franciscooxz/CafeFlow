'use client';

import { useEffect, useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActiveStore } from '@/hooks/useActiveStore';
import { useLiveOrders } from '@/hooks/useLiveOrders';
import { playNewOrderBeep, unlockAudio } from '@/lib/sound';
import type { FulfillmentStatus, KdsOrder } from '@/types';
import {
  ChefHat,
  Check,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  CoffeeCupIcon,
  Flame,
  HandPlatter,
  Undo2,
  AlertTriangle,
  X,
} from '@/components/icons';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function secondsSince(iso: string, now: number) {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

function waitColor(seconds: number): string {
  if (seconds < 120) return 'text-green-400';
  if (seconds < 300) return 'text-amber-400';
  return 'text-red-400';
}

const COLUMNS: Array<{ status: FulfillmentStatus; title: string; empty: string; accent: string }> = [
  { status: 'RECEIVED', title: 'Recibidos', empty: 'Sin pedidos nuevos', accent: 'bg-sky-400' },
  { status: 'PREPARING', title: 'En preparación', empty: 'Nada en preparación', accent: 'bg-amber-400' },
  { status: 'READY', title: 'Listos', empty: 'Nada esperando entrega', accent: 'bg-green-400' },
];

const ACTIONS: Record<
  Exclude<FulfillmentStatus, 'DELIVERED'>,
  { next: FulfillmentStatus; label: string; icon: React.ReactNode; undo?: FulfillmentStatus; skip?: { to: FulfillmentStatus; label: string } }
> = {
  RECEIVED: {
    next: 'PREPARING',
    label: 'Empezar',
    icon: <Flame size={15} />,
    skip: { to: 'READY', label: 'Ya está listo' },
  },
  PREPARING: { next: 'READY', label: 'Listo', icon: <Check size={15} />, undo: 'RECEIVED' },
  READY: { next: 'DELIVERED', label: 'Entregado', icon: <HandPlatter size={15} />, undo: 'PREPARING' },
};

// ─── Order Card ───────────────────────────────────────────────────────────────

// AnimatePresence mode="popLayout" necesita el ref para medir la tarjeta que sale.
const OrderCard = forwardRef<
  HTMLDivElement,
  { order: KdsOrder; now: number; onStatus: (id: string, status: FulfillmentStatus) => void }
>(function OrderCard({ order, now, onStatus }, ref) {
  const status = order.fulfillmentStatus as Exclude<FulfillmentStatus, 'DELIVERED'>;
  const action = ACTIONS[status];
  const waited = secondsSince(order.createdAt, now);
  const readyFor = secondsSince(order.statusChangedAt, now);

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="bg-cafe-black border border-white/10 rounded-2xl overflow-hidden flex flex-col"
    >
      <div className="px-4 py-3 flex items-start justify-between gap-2 border-b border-white/10">
        <div className="min-w-0">
          <p className="text-white font-bold text-lg leading-tight truncate">
            {order.callName ?? `#${order.ticketNumber}`}
          </p>
          <p className="text-cafe-grayLight text-xs truncate">
            {order.callName && `#${order.ticketNumber}`}
            {order.table && `${order.callName ? ' · ' : ''}${order.table}`}
          </p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-mono font-bold shrink-0 ${waitColor(waited)}`}>
          <Clock size={12} />
          {formatElapsed(waited)}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="w-6 h-6 rounded-lg bg-cafe-terracota/20 text-cafe-terracota text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {item.quantity}
            </span>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">{item.name}</p>
              {item.modifiers.length > 0 && (
                <p className="text-cafe-grayLight text-xs mt-0.5">{item.modifiers.join(' · ')}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-white/10 space-y-2">
        {status === 'READY' && (
          <p className="text-xs text-green-400/80 text-center">Listo hace {formatElapsed(readyFor)}</p>
        )}
        <div className="flex gap-2">
          {action.undo && (
            <button
              onClick={() => onStatus(order.id, action.undo!)}
              title="Deshacer"
              aria-label="Deshacer"
              className="px-3 rounded-xl bg-white/5 text-cafe-grayLight hover:bg-white/10 hover:text-white transition-colors"
            >
              <Undo2 size={15} />
            </button>
          )}
          <button
            onClick={() => onStatus(order.id, action.next)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cafe-terracota text-cafe-onBrand hover:bg-cafe-terracota2 text-sm font-semibold transition-colors"
          >
            {action.icon}
            {action.label}
          </button>
        </div>
        {action.skip && (
          <button
            onClick={() => onStatus(order.id, action.skip!.to)}
            className="w-full text-xs text-cafe-grayLight hover:text-white transition-colors py-1"
          >
            {action.skip.label}
          </button>
        )}
      </div>
    </motion.div>
  );
});

// ─── Kitchen Page ─────────────────────────────────────────────────────────────

export default function KitchenPage() {
  const { storeId, stores, canChoose, choose, isLoading: storesLoading } = useActiveStore();
  const now = useNow(1000);
  const { orders, loading, error, connected, reload, setStatus, clearError } = useLiveOrders(storeId, {
    onNewOrder: playNewOrderBeep,
  });

  const byStatus = (status: FulfillmentStatus) =>
    orders
      .filter((o) => o.fulfillmentStatus === status)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="sidebar-fixed min-h-screen bg-[#0F0F0F] flex flex-col" onPointerDown={unlockAudio}>
      <header className="bg-cafe-black border-b border-white/10 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-cafe-terracota">
            <ChefHat size={22} />
          </span>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Barra y cocina</p>
            <p className="text-cafe-grayLight text-xs leading-tight">Pedidos en tiempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {canChoose && (
            <select
              value={storeId ?? ''}
              onChange={(e) => choose(e.target.value)}
              aria-label="Sede"
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
            >
              {!storeId && <option value="">Elige una sede</option>}
              {stores.map((s) => (
                <option key={s.id} value={s.id} className="text-black">
                  {s.name}
                </option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-1.5 text-xs">
            {connected ? (
              <>
                <Wifi size={13} className="text-green-400" />
                <span className="text-green-400">En vivo</span>
              </>
            ) : (
              <>
                <WifiOff size={13} className="text-amber-400" />
                <span className="text-amber-400">Reconectando…</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg">
            <span className="text-cafe-terracota font-bold text-sm">{orders.length}</span>
            <span className="text-cafe-grayLight text-xs">{orders.length === 1 ? 'pedido' : 'pedidos'}</span>
          </div>
          <button
            onClick={reload}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cafe-grayLight hover:text-white transition-colors"
            title="Recargar pedidos"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-300">
          <AlertTriangle size={15} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={clearError} aria-label="Cerrar" className="text-red-300/70 hover:text-red-200">
            <X size={14} />
          </button>
        </div>
      )}

      <main className="flex-1 p-4 overflow-auto">
        {!storeId && !storesLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <ChefHat size={48} strokeWidth={1} className="text-white/20 mb-4" />
            <p className="text-white/60 text-lg font-medium">
              {canChoose ? 'Elige la sede de esta pantalla' : 'No hay sedes configuradas'}
            </p>
            <p className="text-white/30 text-sm mt-1">
              {canChoose ? 'Usa el selector de arriba; se recordará en este dispositivo' : 'Crea una sede en Configuración'}
            </p>
          </div>
        ) : loading || storesLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-cafe-terracota mb-3"
            >
              <CoffeeCupIcon size={36} strokeWidth={1.2} />
            </motion.div>
            <p className="text-cafe-grayLight text-sm">Cargando pedidos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {COLUMNS.map((col) => {
              const list = byStatus(col.status);
              return (
                <section key={col.status} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className={`w-2 h-2 rounded-full ${col.accent}`} />
                    <h2 className="text-white/80 text-sm font-semibold">{col.title}</h2>
                    <span className="text-white/40 text-xs">{list.length}</span>
                  </div>
                  {list.length === 0 ? (
                    <p className="text-white/25 text-sm text-center py-10 border border-dashed border-white/10 rounded-2xl">
                      {col.empty}
                    </p>
                  ) : (
                    <motion.div layout className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {list.map((order) => (
                          <OrderCard key={order.id} order={order} now={now} onStatus={setStatus} />
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 px-6 py-2 flex items-center justify-between">
        <p className="text-white/20 text-xs">El botón de cada pedido lo pasa al siguiente estado · ↶ deshace un paso</p>
        <p className="text-white/20 text-xs">CafeFlow · Últimas 12 horas</p>
      </footer>
    </div>
  );
}
