'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAllStores, useUpdateStore } from '@/hooks/useAdmin';
import { Settings, Store, CheckCircle2 } from '@/components/icons';
import { CURRENCIES, DEFAULT_CURRENCY, TIMEZONES, defaultTimezoneFor } from '@/lib/currency';
import { BrandSettingsCard } from '@/components/dashboard/BrandSettingsCard';

export default function SettingsPage() {
  const { data: stores, isLoading } = useAllStores();
  const updateStore = useUpdateStore();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const store = stores?.[0]; // Primera sede

  const [form, setForm] = useState({
    name: '',
    address: '',
    currency: DEFAULT_CURRENCY as string,
    timezone: defaultTimezoneFor(DEFAULT_CURRENCY),
    taxRate: '0',
  });

  useEffect(() => {
    if (store) {
      setForm({
        name: store.name ?? '',
        address: store.address ?? '',
        currency: store.currency ?? DEFAULT_CURRENCY,
        timezone: store.timezone ?? defaultTimezoneFor(store.currency ?? DEFAULT_CURRENCY),
        taxRate: String(Math.round((store.taxRate ?? 0) * 100)),
      });
    }
  }, [store]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const setCurrency = (currency: string) =>
    setForm((f) => ({ ...f, currency, timezone: defaultTimezoneFor(currency) }));

  const handleSave = async () => {
    if (!store) return;
    setError('');
    setSaved(false);
    try {
      await updateStore.mutateAsync({
        id: store.id,
        name: form.name,
        address: form.address || undefined,
        currency: form.currency,
        timezone: form.timezone,
        taxRate: parseFloat(form.taxRate) / 100,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al guardar');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-cafe-black flex items-center gap-2">
          <Settings size={20} className="text-cafe-terracota" />
          Configuración
        </h1>
        <p className="text-sm text-cafe-gray mt-0.5">Marca de tu negocio y ajustes de tu sede</p>
      </div>

      <BrandSettingsCard />

      {/* Card de sede */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-cafe-white rounded-2xl shadow-cafe border border-cafe-beige/60 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-cafe-beige flex items-center gap-2">
          <Store size={16} className="text-cafe-terracota" />
          <h2 className="font-semibold text-cafe-black text-sm">Información de la sede</h2>
        </div>

        <div className="px-5 py-5 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-cafe-cream rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !store ? (
            <p className="text-sm text-cafe-grayLight text-center py-8">
              No hay sedes configuradas
            </p>
          ) : (
            <>
              <Input
                label="Nombre de la sede"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Sede Principal"
              />
              <Input
                label="Dirección"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Calle 123 #45-67"
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-cafe-grayDark">Moneda</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="input-field"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Impuesto (%)"
                  type="number"
                  min="0"
                  max="100"
                  value={form.taxRate}
                  onChange={(e) => set('taxRate', e.target.value)}
                  placeholder="19"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-cafe-grayDark">Zona horaria</label>
                <select
                  value={form.timezone}
                  onChange={(e) => set('timezone', e.target.value)}
                  className="input-field"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
                <p className="text-xs text-cafe-gray">
                  Define qué cuenta como &quot;hoy&quot; en el dashboard y los reportes.
                </p>
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-green-600 font-medium"
            >
              <CheckCircle2 size={16} />
              Cambios guardados correctamente
            </motion.div>
          )}
        </div>

        {store && (
          <div className="px-5 pb-5">
            <Button
              fullWidth
              size="lg"
              onClick={handleSave}
              loading={updateStore.isPending}
            >
              Guardar cambios
            </Button>
          </div>
        )}
      </motion.div>

      {/* Info del tenant */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-cafe-white rounded-2xl shadow-cafe border border-cafe-beige/60 p-5"
      >
        <h2 className="font-semibold text-cafe-black text-sm mb-3">Información del sistema</h2>
        <div className="space-y-2 text-sm text-cafe-gray">
          <div className="flex justify-between">
            <span>Versión</span>
            <span className="font-medium text-cafe-black">CafeFlow v2.0</span>
          </div>
          <div className="flex justify-between">
            <span>Plan</span>
            <span className="badge bg-cafe-terracota/10 text-cafe-terracota">Starter</span>
          </div>
          {store && (
            <div className="flex justify-between">
              <span>Sede ID</span>
              <span className="font-mono text-xs text-cafe-grayLight">{store.id.slice(0, 8)}...</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
