'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { KdsOrder } from '@/types';

// Conecta directamente al backend. Las cookies httpOnly (access_token)
// se envían automáticamente en el handshake porque localhost ignora el puerto.
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';

export interface OrderEventHandlers {
  onCreated?: (order: KdsOrder) => void;
  onStatus?: (order: KdsOrder) => void;
  onCancelled?: (order: { id: string; storeId: string }) => void;
}

/**
 * Eventos de pedidos del namespace /pos. El backend envía `{ order }`.
 * El token solo se valida en el handshake: si expira y se cae la conexión, los
 * reintentos fallan hasta que una llamada HTTP renueve la cookie (el polling de
 * useLiveOrders lo hace), por eso los reintentos no tienen límite.
 */
export function useOrderEvents(handlers: OrderEventHandlers) {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const sock: Socket = io(`${WS_URL}/pos`, {
      withCredentials: true,
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 15000,
    });

    sock.on('connect', () => setConnected(true));
    sock.on('disconnect', () => setConnected(false));
    sock.on('order:created', ({ order }: { order: KdsOrder }) => handlersRef.current.onCreated?.(order));
    sock.on('order:status', ({ order }: { order: KdsOrder }) => handlersRef.current.onStatus?.(order));
    sock.on('order:cancelled', ({ order }: { order: { id: string; storeId: string } }) =>
      handlersRef.current.onCancelled?.(order),
    );

    return () => {
      sock.disconnect();
    };
  }, []);

  return { connected };
}
