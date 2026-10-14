import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Tenant } from '@/types';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;

  setAuth: (user: User, tenant: Tenant | null) => void;
  logout: () => void;
  updateLocale: (locale: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      isAuthenticated: false,

      setAuth: (user, tenant) => {
        if (typeof window !== 'undefined') {
          if (tenant?.id) localStorage.setItem('cafeflow_tenant_id', tenant.id);
        }
        set({ user, tenant, isAuthenticated: true });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cafeflow_tenant_id');
        }
        set({ user: null, tenant: null, isAuthenticated: false });
      },

      updateLocale: (locale) =>
        set((state) => ({
          user: state.user ? { ...state.user, locale: locale as any } : null,
        })),
    }),
    {
      name: 'cafeflow-auth',
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
