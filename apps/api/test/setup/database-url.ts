import { config } from 'dotenv';
import { resolve } from 'path';

/**
 * URL de la base de pruebas: TEST_DATABASE_URL si existe; si no, la de .env
 * con el nombre de la base cambiado a "<nombre>_test".
 */
export function testDatabaseUrl(): string {
  config({ path: resolve(__dirname, '../../.env') });

  const explicit = process.env.TEST_DATABASE_URL;
  const url = new URL(explicit ?? process.env.DATABASE_URL ?? '');
  if (!explicit) {
    url.pathname = `${url.pathname.replace(/^\//, '')}_test`;
  }

  // Las pruebas vacían todas las tablas: nunca deben apuntar a la base real.
  if (!url.pathname.endsWith('_test')) {
    throw new Error(`La base de pruebas debe terminar en "_test" (recibido: ${url.pathname})`);
  }
  return url.toString();
}
