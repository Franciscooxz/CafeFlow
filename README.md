# CafeFlow

Punto de venta para cafeterías. La API está en `apps/api` (NestJS y Prisma) y la interfaz en `apps/web` (Next.js).

## Requisitos

- Node.js 20 o superior
- pnpm 9 o superior
- Docker

## Arranque

```powershell
docker compose up -d
pnpm install
```

Copia `.env.example` a `.env` en la raíz y también a `apps/api/.env`. Luego:

```powershell
pnpm --filter @cafeflow/api exec prisma migrate dev
pnpm --filter @cafeflow/api exec prisma db seed
pnpm dev
```

La interfaz queda en http://localhost:3002 y la API en http://localhost:3001/api/v1.

Cuenta de demostración: `owner@demo-cafe.com` / `owner2024!`
