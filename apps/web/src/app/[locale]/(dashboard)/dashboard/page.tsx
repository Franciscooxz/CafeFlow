'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useMoney } from '@/hooks/useCurrency';
import {
  useDashboardKPIs,
  useSalesTrend,
  useTopProducts,
  useRecentOrders,
} from '@/hooks/useReports';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Activity,
  Package,
  AlertTriangle,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  CoffeeCupIcon,
} from '@/components/icons';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Empty State genérico ──────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-cafe-cream flex items-center justify-center text-cafe-grayLight">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-cafe-black">{title}</p>
        <p className="text-xs text-cafe-gray mt-0.5 max-w-[200px]">{description}</p>
      </div>
      {action && (
        <Link
          href={action.href}
          className="text-xs font-medium text-cafe-terracota hover:underline mt-1"
        >
          {action.label} →
        </Link>
      )}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  sub,
  icon,
  color,
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-cafe-white rounded-2xl p-5 shadow-cafe border border-cafe-beige/60"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-cafe-gray font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-cafe-black tracking-tight">{value}</p>
      {sub && <p className="text-xs text-cafe-gray mt-1">{sub}</p>}
    </motion.div>
  );
}

// ─── KPI Empty Cards (skeleton informativo, no de carga) ──────────────────────

function KPIEmptyCard({ label, icon, color, delay = 0 }: {
  label: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-cafe-white rounded-2xl p-5 shadow-cafe border border-cafe-beige/60"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-cafe-gray font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-cafe-grayLight">$0</p>
      <p className="text-xs text-cafe-grayLight mt-1">Sin ventas hoy</p>
    </motion.div>
  );
}

// ─── Mini bar chart (SVG puro, sin dependencias) ──────────────────────────────

