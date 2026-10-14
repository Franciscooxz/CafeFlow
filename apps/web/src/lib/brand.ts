export const DEFAULT_BRAND_COLOR = '#C4704A';

// Debe coincidir con MAX_LOGO_DATA_URL_LENGTH en apps/api/src/modules/tenants/dto/update-branding.dto.ts
export const MAX_LOGO_DATA_URL_LENGTH = 150_000;
const MAX_LOGO_FILE_BYTES = 5 * 1024 * 1024;
const LOGO_SIZES = [256, 192, 128];

export const BRAND_PRESETS = [
  { name: 'Terracota', hex: '#C4704A' },
  { name: 'Verde café', hex: '#00704A' },
  { name: 'Tostado', hex: '#6F4E37' },
  { name: 'Vino', hex: '#8C2F39' },
  { name: 'Azul noche', hex: '#1F3A5F' },
  { name: 'Oliva', hex: '#5B6B3A' },
  { name: 'Mostaza', hex: '#C9A227' },
  { name: 'Carbón', hex: '#2B2B2B' },
] as const;

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const WHITE: Rgb = [255, 255, 255];
const INK: Rgb = [23, 23, 22];

type Rgb = [number, number, number];

/** Variables CSS que consume Tailwind (`cafe-terracota`, `cafe-terracota2`, `cafe-onBrand`). */
export type BrandVars = Record<'--cafe-terracota' | '--cafe-terracota2' | '--cafe-onBrand', string>;

export function isValidHex(hex: string | null | undefined): hex is string {
  return !!hex && HEX_RE.test(hex);
}

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(color: Rgb, target: Rgb, amount: number): Rgb {
  return color.map((c, i) => Math.round(c + (target[i] - c) * amount)) as Rgb;
}

function channels(rgb: Rgb): string {
  return rgb.join(' ');
}

// Luminancia relativa y contraste según WCAG 2.1.
function luminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function brandVars(hex: string | null | undefined): BrandVars {
  const base = hexToRgb(isValidHex(hex) ? hex : DEFAULT_BRAND_COLOR);
  // Un color casi negro no se puede oscurecer más: el hover lo aclara.
  const hover = luminance(base) < 0.03 ? mix(base, WHITE, 0.15) : mix(base, [0, 0, 0], 0.12);
  // WCAG puro elige negro en tonos medios (terracota, naranja). Se prefiere blanco
  // mientras cumpla 3:1 (texto grande / componentes de UI), como hace Material.
  const whiteContrast = contrast(base, WHITE);
  const onBrand = whiteContrast >= 3 || whiteContrast >= contrast(base, INK) ? WHITE : INK;
  return {
    '--cafe-terracota': channels(base),
    '--cafe-terracota2': channels(hover),
    '--cafe-onBrand': channels(onBrand),
  };
}

/** true si el color, usado como texto sobre fondo claro, no llega al mínimo WCAG para texto grande (3:1). */
export function isLowContrastOnLight(hex: string): boolean {
  return isValidHex(hex) && contrast(hexToRgb(hex), WHITE) < 3;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la imagen'));
    img.src = src;
  });
}

/**
 * Redimensiona el logo en el navegador y lo devuelve como data URL WebP (PNG si el
 * navegador no codifica WebP). Las SVG se rasterizan aquí: nunca se guarda SVG, que
 * puede llevar scripts.
 */
export async function resizeLogo(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen');
  if (file.size > MAX_LOGO_FILE_BYTES) throw new Error('La imagen supera 5 MB');

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    for (const size of LOGO_SIZES) {
      const srcW = img.naturalWidth || size;
      const srcH = img.naturalHeight || size;
      const scale = Math.min(1, size / Math.max(srcW, srcH));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(srcW * scale));
      canvas.height = Math.max(1, Math.round(srcH * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Tu navegador no permite procesar imágenes');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/webp', 0.85);
      if (dataUrl.length <= MAX_LOGO_DATA_URL_LENGTH) return dataUrl;
    }
    throw new Error('El logo es demasiado complejo; prueba con una imagen más simple');
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function applyBrandVars(vars: BrandVars, hex: string): void {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex);
}
