import { FulfillmentStatus, Prisma } from '@prisma/client';

// Orden de avance en barra. Avanzar puede saltar pasos; retroceder solo uno
// (para deshacer un toque equivocado).
export const FULFILLMENT_FLOW: readonly FulfillmentStatus[] = [
  FulfillmentStatus.RECEIVED,
  FulfillmentStatus.PREPARING,
  FulfillmentStatus.READY,
  FulfillmentStatus.DELIVERED,
];

export const ACTIVE_FULFILLMENT: FulfillmentStatus[] = [
  FulfillmentStatus.RECEIVED,
  FulfillmentStatus.PREPARING,
  FulfillmentStatus.READY,
];

export const KDS_ORDER_INCLUDE = {
  items: {
    include: {
      product: { select: { name: true } },
      modifiers: { select: { name: true } },
    },
  },
  customer: { select: { name: true } },
  table: { select: { number: true, name: true } },
  statusEvents: { select: { createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
} satisfies Prisma.OrderInclude;

type KdsSource = {
  id: string;
  storeId: string;
  ticketNumber: number;
  callName: string | null;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: Date;
  customer: { name: string } | null;
  table: { number: number; name: string | null } | null;
  items: Array<{ quantity: number; product: { name: string }; modifiers: Array<{ name: string }> }>;
  statusEvents?: Array<{ createdAt: Date }>;
};

export function toKdsOrder(order: KdsSource) {
  return {
    id: order.id,
    storeId: order.storeId,
    ticketNumber: order.ticketNumber,
    callName: order.callName,
    fulfillmentStatus: order.fulfillmentStatus,
    createdAt: order.createdAt,
    statusChangedAt: order.statusEvents?.[0]?.createdAt ?? order.createdAt,
    customer: order.customer?.name ?? null,
    table: order.table ? (order.table.name ?? `Mesa ${order.table.number}`) : null,
    items: order.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      modifiers: item.modifiers.map((m) => m.name),
    })),
  };
}

export type KdsOrder = ReturnType<typeof toKdsOrder>;
