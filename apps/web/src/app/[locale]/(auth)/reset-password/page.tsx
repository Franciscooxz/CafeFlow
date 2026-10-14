'use client';

import { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useResetPassword } from '@/hooks/useAuth';
import { AlertCircle, CheckCircle2, CoffeeCupIcon, Lock } from '@/components/icons';

const MIN_LENGTH = 8;
const MAX_LENGTH = 72;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

function apiMessage(err: any): string {
  if (err?.response?.status === 429) {
    return 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.';
  }
  const message = err?.response?.data?.message;
  if (Array.isArray(message)) return message[0];
  return message ?? 'No pudimos cambiar la contraseña. Inténtalo de nuevo.';
}

function ResetPasswordForm() {
  const t = useTranslations('auth');
  const { locale } = useParams<{ locale: string }>();
  const token = useSearchParams().get('token') ?? '';
  const resetPassword = useResetPassword();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const tokenLooksValid = TOKEN_PATTERN.test(token);
  const mismatch = confirm.length > 0 && confirm !== password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres`);
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      await resetPassword.mutateAsync({ token, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(apiMessage(err));
    }
  };

  if (!tokenLooksValid) {
    return (
      <div className="text-center py-4">
        <div className="flex justify-center mb-3 text-red-600">
          <AlertCircle size={40} strokeWidth={1.2} />
        </div>
        <h2 className="font-semibold text-cafe-black mb-2">Enlace no válido</h2>
        <p className="text-sm text-cafe-gray">
          El enlace está incompleto o fue modificado. Solicita uno nuevo.
        </p>
        <Link
          href={`/${locale}/forgot-password`}
          className="inline-block mt-6 text-sm text-cafe-terracota hover:text-cafe-terracota2"
        >
          Solicitar un nuevo enlace
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-4"
      >
        <div className="flex justify-center mb-3 text-cafe-terracota">
          <CheckCircle2 size={40} strokeWidth={1.2} />
        </div>
        <h2 className="font-semibold text-cafe-black mb-2">Contraseña actualizada</h2>
        <p className="text-sm text-cafe-gray">
          Por seguridad cerramos las sesiones abiertas. Inicia sesión con tu nueva contraseña.
        </p>
        <Link
          href={`/${locale}/login`}
          className="inline-flex mt-6 px-6 py-3 rounded-xl font-medium bg-cafe-terracota text-cafe-onBrand hover:bg-cafe-terracota2 transition-colors"
        >
          Ir a iniciar sesión
        </Link>
      </motion.div>
    );
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-cafe-black mb-2">Elige una nueva contraseña</h2>
      <p className="text-sm text-cafe-gray mb-6">
        Mínimo {MIN_LENGTH} caracteres. El enlace solo funciona una vez.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          icon={<Lock size={16} />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={MIN_LENGTH}
          maxLength={MAX_LENGTH}
          required
          autoFocus
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          icon={<Lock size={16} />}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          maxLength={MAX_LENGTH}
          error={mismatch ? 'No coincide' : undefined}
          required
        />
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth size="lg" loading={resetPassword.isPending}>
          Guardar contraseña
        </Button>
      </form>
      <div className="mt-4 text-center">
        <Link
          href={`/${locale}/login`}
          className="text-sm text-cafe-gray hover:text-cafe-terracota transition-colors"
        >
          ← {t('backToLogin')}
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-cafe-cream flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cafe-terracota text-cafe-onBrand mb-4">
            <CoffeeCupIcon size={28} strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-semibold text-cafe-black">CafeFlow</h1>
        </div>
        <div className="card shadow-cafe-lg">
          {/* useSearchParams exige un límite de Suspense en el build de producción. */}
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </motion.div>
    </main>
  );
}
