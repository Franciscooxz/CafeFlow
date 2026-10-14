// Debe coincidir con apps/api/src/common/currency.ts
export const CURRENCIES = [
  { code: 'COP', label: 'COP — Peso colombiano', locale: 'es-CO', decimals: 0, timezone: 'America/Bogota' },
  { code: 'USD', label: 'USD — Dólar estadounidense', locale: 'en-US', decimals: 2, timezone: 'America/New_York' },
  { code: 'CLP', label: 'CLP — Peso chileno', locale: 'es-CL', decimals: 0, timezone: 'America/Santiago' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export const DEFAULT_CURRENCY: CurrencyCode = 'COP';

export const TIMEZONES = [
  { value: 'America/Bogota', label: 'Bogotá (UTC-5)' },
  { value: 'America/Santiago', label: 'Santiago de Chile' },
  { value: 'America/New_York', label: 'EE. UU. — Este (Nueva York)' },
  { value: 'America/Chicago', label: 'EE. UU. — Centro (Chicago)' },
  { value: 'America/Denver', label: 'EE. UU. — Montaña (Denver)' },
  { value: 'America/Los_Angeles', label: 'EE. UU. — Pacífico (Los Ángeles)' },
] as const;

function currencyInfo(code: string | null | undefined) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function defaultTimezoneFor(code: string): string {
  return currencyInfo(code).timezone;
}

// Todas las monedas soportadas usan "$", que las vistas ya escriben antes del
// monto; aquí solo se resuelven separadores y decimales. Agregar una moneda con
// otro símbolo (p. ej. EUR) exige mostrar el símbolo desde aquí.
export function formatAmount(n: number | null | undefined, currency?: string | null): string {
  const { locale, decimals } = currencyInfo(currency);
  return (n ?? 0).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCompact(n: number, currency?: string | null): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return formatAmount(n, currency);
}
