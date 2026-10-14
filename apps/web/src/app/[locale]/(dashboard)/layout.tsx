'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { useBranding } from '@/hooks/useBranding';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useBranding();

  // El POS y la pantalla de pedidos para clientes van a pantalla completa, sin sidebar
  const isFullScreen = /\/(pos|display)$/.test(pathname);
  if (isFullScreen) return <>{children}</>;

  return (
    <div className="flex h-screen bg-cafe-cream overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
