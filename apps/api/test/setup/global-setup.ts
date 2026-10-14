import { execSync } from 'child_process';
import { resolve } from 'path';
import { testDatabaseUrl } from './database-url';

// Crea la base de pruebas si no existe y le aplica todas las migraciones desde cero.
export default function globalSetup() {
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    cwd: resolve(__dirname, '../..'),
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: 'pipe',
  });
}
