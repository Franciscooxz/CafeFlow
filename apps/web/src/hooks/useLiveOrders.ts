'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { useOrderEvents } from '@/hooks/useWebSocket';
import type { FulfillmentStatus, KdsOrder } from '@/types';

const POLL_MS = 30_000;

interface Options {
  onNewOrder?: (order: KdsOrder) => void;
  onReady?: (order: KdsOrder) => void;
}

function upsert(list: KdsOrder[], order: KdsOrder) {
  if (order.fulfillmentStatus === 'DELIVERED') return list.filter((o) => o.id !== order.id);
  const i = list.findIndex((o) => o.id === order.id);
  if (i === -1) return [...list, order];
  const next = list.slice();
  next[i] = order;
  return next;
}

/** Pedidos activos (recibido, en preparación, listo) de una sede, en vivo. */
export function useLiveOrders(storeId: string | null | undefined, options: Options = {}) {
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  const reload = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get(`/pos/kds?storeId=${storeId}&hours=12`);
      setOrders(data.data ?? []);
      setError('');
    } catch {
      setError('No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    setOrders([]);
    setLoading(true);
    reload();
    const interval = setInterval(reload, POLL_MS);
    return () => clearInterval(interval);
  }, [reload]);

  const { connected } = useOrderEvents({
    onCreated: (order) => {
      if (order.storeId !== storeId) return;
      setOrders((prev) => (prev.some((o) => o.id === order.id) ? prev : upsert(prev, order)));
      optionsRef.current.onNewOrder?.(order);
    },
    onStatus: (order) => {
      if (order.storeId !== storeId) return;
      const before = ordersRef.current.find((o) => o.id === order.id);
      if (order.fulfillmentStatus === 'READY' && before?.fulfillmentStatus !== 'READY') {
        optionsRef.current.onReady?.(order);
      }
      setOrders((prev) => upsert(prev, order));
    },
    onCancelled: ({ id }) => setOrders((prev) => prev.filter((o) => o.id !== id)),
  });

  // Optimista: la barra no puede esperar la red para ver el cambio. Si falla, se
  // recarga del servidor para no quedar con un estado inventado.
  const setStatus = useCallback(
    async (id: string, status: FulfillmentStatus) => {
      setOrders((prev) => {
        const current = prev.find((o) => o.id === id);
        return current ? upsert(prev, { ...current, fulfillmentStatus: status, statusChangedAt: new Date().toISOString() }) : prev;
      });
      try {
        const { data } = await api.patch(`/pos/orders/${id}/fulfillment`, { status });
        setOrders((prev) => upsert(prev, data.data as KdsOrder));
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'No se pudo cambiar el estado del pedido');
        reload();
      }
    },
    [reload],
  );

  return { orders, loading, error, connected, reload, setStatus, clearError: () => setError('') };
}
