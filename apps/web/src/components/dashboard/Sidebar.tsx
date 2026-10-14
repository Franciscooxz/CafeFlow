'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { useLowStockCount } from '@/hooks/useReports';
import { useThemeStore } from '@/store/theme.store';
import { BrandLogo, useBrandIdentity } from '@/components/brand/BrandLogo';
import {
  CashRegisterIcon,
  LayoutDashboard,
  Package,
  Users,
  Settings,
  Clock,
  LogOut,
  AlertTriangle,
  Tag,
  Sliders,
  UserCheck,
  BarChart2,
  ChefHat,
  MonitorPlay,
  LayoutGrid,
  Moon,
  Sunrise,
} from '@/components/icons';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

function useNavItems(locale: string): NavItem[] {
  const t = useTranslations('dashboard');
  return [
    {
      href: `/${locale}/dashboard`,
      label: t('title'),
      icon: <LayoutDashboard size={18} />,
      roles: ['OWNER', 'MANAGER', 'SUPER_ADMIN'],
    },
    {
      href: `/${locale}/pos`,
      label: t('pos'),
      icon: <CashRegisterIcon size={18} />,
      roles: ['OWNER', 'MANAGER', 'CASHIER', 'SUPER_ADMIN'],
    },
    {
      href: `/${locale}/products`,
      label: t('products'),
      icon: <Package size={18} />,
      roles: ['OWNER', 'MANAGER', 'SUPER_ADMIN'],
    },
    {
      href: `/${locale}/users`,
      label: t('users'),
      icon: <Users size={18} />,
      roles: ['OWNER', 'SUPER_ADMIN'],
    },
    {
      href: `/${locale}/settings`,
      label: t('settings'),
      icon: <Settings size={18} />,
      roles: ['OWNER', 'SUPER_ADMIN'],
    },
    {
      href: `/${locale}/modifiers`,
      label: 'Modificadores',
      icon: <Sliders size={18} />,
      roles: ['OWNER', 'MANAGER', 'SUPER_ADMIN'],
    },
    {
      href: `/${locale}/customers`,
      label: 'Clientes',
      icon: <UserCheck size={18} />,
      roles: ['OWNER', 'MANAGER', 'SUPER_ADMIN'],
    },
    {
      href: `/${locale}/discounts`,
      label: 'Descuentos',
      icon: <Tag size={18} />,
      roles: ['OWNER', 'MANAGER', 'SUPER_ADMIN'],
    },
    {
      href: `/${locale}/tables`,
      label: 'Mesas',
      icon: <LayoutGrid size={18} />,
      roles: ['OWNER', 'MANAGER', 'CASHIER', 'SUPER_ADMIN'],
    },
    {
      href: `/${locale}/reports`,
      label: 'Reportes',
      icon: <BarChart2 size={18} />,
      roles: ['OWNER', 'MANAGER', 'SUPER_ADMIN'],
    },
    {
      href: `/${locale}/kitchen`,
      label: 'Barra y cocina',
      icon: <ChefHat size={18} />,
      roles: ['OWNER', 'MANAGER', 'CASHIER', 'SUPER_ADMIN'],
    },
    {
      href: `/${locale}/display`,
      label: 'Pantalla de pedidos',
      icon: <MonitorPlay size={18} />,
      roles: ['OWNER', 'MANAGER', 'CASHIER', 'SUPER_ADMIN'],
    },
    {
      href: `/${locale}/audit`,
      label: t('audit'),
      icon: <Clock size={18} />,
      roles: ['OWNER', 'MANAGER', 'SUPER_ADMIN'],
    },
  ];
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logout = useLogout();
  const { data: lowStockCount } = useLowStockCount();
  const { isDark, toggle } = useThemeStore();
  const brand = useBrandIdentity();

  // Extraer locale del pathname: /es/dashboard → es
  const locale = pathname.split('/')[1] || 'es';
  const navItems = useNavItems(locale);

  const visibleItems = navItems.filter(
    (item) => !user?.role || item.roles.includes(user.role),
  );

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <aside className="sidebar-fixed w-56 shrink-0 bg-cafe-black flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <BrandLogo size={brand.logoUrl ? 32 : 22} className="rounded-lg" />
          <div className="min-w-0">
            <p className="font-bold text-cafe-white text-sm tracking-tight leading-tight truncate">
              {brand.name ?? 'CafeFlow'}
            </p>
            <p className="text-[10px] text-cafe-gray leading-tight">
              {brand.name ? 'con CafeFlow' : 'Dashboard'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive =
            item.href === `/${locale}/dashboard`
              ? pathname === item.href || pathname === `/${locale}`
              : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer',
                  isActive
                    ? 'bg-cafe-terracota text-cafe-onBrand'
                    : 'text-cafe-grayLight hover:bg-white/8 hover:text-white',
                )}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="ml-auto w-1 h-1 rounded-full bg-white/60"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Alertas de stock bajo (dinámico) */}
      {user?.role !== 'CASHIER' && lowStockCount !== undefined && lowStockCount > 0 && (
        <div className="px-3 pb-2">
          <Link href={`/${locale}/products`}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-400 text-xs hover:bg-amber-500/20 transition-colors cursor-pointer">
              <AlertTriangle size={13} />
              <span>{lowStockCount} con stock bajo</span>
            </div>
          </Link>
        </div>
      )}

      {/* Usuario + Logout */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <div className="flex items-center gap-2.5 px-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-cafe-terracota flex items-center justify-center text-cafe-onBrand text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-cafe-white text-xs font-medium truncate leading-tight">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-cafe-gray text-[10px] leading-tight truncate">
              {user?.role === 'OWNER' ? 'Dueño' :
               user?.role === 'MANAGER' ? 'Gerente' :
               user?.role === 'CASHIER' ? 'Cajero' : user?.role}
            </p>
          </div>
        </div>
        {/* Toggle dark mode */}
        <button
          onClick={toggle}
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-cafe-grayLight hover:text-cafe-white hover:bg-white/8 text-xs font-medium transition-all duration-150 mb-1"
        >
          {isDark ? <Sunrise size={14} /> : <Moon size={14} />}
          {isDark ? 'Modo claro' : 'Modo oscuro'}
        </button>
        <button
          onClick={() => logout.mutate()}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-cafe-grayLight hover:text-red-400 hover:bg-red-400/10 text-xs font-medium transition-all duration-150"
        >
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
