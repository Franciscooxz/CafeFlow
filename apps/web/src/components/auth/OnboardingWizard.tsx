'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { CoffeeCupIcon, PartyPopper } from '@/components/icons';

import { CURRENCIES, DEFAULT_CURRENCY, defaultTimezoneFor } from '@/lib/currency';
import { useBrandStore } from '@/store/brand.store';

// framer-motion interpola colores concretos, no variables CSS.
const STEP_IDLE_COLOR = '#D8D5CF';

const STEPS = ['step1', 'step2', 'step3', 'step4'] as const;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
  }),
};

export function OnboardingWizard() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();
  const { user, tenant } = useAuthStore();
  const brandColor = useBrandStore((s) => s.color);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Formulario paso 1: empresa
  const [companyName, setCompanyName] = useState(tenant?.name ?? '');
  const [companySlug, setCompanySlug] = useState(tenant?.slug ?? '');

  // Formulario paso 2: sede
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);

  // Formulario paso 3: cajero
  const [cashierFirstName, setCashierFirstName] = useState('');
  const [cashierEmail, setCashierEmail] = useState('');
  const [cashierPassword, setCashierPassword] = useState('');

  // IDs creados
  const [storeId, setStoreId] = useState('');

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 3));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
    setError('');
  };

  const handleStep1 = async () => {
    setLoading(true);
    setError('');
    try {
      // Si el tenant ya existe (Owner que acaba de crearse), saltar
      goNext();
    } catch {
      setError('Error al guardar la información');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    if (!storeName) { setError('El nombre de la sede es obligatorio'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/stores', {
        name: storeName,
        address: storeAddress,
        currency,
        timezone: defaultTimezoneFor(currency),
        taxRate: 0,
      });
      setStoreId(data.data.id);
      goNext();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al crear la sede');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async () => {
    if (!cashierEmail || !cashierPassword || !cashierFirstName) {
      setError('Todos los campos son obligatorios');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/users', {
        email: cashierEmail,
        firstName: cashierFirstName,
        lastName: '',
        password: cashierPassword,
        role: 'CASHIER',
        storeId: storeId || undefined,
      });

      await api.patch('/tenants/me/onboarding-complete');

      goNext();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al crear el cajero');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    router.push(`/${locale}/pos`);
  };

  return (
    <div className="min-h-screen bg-cafe-cream flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cafe-terracota text-cafe-onBrand mb-4">
            <CoffeeCupIcon size={28} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold text-cafe-black">{t('title')}</h1>
        </div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <motion.div
                animate={{
                  backgroundColor: i <= step ? brandColor : STEP_IDLE_COLOR,
                  scale: i === step ? 1.15 : 1,
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-cafe-onBrand"
              >
                {i < step ? '✓' : i + 1}
              </motion.div>
              {i < 3 && (
                <motion.div
                  animate={{ backgroundColor: i < step ? brandColor : STEP_IDLE_COLOR }}
                  className="w-10 h-0.5 rounded-full"
                />
              )}
            </div>
          ))}
        </div>

        {/* Card con pasos */}
        <div className="card shadow-cafe-xl overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {/* PASO 1: Empresa */}
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-cafe-black">
                      {t('step1')}
                    </h2>
                    <p className="text-sm text-cafe-gray mt-1">
                      Configura los datos de tu empresa
                    </p>
                  </div>
                  <Input
                    label={t('companyName')}
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      setCompanySlug(
                        e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                      );
                    }}
                    placeholder="Mi Café Tokio"
                    required
                  />
                  <Input
                    label={t('companySlug')}
                    value={companySlug}
                    onChange={(e) => setCompanySlug(e.target.value)}
                    placeholder="mi-cafe-tokio"
                    required
                  />
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button
                    fullWidth
                    size="lg"
                    loading={loading}
                    onClick={handleStep1}
                  >
                    {t('continue')} →
                  </Button>
                </div>
              )}

              {/* PASO 2: Sede */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-cafe-black">
                      {t('step2')}
                    </h2>
                    <p className="text-sm text-cafe-gray mt-1">
                      Tu primera sucursal
                    </p>
                  </div>
                  <Input
                    label={t('storeName')}
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Sede Principal"
                    required
                  />
                  <Input
                    label={t('storeAddress')}
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="Calle 123 #45-67"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-cafe-grayDark">
                      {t('currency')}
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="input-field"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <div className="flex gap-3">
                    <Button variant="secondary" size="lg" onClick={goBack} className="flex-1">
                      ← {t('back')}
                    </Button>
                    <Button size="lg" loading={loading} onClick={handleStep2} className="flex-[2]">
                      {t('continue')} →
                    </Button>
                  </div>
                </div>
              )}

              {/* PASO 3: Cajero */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-semibold text-cafe-black">
                      {t('step3')}
                    </h2>
                    <p className="text-sm text-cafe-gray mt-1">
                      Crea el primer usuario cajero
                    </p>
                  </div>
                  <Input
                    label={t('cashierName')}
                    value={cashierFirstName}
                    onChange={(e) => setCashierFirstName(e.target.value)}
                    placeholder="Ana López"
                    required
                  />
                  <Input
                    label={t('cashierEmail')}
                    type="email"
                    value={cashierEmail}
                    onChange={(e) => setCashierEmail(e.target.value)}
                    placeholder="ana@micafeteria.com"
                    required
                  />
                  <Input
                    label={t('cashierPassword')}
                    type="password"
                    value={cashierPassword}
                    onChange={(e) => setCashierPassword(e.target.value)}
                    placeholder="mínimo 6 caracteres"
                    required
                  />
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <div className="flex gap-3">
                    <Button variant="secondary" size="lg" onClick={goBack} className="flex-1">
                      ← {t('back')}
                    </Button>
                    <Button size="lg" loading={loading} onClick={handleStep3} className="flex-[2]">
                      {t('continue')} →
                    </Button>
                  </div>
                </div>
              )}

              {/* PASO 4: Bienvenida */}
              {step === 3 && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-6 space-y-6"
                >
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="flex justify-center text-cafe-terracota"
                  >
                    <PartyPopper size={56} strokeWidth={1.5} />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-semibold text-cafe-black">
                      {t('welcomeTitle')}
                    </h2>
                    <p className="text-sm text-cafe-gray mt-2">
                      {t('welcomeSubtitle')}
                    </p>
                  </div>

                  {/* Resumen */}
                  <div className="bg-cafe-cream rounded-xl p-4 text-left space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-cafe-gray">Empresa</span>
                      <span className="font-medium text-cafe-black">{companyName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-cafe-gray">Sede</span>
                      <span className="font-medium text-cafe-black">{storeName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-cafe-gray">Moneda</span>
                      <span className="font-medium text-cafe-black">{currency}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-cafe-gray">Cajero</span>
                      <span className="font-medium text-cafe-black">{cashierEmail}</span>
                    </div>
                  </div>

                  <Button size="lg" fullWidth onClick={handleFinish}>
                    {t('finish')} →
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step label */}
        <p className="text-center text-xs text-cafe-grayLight mt-4">
          Paso {step + 1} de 4 · CafeFlow
        </p>
      </div>
    </div>
  );
}
