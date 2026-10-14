export const DEFAULT_TIMEZONE = 'America/Bogota';

/** Fecha calendario (YYYY-MM-DD) de `date` vista desde la zona horaria dada. */
export function ymdInTimezone(date: Date, timeZone: string): string {
  // en-CA formatea como YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function addDaysYmd(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function offsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - date.getTime();
}

/**
 * Instante UTC en que empieza el día `ymd` en la zona horaria dada.
 * Ej: 2026-10-11 en America/Bogota (UTC-5) → 2026-10-11T05:00:00Z.
 */
export function startOfDayUtc(ymd: string, timeZone: string): Date {
  const midnightAsUtc = new Date(`${ymd}T00:00:00Z`);
  return new Date(midnightAsUtc.getTime() - offsetMs(midnightAsUtc, timeZone));
}
