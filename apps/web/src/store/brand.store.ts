import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { brandVars, DEFAULT_BRAND_COLOR, isValidHex, type BrandVars } from '@/lib/brand';

export interface Branding {
  name: string | null;
  brandColor: string | null;
  logoUrl: string | null;
}

interface BrandState extends Branding {
  color: string;
  vars: BrandVars;
  setBranding: (branding: Branding) => void;
}

// Se guarda en localStorage a nivel de dispositivo: la tablet de la cafetería muestra
// su marca incluso en el login. El script de app/layout.tsx lee `state.vars` de aquí.
export const BRAND_STORAGE_KEY = 'cafeflow-brand';

export const useBrandStore = create<BrandState>()(
  persist(
    (set) => ({
      name: null,
      brandColor: null,
      logoUrl: null,
      color: DEFAULT_BRAND_COLOR,
      vars: brandVars(DEFAULT_BRAND_COLOR),
      setBranding: ({ name, brandColor, logoUrl }) => {
        const color = isValidHex(brandColor) ? brandColor : DEFAULT_BRAND_COLOR;
        set({ name, brandColor, logoUrl, color, vars: brandVars(color) });
      },
    }),
    { name: BRAND_STORAGE_KEY },
  ),
);
