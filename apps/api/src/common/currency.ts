// Debe coincidir con apps/web/src/lib/currency.ts
export const CURRENCIES = {
  COP: { decimals: 0 },
  USD: { decimals: 2 },
  CLP: { decimals: 0 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const SUPPORTED_CURRENCIES = Object.keys(CURRENCIES) as CurrencyCode[];

export const SUPPORTED_TIMEZONES = [
  'America/Bogota',
  'America/Santiago',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
] as const;

/** Decimales con los que se cobra en la moneda (COP y CLP no usan centavos). */
export function currencyDecimals(code: string | null | undefined): number {
  return CURRENCIES[code as CurrencyCode]?.decimals ?? 2;
}
