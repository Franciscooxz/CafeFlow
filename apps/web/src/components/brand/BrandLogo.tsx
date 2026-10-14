'use client';

import { useEffect, useState } from 'react';
import { useBrandStore } from '@/store/brand.store';
import { CoffeeCupIcon } from '@/components/icons';

// El store se rehidrata desde localStorage, que no existe en el render del servidor.
// Hasta montar se muestra el default para que el HTML coincida y no falle la hidratación.
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function useBrandIdentity() {
  const mounted = useMounted();
  const name = useBrandStore((s) => s.name);
  const logoUrl = useBrandStore((s) => s.logoUrl);
  return {
    name: mounted ? name : null,
    logoUrl: mounted ? logoUrl : null,
  };
}

interface BrandLogoProps {
  size?: number;
  /** Clases del ícono por defecto (sin logo), p. ej. el color. */
  iconClassName?: string;
  className?: string;
}

export function BrandLogo({ size = 24, iconClassName = 'text-cafe-terracota', className = '' }: BrandLogoProps) {
  const { logoUrl, name } = useBrandIdentity();

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- data URL, next/image no aporta nada
      <img
        src={logoUrl}
        alt={name ?? 'Logo'}
        width={size}
        height={size}
        className={`object-contain shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span className={`${iconClassName} ${className}`}>
      <CoffeeCupIcon size={size} strokeWidth={1.5} />
    </span>
  );
}
