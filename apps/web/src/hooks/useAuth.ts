'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import type { User, Tenant } from '@/types';

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data } = await api.post('/auth/login', credentials);
      return data.data as { user: User & { tenant?: Tenant } };
    },
    onSuccess: (data) => {
      const { user } = data;
      const tenant = (user as any).tenant ?? null;
      setAuth(user, tenant);

      // Redirigir según rol: CASHIER → /pos, resto → /dashboard
      const locale = user.locale ?? 'es';
      if (tenant && !tenant.onboardingCompleted) {
        router.push(`/${locale}/onboarding`);
      } else if (user.role === 'CASHIER') {
        router.push(`/${locale}/pos`);
      } else {
        router.push(`/${locale}/dashboard`);
      }
    },
  });
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

export function useLogout() {
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      try {
        // Intentar notificar al servidor, pero nunca bloquear el logout local
        await api.post('/auth/logout');
      } catch {
        // Si el token ya expiró o hay red error, se ignora — siempre limpiamos local
      }
    },
    onSettled: () => {
      logout();
      // Hard redirect para limpiar React Query cache y estado de React
      window.location.href = '/es/login';
    },
  });
}

// ─── ME (usuario actual) ──────────────────────────────────────────────────────

export function useMe() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      return data.data as User;
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await api.post('/auth/forgot-password', { email });
      return data.data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: { token: string; newPassword: string }) => {
      const { data } = await api.post('/auth/reset-password', payload);
      return data.data as { message: string };
    },
  });
}
