const LOCALHOST_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

function configuredOrigins(): string[] {
  return (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  // Sin cabecera Origin no es una petición cross-origin de navegador.
  if (!origin) return true;
  if (configuredOrigins().includes(origin)) return true;
  // En desarrollo el frontend cambia de puerto si otro proyecto ocupa el 3000.
  return process.env.NODE_ENV !== 'production' && LOCALHOST_ORIGIN.test(origin);
}

/**
 * Se evalúa en cada petición, no al importar: los decoradores corren antes de
 * que ConfigModule cargue el .env, así que leer process.env ahí da undefined.
 */
export function corsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) {
  callback(null, isAllowedOrigin(origin));
}
