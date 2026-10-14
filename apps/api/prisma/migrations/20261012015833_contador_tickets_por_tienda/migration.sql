-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "lastTicketNumber" INTEGER NOT NULL DEFAULT 0;

-- Backfill: continuar la numeración desde el último ticket emitido por tienda
UPDATE "stores" s
SET "lastTicketNumber" = sub.max_ticket
FROM (
  SELECT "storeId", MAX("ticketNumber") AS max_ticket
  FROM "orders"
  GROUP BY "storeId"
) sub
WHERE sub."storeId" = s."id";
