-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('RECEIVED', 'PREPARING', 'READY', 'DELIVERED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "callName" VARCHAR(40),
ADD COLUMN     "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'RECEIVED';

-- Los pedidos anteriores a esta migración ya se entregaron: sin esto aparecerían
-- todos como pendientes en cocina.
UPDATE "orders" SET "fulfillmentStatus" = 'DELIVERED';

-- CreateTable
CREATE TABLE "order_status_events" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "FulfillmentStatus" NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_status_events_orderId_createdAt_idx" ON "order_status_events"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "order_status_events_tenantId_createdAt_idx" ON "order_status_events"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_storeId_fulfillmentStatus_createdAt_idx" ON "orders"("storeId", "fulfillmentStatus", "createdAt");

-- AddForeignKey
ALTER TABLE "order_status_events" ADD CONSTRAINT "order_status_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_events" ADD CONSTRAINT "order_status_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
