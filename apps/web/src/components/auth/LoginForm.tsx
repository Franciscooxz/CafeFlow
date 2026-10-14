'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useLogin } from '@/hooks/useAuth';
import { User, Lock } from '@/components/icons';
import { BrandLogo, useBrandIdentity } from '@/components/brand/BrandLogo';

export function LoginForm() {
  const t = useTranslations('auth');
  const brand = useBrandIdentity();
  const { locale } = useParams<{ locale: string }>();
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await login.mutateAsync({ email, password });
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ?? t('invalidCredentials'),
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-sm"
    >
      {/* Logo */}
      <div className="mb-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className={
            brand.logoUrl
              ? 'inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-cafe-white mb-4 shadow-cafe-lg p-2'
              : 'inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cafe-terracota text-cafe-onBrand mb-4 shadow-cafe-lg'
          }
        >
          <BrandLogo size={brand.logoUrl ? 64 : 32} iconClassName="" />
        </motion.div>
        <h1 className="text-2xl font-semibold text-cafe-black tracking-tight">{brand.name ?? 'CafeFlow'}</h1>
        <p className="text-sm text-cafe-gray mt-1">{t('subtitle')}</p>
      </div>

      {/* Card */}
      <div className="card shadow-cafe-lg">
        <h2 className="text-lg font-semibold text-cafe-black mb-6">
          {t('welcomeBack')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('email')}
            type="email"
            placeholder="tu@cafeteria.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            icon={<User size={16} />}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-cafe-grayDark">{t('password')}</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cafe-gray">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="input-field pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cafe-gray hover:text-cafe-black transition-colors"
              >
                {showPassword
                  ? <EyeOffIcon size={16} />
                  : <EyeIcon size={16} />
                }
              </button>
            </div>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2"
            >
              <AlertCircleIcon size={15} className="shrink-0" />
              {errorMsg}
            </motion.div>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={login.isPending}
            className="mt-2"
          >
            {login.isPending ? t('signingIn') : t('signIn')}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link
            href={`/${locale}/forgot-password`}
            className="text-sm text-cafe-terracota hover:text-cafe-terracota2 transition-colors"
          >
            {t('forgotPassword')}
          </Link>
        </div>
      </div>

      {/* Demo credentials */}
      {process.env.NODE_ENV === 'development' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 p-4 bg-cafe-beige rounded-xl text-xs text-cafe-gray space-y-1.5"
        >
          <p className="font-semibold text-cafe-black mb-2">Cuentas demo:</p>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-cafe-terracota/20 flex items-center justify-center">
              <UserIcon size={10} className="text-cafe-terracota" />
            </span>
            <span>owner@demo-cafe.com / owner2024!</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-cafe-terracota/20 flex items-center justify-center">
              <CashRegisterIcon size={10} className="text-cafe-terracota" />
            </span>
            <span>cashier@demo-cafe.com / cashier2024!</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-cafe-terracota/20 flex items-center justify-center">
              <SettingsIcon size={10} className="text-cafe-terracota" />
            </span>
            <span>admin@cafeflow.app / cafeflow2024!</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Sub-imports inline para evitar bundle split innecesario
import { Eye as EyeIcon, EyeOff as EyeOffIcon, AlertCircle as AlertCircleIcon, User as UserIcon, Settings as SettingsIcon } from 'lucide-react';
import { CashRegisterIcon } from '@/components/icons';
