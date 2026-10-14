'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useForgotPassword } from '@/hooks/useAuth';
import { CoffeeCupIcon, Mail } from '@/components/icons';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const { locale } = useParams<{ locale: string }>();
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await forgotPassword.mutateAsync(email);
      setSent(true);
    } catch (err: any) {
      setError(
        err?.response?.status === 429
          ? 'Demasiadas solicitudes. Espera un minuto e inténtalo de nuevo.'
          : 'No pudimos procesar la solicitud. Inténtalo de nuevo.',
      );
    }
  };

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
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="flex justify-center mb-3 text-cafe-terracota">
                <Mail size={40} strokeWidth={1.2} />
              </div>
              <h2 className="font-semibold text-cafe-black mb-2">Revisa tu correo</h2>
              <p className="text-sm text-cafe-gray">
                Si el email existe, recibirás las instrucciones en breve.
              </p>
              <Link
                href={`/${locale}/login`}
                className="inline-block mt-6 text-sm text-cafe-terracota hover:text-cafe-terracota2"
              >
                ← {t('backToLogin')}
              </Link>
            </motion.div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-cafe-black mb-2">
                {t('resetPassword')}
              </h2>
              <p className="text-sm text-cafe-gray mb-6">
                {t('resetInstructions')}
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label={t('email')}
                  type="email"
                  placeholder="tu@cafeteria.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {error && (
                  <p role="alert" className="text-sm text-red-600">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={forgotPassword.isPending}
                >
                  {t('sendReset')}
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
          )}
        </div>
      </motion.div>
    </main>
  );
}
