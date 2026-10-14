'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/theme.store';
import { useBrandStore } from '@/store/brand.store';
import { applyBrandVars } from '@/lib/brand';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeStore();
  const vars = useBrandStore((s) => s.vars);
  const color = useBrandStore((s) => s.color);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [isDark]);

  useEffect(() => {
    applyBrandVars(vars, color);
  }, [vars, color]);

  // Registrar service worker para PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return <>{children}</>;
}
