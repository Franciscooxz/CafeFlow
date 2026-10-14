'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAllDiscounts, useCreateDiscount, useToggleDiscount } from '@/hooks/useAdmin';
import { useMoney } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/Button';
import {
  Tag,
  Plus,
  ToggleLeft,
  ToggleRight,
  Percent,
  Gift,
  Copy,
} from '@/components/icons';

function DiscountModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (d: any) => Promise<void>;
}) {
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!code.trim() || !value) { setError('Código y valor son requeridos'); return; }
    setLoading(true);
    setError('');
    try {
      await onSave({
        code: code.trim().toUpperCase(),
        type,
        value: parseFloat(value),
        minOrder: parseFloat(minOrder) || 0,
        maxUses: maxUses ? parseInt(maxUses) : undefined,
        expiresAt: expiresAt || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al crear el descuento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cafe-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-cafe-white rounded-3xl shadow-cafe-xl"
      >
        <div className="px-6 py-5 border-b border-cafe-beige">
          <h3 className="font-semibold text-cafe-black">Nuevo código de descuento</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-cafe-grayDark mb-2">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'PERCENTAGE', label: 'Porcentaje %', icon: <Percent size={16} /> },
                { key: 'FIXED', label: 'Monto fijo $', icon: <Gift size={16} /> },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key as any)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    type === t.key
                      ? 'border-cafe-terracota bg-cafe-terracota/5 text-cafe-black'
                      : 'border-cafe-beige text-cafe-grayDark'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-cafe-grayDark mb-1.5">Código</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CAFE10"
                className="input-field uppercase"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cafe-grayDark mb-1.5">
                Valor {type === 'PERCENTAGE' ? '(%)' : '($)'}
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={type === 'PERCENTAGE' ? '10' : '5000'}
                className="input-field"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-cafe-grayDark mb-1.5">Pedido mínimo</label>
              <input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="0" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-cafe-grayDark mb-1.5">Máx. usos</label>
              <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Ilimitado" className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-cafe-grayDark mb-1.5">Vence el (opcional)</label>
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="input-field" />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" loading={loading} onClick={handleSubmit}>Crear</Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function DiscountsPage() {
  const { data: discounts, isLoading } = useAllDiscounts();
  const createDiscount = useCreateDiscount();
  const toggleDiscount = useToggleDiscount();
  const [modal, setModal] = useState(false);

  const { fmt } = useMoney();

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const active = discounts?.filter((d: any) => d.isActive).length ?? 0;
  const totalUsed = discounts?.reduce((s: number, d: any) => s + d.usedCount, 0) ?? 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-cafe-black flex items-center gap-2">
            <Tag size={20} className="text-cafe-terracota" />
            Descuentos
          </h1>
          <p className="text-sm text-cafe-gray mt-0.5">
            Códigos promocionales para tus clientes
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setModal(true)}
          className="flex items-center gap-1.5"
        >
          <Plus size={16} /> Nuevo código
        </Button>
      </div>

      {/* Stats */}
      {discounts && discounts.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total códigos', value: discounts.length },
            { label: 'Activos', value: active },
            { label: 'Usos totales', value: totalUsed },
          ].map((s) => (
            <div key={s.label} className="bg-cafe-white rounded-2xl border border-cafe-beige px-4 py-3">
              <p className="text-xs text-cafe-gray">{s.label}</p>
              <p className="text-xl font-bold text-cafe-black mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-cafe-beige rounded-2xl animate-pulse" />)}
        </div>
      ) : discounts?.length === 0 ? (
        <div className="text-center py-16 text-cafe-gray">
          <Tag size={40} strokeWidth={1.2} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay códigos de descuento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {discounts?.map((d: any) => {
            const expired = d.expiresAt && new Date(d.expiresAt) < new Date();
            const maxed = d.maxUses !== null && d.usedCount >= d.maxUses;
            const isEffectivelyActive = d.isActive && !expired && !maxed;

            return (
              <div
                key={d.id}
                className={`bg-cafe-white rounded-2xl border px-5 py-4 flex items-center gap-4 ${
                  isEffectivelyActive ? 'border-cafe-beige' : 'border-cafe-beige opacity-60'
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  d.type === 'PERCENTAGE' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {d.type === 'PERCENTAGE' ? <Percent size={18} /> : <Gift size={18} />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => copyCode(d.code)}
                      className="font-mono font-bold text-cafe-black flex items-center gap-1.5 hover:text-cafe-terracota transition-colors"
                    >
                      {d.code}
                      <Copy size={12} className="text-cafe-grayLight" />
                    </button>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      d.type === 'PERCENTAGE'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {d.type === 'PERCENTAGE' ? `${d.value}%` : `$${fmt(d.value)}`}
                    </span>
                    {expired && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">Expirado</span>}
                    {maxed && !expired && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">Agotado</span>}
                  </div>
                  <p className="text-xs text-cafe-gray mt-0.5 flex gap-3 flex-wrap">
                    <span>{d.usedCount}{d.maxUses ? `/${d.maxUses}` : ''} usos</span>
                    {d.minOrder > 0 && <span>Min: ${fmt(d.minOrder)}</span>}
                    {d.expiresAt && <span>Vence: {new Date(d.expiresAt).toLocaleDateString('es-CO')}</span>}
                  </p>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggleDiscount.mutate(d.id)}
                  className={`transition-colors shrink-0 ${d.isActive ? 'text-cafe-terracota' : 'text-cafe-grayLight'}`}
                >
                  {d.isActive ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <DiscountModal
          onClose={() => setModal(false)}
          onSave={async (data) => {
            await createDiscount.mutateAsync(data);
          }}
        />
      )}
    </div>
  );
}
