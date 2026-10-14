'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { ProductGrid } from './ProductGrid';
import { Cart } from './Cart';
import { PaymentModal } from './PaymentModal';
import { ModifierModal } from './ModifierModal';
import { ShiftOrdersPanel } from './ShiftOrdersPanel';
import { Button } from '@/components/ui/Button';
import { usePosStore } from '@/store/pos.store';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationStore } from '@/store/notification.store';
import { useCurrentShift, useOpenShift, useCloseShift, useShiftOrders } from '@/hooks/usePOS';
import { useLogout } from '@/hooks/useAuth';
import { useMoney } from '@/hooks/useCurrency';
import {
  CoffeeCupIcon,
  Moon,
  AlertTriangle,
  LogOut,
  LayoutDashboard,
  Keyboard,
  Bell,
  X,
  ChefHat,
  MonitorPlay,
} from '@/components/icons';
import { BrandLogo, useBrandIdentity } from '@/components/brand/BrandLogo';
import type { Shift } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

// ─── Modal de cierre de turno ──────────────────────────────────────────────────

function CloseShiftModal({
  shift,
  onClose,
}: {
  shift: Shift;
  onClose: () => void;
}) {
  const t = useTranslations('pos');
  const closeShift = useCloseShift();
  const [cash, setCash] = useState('');
  const { data: orders } = useShiftOrders(shift.id);

  const { fmt } = useMoney();

  const diff = parseFloat(cash) - shift.openingCash;

  // Calcular resumen del turno
  const completed = orders?.filter((o) => o.status === 'COMPLETED') ?? [];
  const cancelled = orders?.filter((o) => o.status === 'CANCELLED') ?? [];
  const totalSales = completed.reduce((s, o) => s + o.total, 0);
  const cashTotal = completed.filter((o) => o.paymentMethod === 'CASH').reduce((s, o) => s + o.total, 0);
  const cardTotal = completed.filter((o) => o.paymentMethod === 'CARD').reduce((s, o) => s + o.total, 0);
  const mixedTotal = completed.filter((o) => o.paymentMethod === 'MIXED').reduce((s, o) => s + o.total, 0);

  const duration = Math.round(
    (Date.now() - new Date(shift.openedAt).getTime()) / 60000,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cafe-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-cafe-white rounded-3xl shadow-cafe-xl p-6 space-y-5"
      >
        <div>
          <h2 className="text-lg font-semibold text-cafe-black flex items-center gap-2">
            <Moon size={18} className="text-cafe-gray" />
            {t('closeShift')}
          </h2>
          <p className="text-sm text-cafe-gray mt-1">
            Iniciado:{' '}
            {new Date(shift.openedAt).toLocaleTimeString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {' · '}{duration >= 60
              ? `${Math.floor(duration / 60)}h ${duration % 60}m`
              : `${duration} min`}
          </p>
        </div>

        {/* Resumen del turno */}
        <div className="bg-cafe-cream rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-cafe-gray uppercase tracking-wide">
            Resumen del turno
          </p>

          {/* Total ventas */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-cafe-black font-medium">Total ventas</span>
            <span className="text-base font-bold text-cafe-terracota">${fmt(totalSales)}</span>
          </div>

          {/* Órdenes */}
          <div className="flex justify-between text-xs text-cafe-gray border-t border-cafe-beige pt-2">
            <span>{completed.length} completadas</span>
            {cancelled.length > 0 && <span className="text-red-400">{cancelled.length} canceladas</span>}
          </div>

          {/* Desglose por método de pago */}
          {totalSales > 0 && (
            <div className="space-y-1 border-t border-cafe-beige pt-2">
              {cashTotal > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-cafe-gray flex items-center gap-1">💵 Efectivo</span>
                  <span className="font-medium">${fmt(cashTotal)}</span>
                </div>
              )}
              {cardTotal > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-cafe-gray flex items-center gap-1">💳 Tarjeta</span>
                  <span className="font-medium">${fmt(cardTotal)}</span>
                </div>
              )}
              {mixedTotal > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-cafe-gray flex items-center gap-1">🔀 Mixto</span>
                  <span className="font-medium">${fmt(mixedTotal)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Efectivo de cierre */}
        <div>
          <label className="block text-sm font-medium text-cafe-grayDark mb-1.5">
            {t('closingCash')}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cafe-gray text-sm">$</span>
            <input
              type="number"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              placeholder="0"
              autoFocus
              className="input-field pl-7 text-lg font-bold"
            />
          </div>
        </div>

        {cash && (
          <div className="bg-cafe-cream rounded-xl p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-cafe-gray">Apertura</span>
              <span className="font-medium">${fmt(shift.openingCash)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cafe-gray">Cierre</span>
              <span className="font-medium">${fmt(parseFloat(cash) || 0)}</span>
            </div>
            <div className="flex justify-between border-t border-cafe-beige pt-1">
              <span className="text-cafe-gray">Diferencia</span>
              <span className={`font-bold ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {diff >= 0 ? '+' : ''}{fmt(diff)}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" size="lg" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            size="lg"
            loading={closeShift.isPending}
            onClick={async () => {
              await closeShift.mutateAsync({
                shiftId: shift.id,
                closingCash: parseFloat(cash) || 0,
              });
              onClose();
            }}
            className="flex-[2]"
          >
            {t('closeShift')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Campana de notificaciones ─────────────────────────────────────────────────

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, clearAll } = useNotificationStore();

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open && unreadCount > 0) markAllRead();
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        title="Alertas de stock"
        className="relative p-1.5 rounded-lg text-cafe-grayLight hover:text-white hover:bg-white/10 transition-colors"
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-400 text-cafe-black text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-72 bg-cafe-white rounded-2xl shadow-cafe-xl border border-cafe-beige overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-cafe-beige flex items-center justify-between">
              <p className="text-sm font-semibold text-cafe-black flex items-center gap-1.5">
                <Bell size={13} className="text-amber-500" />
                Alertas de stock
              </p>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-[10px] text-cafe-grayLight hover:text-red-400 transition-colors"
                  >
                    Limpiar
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 text-cafe-grayLight hover:text-cafe-black transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-cafe-grayLight">
                  <Bell size={28} strokeWidth={1} className="opacity-30 mb-2" />
                  <p className="text-xs">Sin alertas</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-2.5 flex items-start gap-3 border-b border-cafe-beige/60 last:border-0 ${
                      n.read ? 'opacity-60' : ''
                    }`}
                  >
                    <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-cafe-black truncate">{n.productName}</p>
                      <p className="text-[10px] text-amber-600">
                        Stock bajo: {n.stock} unidades
                      </p>
                    </div>
                    <p className="text-[10px] text-cafe-grayLight shrink-0">
                      {n.time.toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Panel de atajos de teclado ────────────────────────────────────────────────

function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { key: '/', desc: 'Enfocar búsqueda de productos' },
    { key: 'Enter', desc: 'Agregar único resultado (en buscador)' },
    { key: 'Esc', desc: 'Cerrar modal / limpiar búsqueda' },
    { key: 'F2', desc: 'Abrir cobro (con items en carrito)' },
    { key: 'Scanner', desc: 'Lector de código de barras USB (auto-agrega)' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cafe-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-cafe-white rounded-3xl shadow-cafe-xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-cafe-black flex items-center gap-2">
            <Keyboard size={18} className="text-cafe-terracota" />
            Atajos de teclado
          </h2>
          <button
            onClick={onClose}
            className="text-cafe-grayLight hover:text-cafe-gray text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map(({ key, desc }) => (
            <div key={key} className="flex items-center gap-3">
              <kbd className="min-w-[52px] text-center px-2 py-1 bg-cafe-cream border border-cafe-grayLight rounded-lg text-xs font-mono font-semibold text-cafe-black shrink-0">
                {key}
              </kbd>
              <span className="text-sm text-cafe-gray">{desc}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-cafe-grayLight text-center pt-1">
          Presiona cualquier tecla para cerrar
        </p>
      </motion.div>
    </div>
  );
}

// ─── POSLayout principal ───────────────────────────────────────────────────────

export function POSLayout() {
  const locale = useLocale();
  const t = useTranslations('pos');
  const { user } = useAuthStore();
  const brand = useBrandIdentity();
  const logout = useLogout();
  const qc = useQueryClient();
  const {
    activeShift,
    isPaymentModalOpen,
    modifierProduct,
    cart,
    applyOptimisticStock,
    setPaymentModalOpen,
    closeModifierModal,
  } = usePosStore();
  const { isLoading: shiftLoading } = useCurrentShift();
  const openShift = useOpenShift();
  const hasAutoOpened = useRef(false);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // ─── Auto-turno ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (
      !shiftLoading &&
      !activeShift &&
      user?.storeId &&
      !hasAutoOpened.current &&
      !openShift.isPending
    ) {
      hasAutoOpened.current = true;
      openShift.mutate({ storeId: user.storeId, openingCash: 0 });
    }
  }, [shiftLoading, activeShift, user?.storeId, openShift.isPending]);

  // ─── Atajos de teclado globales ───────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      const isInputFocused =
        tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // "?" o "Shift+/" → mostrar panel de atajos
      if (e.key === '?' && !isInputFocused) {
        e.preventDefault();
        setShowShortcuts((s) => !s);
        return;
      }

      // Escape → cerrar paneles (PaymentModal y ModifierModal los manejan internamente)
      if (e.key === 'Escape') {
        if (showShortcuts) { setShowShortcuts(false); return; }
        if (showCloseModal) { setShowCloseModal(false); return; }
        if (modifierProduct) { closeModifierModal(); return; }
        return;
      }

      // "/" → enfocar búsqueda de productos (solo si no hay modal abierto y no en input)
      if (e.key === '/' && !isInputFocused && !isPaymentModalOpen && !modifierProduct) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('pos:focus-search'));
        return;
      }

      // F2 → abrir modal de pago (si hay items y hay turno activo)
      if (e.key === 'F2' && !isPaymentModalOpen && cart.length > 0 && activeShift) {
        e.preventDefault();
        setPaymentModalOpen(true);
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isPaymentModalOpen,
    modifierProduct,
    showShortcuts,
    showCloseModal,
    cart.length,
    activeShift,
    closeModifierModal,
    setPaymentModalOpen,
  ]);

  // ─── WebSocket ───────────────────────────────────────────────────────────
  // withCredentials=true envía la cookie httpOnly access_token automáticamente.
  // Los cookies de localhost aplican a todos los puertos (RFC 6265).
  useEffect(() => {
    const sock = io(`${WS_URL}/pos`, {
      withCredentials: true,
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });

    sock.on('connect', () => setWsConnected(true));
    sock.on('disconnect', () => setWsConnected(false));

    sock.on('stock:updated', ({ products }: { products: Array<{ id: string; stock: number }> }) => {
      const updates: Record<string, number> = {};
      for (const p of products) updates[p.id] = p.stock;
      applyOptimisticStock(updates);
      qc.invalidateQueries({ queryKey: ['products'] });
    });

    sock.on('order:created', () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    });

    sock.on('stock:low', ({ product }: { product: { id: string; name: string; stock: number } }) => {
      useNotificationStore.getState().addStockAlert(product.id, product.name, product.stock);
    });

    setSocket(sock);
    return () => { sock.disconnect(); };
  }, []);

  const currency = activeShift?.store?.currency ?? 'COP';
  const storeId = user?.storeId ?? activeShift?.storeId ?? '';

  // ─── Pantalla de carga ────────────────────────────────────────────────────
  if (shiftLoading || openShift.isPending) {
    return (
      <div className="min-h-screen bg-cafe-cream flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block text-cafe-terracota mb-3"
          >
            <CoffeeCupIcon size={40} strokeWidth={1.2} />
          </motion.div>
          <p className="text-cafe-gray text-sm">
            {openShift.isPending ? 'Iniciando turno...' : 'Cargando POS...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-cafe-cream flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-cafe-black text-cafe-white px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <BrandLogo size={brand.logoUrl ? 28 : 20} className="rounded-md" />
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight truncate max-w-[180px]">{brand.name ?? 'CafeFlow POS'}</p>
            <p className="text-xs text-cafe-gray leading-tight truncate max-w-[180px]">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Indicador WebSocket */}
          <div
            title={wsConnected ? 'En tiempo real' : 'Sin conexión en tiempo real'}
            className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'}`}
          />

          {/* Hint atajos de teclado */}
          <span className="hidden md:flex items-center gap-2 text-[10px] text-cafe-grayLight/60 px-2 border-l border-white/10 ml-1">
            <span><kbd className="font-mono">/</kbd> buscar</span>
            <span><kbd className="font-mono">F2</kbd> cobrar</span>
            <span><kbd className="font-mono">?</kbd> atajos</span>
          </span>

          {/* Shift info */}
          {activeShift && (
            <span className="text-xs text-cafe-grayLight px-2">
              Turno activo desde{' '}
              {new Date(activeShift.openedAt).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}

          {/* Campana de notificaciones */}
          <NotificationBell />

          {/* Panel de órdenes del turno */}
          {activeShift && <ShiftOrdersPanel currency={currency} />}

          {/* Barra y pantalla de clientes: en otra pestaña para no perder el POS */}
          <a
            href={`/${locale}/kitchen`}
            target="_blank"
            rel="noopener"
            title="Barra y cocina"
            aria-label="Barra y cocina"
            className="p-2 rounded-lg text-cafe-grayLight hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChefHat size={15} />
          </a>
          <a
            href={`/${locale}/display`}
            target="_blank"
            rel="noopener"
            title="Pantalla de pedidos"
            aria-label="Pantalla de pedidos"
            className="p-2 rounded-lg text-cafe-grayLight hover:text-white hover:bg-white/10 transition-colors"
          >
            <MonitorPlay size={15} />
          </a>

          {/* Botón atajos */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcuts(true)}
            className="text-cafe-grayLight hover:text-white hover:bg-white/10"
            title="Atajos de teclado (?)"
          >
            <Keyboard size={15} />
          </Button>

          {/* Cerrar turno */}
          {activeShift && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCloseModal(true)}
              className="text-cafe-grayLight hover:text-white hover:bg-white/10 text-xs flex items-center gap-1.5"
            >
              <Moon size={12} />
              Cerrar turno
            </Button>
          )}

          {/* Ir al dashboard */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.location.href = `/${locale}/dashboard`;
            }}
            className="text-cafe-grayLight hover:text-white hover:bg-white/10"
            title="Dashboard"
          >
            <LayoutDashboard size={15} />
          </Button>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout.mutate()}
            className="text-cafe-grayLight hover:text-red-400 hover:bg-red-400/10"
            title="Cerrar sesión"
          >
            <LogOut size={15} />
          </Button>
        </div>
      </header>

      {/* Sin storeId — alerta informativa */}
      <AnimatePresence>
        {!user?.storeId && !activeShift && !shiftLoading && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50 border-b border-amber-200 overflow-hidden"
          >
            <div className="px-4 py-2 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700">
                Tu usuario no tiene una sede asignada. Pide al administrador que te asigne una.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main — productos | carrito */}
      <div className="flex-1 flex overflow-hidden p-3 gap-3">
        <div className="flex-1 bg-cafe-white rounded-2xl shadow-cafe overflow-hidden">
          <ProductGrid />
        </div>
        <div className="w-80 shrink-0">
          <Cart currency={currency} />
        </div>
      </div>

      {/* Modal cierre turno */}
      {showCloseModal && activeShift && (
        <CloseShiftModal
          shift={activeShift}
          onClose={() => setShowCloseModal(false)}
        />
      )}

      {/* Panel de atajos */}
      {showShortcuts && <ShortcutsPanel onClose={() => setShowShortcuts(false)} />}

      {/* Modal de pago */}
      {isPaymentModalOpen && <PaymentModal storeId={storeId} />}
      {modifierProduct && <ModifierModal />}
    </div>
  );
}
