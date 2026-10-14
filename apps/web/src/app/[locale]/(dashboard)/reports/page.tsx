'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  useRangeSummary,
} from '@/hooks/useReports';
import { useMoney } from '@/hooks/useCurrency';
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Tag,
  BarChart2,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Calendar,
  FileDown,
  Activity,
  Package,
  PieChart,
} from '@/components/icons';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Date presets ─────────────────────────────────────────────────────────────

type Preset = 'today' | '7d' | '30d' | 'custom';

function getPresetRange(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const toStr = now.toISOString().split('T')[0];

  if (preset === 'today') {
    return { from: toStr, to: toStr };
  }
  if (preset === '7d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    return { from: start.toISOString().split('T')[0], to: toStr };
  }
  if (preset === '30d') {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    return { from: start.toISOString().split('T')[0], to: toStr };
  }
  return { from: toStr, to: toStr };
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; total: number }[] }) {
  const { fmtCompact } = useMoney();
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div>
      <div className="flex items-end gap-1 h-28">
        {data.map((d, i) => {
          const h = Math.max(3, (d.total / maxVal) * 100);
          const isH = hovered === i;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1 relative cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {isH && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-cafe-black text-white text-xs px-2 py-0.5 rounded-lg whitespace-nowrap z-10 pointer-events-none">
                  ${fmtCompact(d.total)}
                </div>
              )}
              <div className="w-full flex items-end" style={{ height: 96 }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.03, duration: 0.4, ease: 'easeOut' }}
                  className={`w-full rounded-t-sm transition-colors ${
                    isH ? 'bg-cafe-terracota' : 'bg-cafe-terracota/40'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-cafe-grayLight">{d.label?.split(' ')[0] ?? ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Horizontal bar (categorías / pagos) ──────────────────────────────────────

function HBar({
  label,
  value,
  max,
  color,
  sub,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  sub?: string;
}) {
  const { fmtCompact } = useMoney();
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 2;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-cafe-black font-medium truncate max-w-[140px]">{label}</span>
        <div className="text-right">
          <span className="text-cafe-black font-bold">${fmtCompact(value)}</span>
          {sub && <span className="text-cafe-grayLight ml-1.5">{sub}</span>}
        </div>
      </div>
      <div className="h-2 bg-cafe-cream rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
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
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-cafe-white rounded-2xl p-4 shadow-cafe border border-cafe-beige/60">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-cafe-gray font-medium">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-xl font-bold text-cafe-black">{value}</p>
      {sub && <p className="text-xs text-cafe-gray mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportCSV(data: any, filename: string, range?: { from?: string; to?: string }) {
  if (!data) return;

  const esc = (v: any) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const row = (cells: any[]) => cells.map(esc).join(',');

  const sections: string[] = [];

  // ── Encabezado del reporte ──
  sections.push(row(['REPORTE CAFEFLOW']));
  sections.push(row(['Período', `${range?.from ?? ''} → ${range?.to ?? ''}`]));
  sections.push(row(['Generado', new Date().toLocaleString('es-CO')]));
  sections.push('');

  // ── KPIs resumen ──
  if (data.summary) {
    sections.push(row(['RESUMEN GENERAL']));
    sections.push(row(['Total ventas', data.summary.totalSales]));
    sections.push(row(['Total órdenes', data.summary.totalOrders]));
    sections.push(row(['Ticket promedio', data.summary.avgTicket]));
    sections.push(row(['Total descuentos', data.summary.totalDiscount]));
    sections.push('');
  }

  // ── Tendencia de ventas ──
  if (data.trend?.length > 0) {
    sections.push(row(['TENDENCIA DE VENTAS']));
    sections.push(row(['Fecha', 'Total Ventas', 'Órdenes', 'Ticket Promedio']));
    for (const t of data.trend) {
      const avg = t.orders > 0 ? Math.round(t.total / t.orders) : 0;
      sections.push(row([t.date, t.total, t.orders, avg]));
    }
    sections.push('');
  }

  // ── Top productos ──
  if (data.topProducts?.length > 0) {
    sections.push(row(['PRODUCTOS MÁS VENDIDOS']));
    sections.push(row(['#', 'Producto', 'Unidades', 'Ingresos']));
    data.topProducts.forEach((item: any, i: number) => {
      sections.push(row([i + 1, item.product?.name ?? '—', item.quantity, item.revenue]));
    });
    sections.push('');
  }

  // ── Ventas por categoría ──
  if (data.categories?.length > 0) {
    sections.push(row(['VENTAS POR CATEGORÍA']));
    sections.push(row(['Categoría', 'Unidades', 'Ingresos']));
    for (const cat of data.categories) {
      sections.push(row([cat.name, cat.quantity, cat.revenue]));
    }
    sections.push('');
  }

  // ── Métodos de pago ──
  if (data.payments?.length > 0) {
    sections.push(row(['MÉTODOS DE PAGO']));
    sections.push(row(['Método', 'Órdenes', 'Total']));
    for (const p of data.payments) {
      sections.push(row([p.label ?? p.method, p.count, p.total]));
    }
  }

  // BOM UTF-8 para compatibilidad con Excel
  const csv = '\uFEFF' + sections.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Reports Page ─────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { fmtCompact } = useMoney();
  const [preset, setPreset] = useState<Preset>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const range = useMemo(() => {
    if (preset === 'custom' && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    if (preset === 'custom') return undefined;
    return getPresetRange(preset);
  }, [preset, customFrom, customTo]);

  const { data, isLoading } = useRangeSummary(range?.from, range?.to);

  const presets: { key: Preset; label: string }[] = [
    { key: 'today', label: 'Hoy' },
    { key: '7d', label: '7 días' },
    { key: '30d', label: '30 días' },
    { key: 'custom', label: 'Personalizado' },
  ];

  const totalPayments = data?.payments?.reduce((s, p) => s + p.total, 0) ?? 0;
  const maxCatRevenue = Math.max(...(data?.categories?.map((c) => c.revenue) ?? [0]), 1);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-cafe-black flex items-center gap-2">
            <BarChart2 size={20} className="text-cafe-terracota" />
            Reportes
          </h1>
          <p className="text-sm text-cafe-gray mt-0.5">Análisis de ventas y rendimiento</p>
        </div>

        {/* Acciones */}
        <button
          onClick={() =>
            exportCSV(data, `cafeflow-reporte-${range?.from ?? 'periodo'}.csv`, range)
          }
          disabled={!data || isLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cafe-cream text-cafe-black text-sm font-medium hover:bg-cafe-beige transition-colors disabled:opacity-40"
        >
          <FileDown size={15} />
          Exportar CSV
        </button>
      </div>

      {/* Filtro de rango */}
      <div className="bg-cafe-white rounded-2xl shadow-cafe border border-cafe-beige/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar size={15} className="text-cafe-gray" />
          <div className="flex gap-1.5 flex-wrap">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => setPreset(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  preset === p.key
                    ? 'bg-cafe-terracota text-cafe-onBrand'
                    : 'bg-cafe-cream text-cafe-gray hover:bg-cafe-beige'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="input-field text-xs py-1.5 w-36"
              />
              <span className="text-cafe-gray text-xs">→</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="input-field text-xs py-1.5 w-36"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-cafe-white rounded-2xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <KPICard
            label="Total ventas"
            value={`$${fmtCompact(data.summary.totalSales)}`}
            sub={`${data.summary.totalOrders} órdenes`}
            icon={<DollarSign size={16} className="text-cafe-terracota" />}
            color="bg-cafe-terracota/10"
          />
          <KPICard
            label="Ticket promedio"
            value={`$${fmtCompact(data.summary.avgTicket)}`}
            sub="por orden"
            icon={<ShoppingBag size={16} className="text-blue-500" />}
            color="bg-blue-50"
          />
          <KPICard
            label="Órdenes"
            value={String(data.summary.totalOrders)}
            sub="completadas"
            icon={<TrendingUp size={16} className="text-green-500" />}
            color="bg-green-50"
          />
          <KPICard
            label="Descuentos"
            value={`$${fmtCompact(data.summary.totalDiscount)}`}
            sub="aplicados"
            icon={<Tag size={16} className="text-purple-500" />}
            color="bg-purple-50"
          />
        </motion.div>
      ) : null}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tendencia */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-cafe-white rounded-2xl p-5 shadow-cafe border border-cafe-beige/60"
        >
          <h2 className="font-semibold text-cafe-black text-sm mb-4 flex items-center gap-2">
            <Activity size={15} className="text-cafe-terracota" />
            Tendencia de ventas
          </h2>
          {isLoading ? (
            <div className="h-28 bg-cafe-cream rounded-xl animate-pulse" />
          ) : data?.trend && data.trend.length > 0 ? (
            <BarChart data={data.trend} />
          ) : (
            <div className="h-28 flex items-center justify-center text-cafe-grayLight text-sm">
              Sin datos en este período
            </div>
          )}
        </motion.div>

        {/* Métodos de pago */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-cafe-white rounded-2xl p-5 shadow-cafe border border-cafe-beige/60"
        >
          <h2 className="font-semibold text-cafe-black text-sm mb-4 flex items-center gap-2">
            <PieChart size={15} className="text-cafe-terracota" />
            Métodos de pago
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 bg-cafe-cream rounded animate-pulse" />
              ))}
            </div>
          ) : data?.payments && data.payments.some((p) => p.total > 0) ? (
            <div className="space-y-3">
              {data.payments.map((p) => {
                const Icon =
                  p.method === 'CASH'
                    ? Banknote
                    : p.method === 'CARD'
                    ? CreditCard
                    : ArrowLeftRight;
                const barColor =
                  p.method === 'CASH'
                    ? 'bg-green-400'
                    : p.method === 'CARD'
                    ? 'bg-blue-400'
                    : 'bg-purple-400';

                return (
                  <div key={p.method}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1.5 text-cafe-black font-medium">
                        <Icon size={13} />
                        {p.label}
                      </span>
                      <span className="text-cafe-gray">{p.count} órd.</span>
                    </div>
                    <HBar
                      label=""
                      value={p.total}
                      max={totalPayments}
                      color={barColor}
                      sub={`$${fmtCompact(p.total)}`}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-28 flex items-center justify-center text-cafe-grayLight text-sm">
              Sin datos
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom row: categorías + top productos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ventas por categoría */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-cafe-white rounded-2xl p-5 shadow-cafe border border-cafe-beige/60"
        >
          <h2 className="font-semibold text-cafe-black text-sm mb-4 flex items-center gap-2">
            <Package size={15} className="text-cafe-terracota" />
            Ventas por categoría
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-cafe-cream rounded animate-pulse" />
              ))}
            </div>
          ) : data?.categories && data.categories.length > 0 ? (
            <div className="space-y-3">
              {data.categories.slice(0, 6).map((cat) => (
                <HBar
                  key={cat.id}
                  label={cat.name}
                  value={cat.revenue}
                  max={maxCatRevenue}
                  color={cat.color ? '' : 'bg-cafe-terracota/60'}
                  sub={`${cat.quantity} uds`}
                />
              ))}
            </div>
          ) : (
            <div className="h-28 flex items-center justify-center text-cafe-grayLight text-sm">
              Sin datos
            </div>
          )}
        </motion.div>

        {/* Top productos */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-cafe-white rounded-2xl p-5 shadow-cafe border border-cafe-beige/60"
        >
          <h2 className="font-semibold text-cafe-black text-sm mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-cafe-terracota" />
            Productos más vendidos
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-cafe-cream rounded animate-pulse" />
              ))}
            </div>
          ) : data?.topProducts && data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.slice(0, 6).map((item, i) => {
                const maxRev = data.topProducts[0]?.revenue ?? 1;
                return (
                  <div key={item.product?.id ?? i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cafe-black font-medium truncate max-w-[150px]">
                        {i + 1}. {item.product?.name}
                      </span>
                      <div className="text-right">
                        <span className="text-cafe-black font-bold">
                          ${fmtCompact(item.revenue)}
                        </span>
                        <span className="text-cafe-grayLight ml-1.5">{item.quantity} uds</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-cafe-cream rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(2, (item.revenue / maxRev) * 100)}%` }}
                        transition={{ delay: 0.3 + i * 0.04, duration: 0.5 }}
                        className="h-full bg-cafe-terracota rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-28 flex items-center justify-center text-cafe-grayLight text-sm">
              Sin datos
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