function SalesBarChart({ data }: { data: { date?: string; label: string; total: number; orders: number }[] }) {
  const { fmtCompact } = useMoney();
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="relative">
      <div className="flex items-end gap-1.5 h-32">
        {data.map((d, i) => {
          const h = Math.max(4, (d.total / maxVal) * 100);
          const isH = hovered === i;
          return (
            <div
              key={d.date ?? i}
              className="flex-1 flex flex-col items-center gap-1 cursor-pointer group relative"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {isH && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-cafe-black text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap z-10 pointer-events-none">
                  ${fmtCompact(d.total)}
                  {d.orders > 0 && <span className="ml-1 opacity-60">({d.orders})</span>}
                </div>
              )}
              <div className="w-full flex items-end" style={{ height: 112 }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: 'easeOut' }}
                  className={`w-full rounded-t-md transition-colors ${
                    isH ? 'bg-cafe-terracota' : d.total > 0 ? 'bg-cafe-terracota/40' : 'bg-cafe-cream'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* Labels */}
      <div className="flex gap-1.5 mt-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-cafe-grayLight leading-none">
              {d.label?.split(' ')[0] ?? ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Payment icon ─────────────────────────────────────────────────────────────

function PaymentIcon({ method }: { method: string }) {
  if (method === 'CASH') return <Banknote size={13} className="text-green-500" />;
  if (method === 'CARD') return <CreditCard size={13} className="text-blue-500" />;
  return <ArrowLeftRight size={13} className="text-purple-500" />;
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { fmt, fmtCompact } = useMoney();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'es';
  const [trendDays, setTrendDays] = useState<7 | 30>(7);

  const { data: kpis, isLoading: kpiLoading } = useDashboardKPIs();
  const { data: trend, isLoading: trendLoading } = useSalesTrend(trendDays);
  const { data: topProducts } = useTopProducts();
  const { data: recentOrders } = useRecentOrders();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  // ¿Negocio nuevo sin ventas?
  const hasNoSales =
    !kpiLoading && kpis && kpis.today.orders === 0 && kpis.month.orders === 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-cafe-black">
            {greeting}
            {user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="text-sm text-cafe-gray mt-0.5">
            {new Date().toLocaleDateString('es-CO', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Banner de bienvenida para negocio nuevo sin ventas */}
      {hasNoSales && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cafe-terracota/5 border border-cafe-terracota/20 rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-cafe-terracota/10 flex items-center justify-center shrink-0 text-cafe-terracota">
            <CoffeeCupIcon size={22} strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-cafe-black text-sm">¡Tu cafetería está lista!</p>
            <p className="text-xs text-cafe-gray mt-0.5">
              Aún no hay ventas registradas. Dirígete al POS para empezar a cobrar.
            </p>
          </div>
          <Link
            href={`/${locale}/pos`}
            className="shrink-0 px-4 py-2 bg-cafe-terracota text-cafe-onBrand text-sm font-medium rounded-xl hover:bg-cafe-terracota2 transition-colors"
          >
            Ir al POS →
          </Link>
        </motion.div>
      )}

      {/* KPI Grid */}
      {kpiLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-cafe-white rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Ventas hoy"
            value={`$${fmtCompact(kpis.today.sales)}`}
            sub={kpis.today.orders > 0 ? `${kpis.today.orders} órdenes` : 'Sin ventas hoy'}
            icon={<DollarSign size={18} className="text-cafe-terracota" />}
            color="bg-cafe-terracota/10"
            delay={0}
          />
          <KPICard
            label="Ventas del mes"
            value={`$${fmtCompact(kpis.month.sales)}`}
            sub={kpis.month.orders > 0 ? `${kpis.month.orders} órdenes` : 'Sin ventas este mes'}
            icon={<TrendingUp size={18} className="text-blue-500" />}
            color="bg-blue-50"
            delay={0.05}
          />
          <KPICard
            label="Ticket promedio"
            value={kpis.today.avgTicket > 0 ? `$${fmtCompact(kpis.today.avgTicket)}` : '—'}
            sub={kpis.today.avgTicket > 0 ? 'hoy' : 'Sin datos hoy'}
            icon={<ShoppingBag size={18} className="text-green-500" />}
            color="bg-green-50"
            delay={0.1}
          />
          <KPICard
            label="Inventario"
            value={String(kpis.inventory.totalProducts)}
            sub={
              kpis.inventory.totalProducts === 0
                ? 'Sin productos aún'
                : kpis.inventory.lowStockProducts > 0
                  ? `⚠ ${kpis.inventory.lowStockProducts} con stock bajo`
                  : 'Stock OK'
            }
            icon={
              kpis.inventory.lowStockProducts > 0 ? (
                <AlertTriangle size={18} className="text-amber-500" />
              ) : (
                <Package size={18} className="text-violet-500" />
              )
            }
            color={
              kpis.inventory.lowStockProducts > 0 ? 'bg-amber-50' : 'bg-violet-50'
            }
            delay={0.15}
          />
        </div>
      ) : null}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tendencia de ventas */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-cafe-white rounded-2xl p-5 shadow-cafe border border-cafe-beige/60"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-cafe-black text-sm flex items-center gap-2">
              <Activity size={16} className="text-cafe-terracota" />
              Tendencia de ventas
            </h2>
            <div className="flex gap-1">
              {([7, 30] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setTrendDays(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    trendDays === d
                      ? 'bg-cafe-terracota text-cafe-onBrand'
                      : 'text-cafe-gray hover:bg-cafe-cream'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {trendLoading ? (
            <div className="h-32 bg-cafe-cream rounded-xl animate-pulse" />
          ) : trend && trend.some((d) => d.total > 0) ? (
            <SalesBarChart data={trend} />
          ) : (
            <EmptyState
              icon={<Activity size={22} strokeWidth={1.2} />}
              title="Sin ventas en este período"
              description="Las ventas aparecerán aquí una vez que registres cobros en el POS."
              action={{ label: 'Ir al POS a cobrar', href: `/${locale}/pos` }}
            />
          )}
        </motion.div>

        {/* Top productos */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-cafe-white rounded-2xl p-5 shadow-cafe border border-cafe-beige/60"
        >
          <h2 className="font-semibold text-cafe-black text-sm mb-4 flex items-center gap-2">
            <Package size={16} className="text-cafe-terracota" />
            Top productos
          </h2>
          {!topProducts || topProducts.length === 0 ? (
            <EmptyState
              icon={<Package size={22} strokeWidth={1.2} />}
              title="Sin datos de ventas"
              description="Los productos más vendidos aparecerán aquí después de las primeras ventas."
            />
          ) : (
            <div className="space-y-2.5">
              {topProducts.slice(0, 5).map((item, i) => {
                const maxRev = topProducts[0]?.revenue ?? 1;
                const pct = Math.round((item.revenue / maxRev) * 100);
                return (
                  <div key={item.product?.id ?? i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-cafe-black font-medium truncate max-w-[120px]">
                        {item.product?.name}
                      </span>
                      <span className="text-cafe-gray">{item.quantity} uds</span>
                    </div>
                    <div className="h-1.5 bg-cafe-cream rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
                        className="h-full bg-cafe-terracota rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Últimas ventas */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-cafe-white rounded-2xl shadow-cafe border border-cafe-beige/60 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-cafe-beige flex items-center justify-between">
          <h2 className="font-semibold text-cafe-black text-sm">Últimas ventas</h2>
          {recentOrders && recentOrders.length > 0 && (
            <Link
              href={`/${locale}/reports`}
              className="text-xs text-cafe-terracota hover:underline"
            >
              Ver todas →
            </Link>
          )}
        </div>
        {!recentOrders || recentOrders.length === 0 ? (
          <EmptyState
            icon={<CoffeeCupIcon size={24} strokeWidth={1.2} />}
            title="Aún no hay ventas registradas"
            description="Cada vez que cobres en el POS, las ventas aparecerán aquí en tiempo real."
            action={{ label: 'Registrar primera venta', href: `/${locale}/pos` }}
          />
        ) : (
          <div className="divide-y divide-cafe-beige">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-5 py-3 flex items-center gap-4 hover:bg-cafe-cream/40 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-cafe-cream flex items-center justify-center shrink-0">
                  <PaymentIcon method={order.paymentMethod} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-cafe-black">
                    Ticket #{order.ticketNumber}
                    <span className="text-cafe-grayLight font-normal ml-2 text-xs">
                      {order._count.items} ítem{order._count.items !== 1 ? 's' : ''}
                    </span>
                  </p>
                  <p className="text-xs text-cafe-gray">
                    {order.user.firstName} · {order.store.name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-cafe-terracota">
                    ${fmt(order.total)}
                  </p>
                  <p className="text-xs text-cafe-grayLight">
                    {new Date(order.createdAt).toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
