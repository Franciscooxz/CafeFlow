'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActiveStore } from '@/hooks/useActiveStore';
import { useLiveOrders } from '@/hooks/useLiveOrders';
import { BrandLogo, useBrandIdentity } from '@/components/brand/BrandLogo';
import { playReadyChime, unlockAudio } from '@/lib/sound';
import type { KdsOrder } from '@/types';
import { Maximize2, Minimize2, WifiOff } from '@/components/icons';

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen().catch(() => {});
  };
  return { isFullscreen, toggle };
}

const byTime = (a: KdsOrder, b: KdsOrder) => a.statusChangedAt.localeCompare(b.statusChangedAt);

function OrderName({ order, size }: { order: KdsOrder; size: 'lg' | 'xl' }) {
  return (
    <div className="min-w-0">
      <p className={`font-bold leading-tight truncate ${size === 'xl' ? 'text-4xl xl:text-5xl' : 'text-2xl xl:text-3xl'}`}>
        {order.callName ?? `#${order.ticketNumber}`}
      </p>
      {order.callName && <p className="text-sm opacity-60 mt-0.5">#{order.ticketNumber}</p>}
    </div>
  );
}

export default function OrderDisplayPage() {
  const { storeId, stores, canChoose, choose, isLoading: storesLoading } = useActiveStore();
  const { name } = useBrandIdentity();
  const clock = useClock();
  const { isFullscreen, toggle } = useFullscreen();
  const { orders, connected } = useLiveOrders(storeId, { onReady: playReadyChime });

  const preparing = orders.filter((o) => o.fulfillmentStatus !== 'READY').sort(byTime);
  // El más reciente arriba: es el que el cliente está buscando con la mirada.
  const ready = orders.filter((o) => o.fulfillmentStatus === 'READY').sort(byTime).reverse();

  return (
    <div className="h-screen flex flex-col bg-cafe-cream text-cafe-black overflow-hidden" onPointerDown={unlockAudio}>
      <header className="flex items-center justify-between px-8 py-5 bg-cafe-white border-b border-cafe-beige shrink-0">
        <div className="flex items-center gap-4">
          <BrandLogo size={48} />
          <div>
            <p className="text-2xl font-bold leading-tight">{name ?? 'CafeFlow'}</p>
            <p className="text-sm text-cafe-gray">Estado de tu pedido</p>
          </div>
        </div>
        <div className="flex items-center gap-5">
          {canChoose && !isFullscreen && (
            <select
              value={storeId ?? ''}
              onChange={(e) => choose(e.target.value)}
              aria-label="Sede"
              className="input-field py-1.5 text-sm w-auto"
            >
              {!storeId && <option value="">Elige una sede</option>}
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          {!connected && (
            <span className="flex items-center gap-1.5 text-sm text-amber-600">
              <WifiOff size={16} /> Reconectando…
            </span>
          )}
          {clock && (
            <p className="text-3xl font-semibold tabular-nums text-cafe-grayDark">
              {clock.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          <button
            onClick={toggle}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            className="p-2 rounded-xl text-cafe-gray hover:bg-cafe-beige hover:text-cafe-black transition-colors"
          >
            {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
          </button>
        </div>
      </header>

      {!storeId ? (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          {!storesLoading && (
            <p className="text-2xl text-cafe-gray">
              {canChoose ? 'Elige arriba la sede de esta pantalla.' : 'No hay sedes configuradas.'}
            </p>
          )}
        </div>
      ) : (
        <main className="flex-1 grid grid-cols-5 min-h-0">
          <section className="col-span-2 flex flex-col p-8 min-h-0 border-r border-cafe-beige">
            <h2 className="text-xl font-semibold text-cafe-gray uppercase tracking-wider mb-6">Preparando</h2>
            <div className="flex-1 overflow-hidden space-y-4">
              <AnimatePresence initial={false}>
                {preparing.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="text-cafe-grayDark"
                  >
                    <OrderName order={order} size="lg" />
                  </motion.div>
                ))}
              </AnimatePresence>
              {preparing.length === 0 && <p className="text-lg text-cafe-grayLight">—</p>}
            </div>
          </section>

          <section className="col-span-3 flex flex-col p-8 min-h-0 bg-cafe-terracota text-cafe-onBrand">
            <h2 className="text-xl font-semibold uppercase tracking-wider mb-6 opacity-90">¡Listo para recoger!</h2>
            <div className="flex-1 overflow-hidden grid grid-cols-2 gap-x-8 gap-y-6 content-start">
              <AnimatePresence initial={false}>
                {ready.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: [0.6, 1.08, 1] }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                  >
                    <OrderName order={order} size="xl" />
                  </motion.div>
                ))}
              </AnimatePresence>
              {ready.length === 0 && (
                <p className="col-span-2 text-2xl opacity-70">Te avisaremos aquí cuando tu pedido esté listo</p>
              )}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
