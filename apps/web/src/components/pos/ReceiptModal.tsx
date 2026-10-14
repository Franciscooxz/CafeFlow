'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { Order } from '@/types';
import { formatAmount } from '@/lib/currency';
import { useBrandStore } from '@/store/brand.store';
import { X, FileDown, Check } from '@/components/icons';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function paymentLabel(method: string) {
  if (method === 'CASH') return 'Efectivo';
  if (method === 'CARD') return 'Tarjeta';
  if (method === 'MIXED') return 'Mixto';
  return method;
}

// ─── ReceiptModal ─────────────────────────────────────────────────────────────

interface ReceiptModalProps {
  order: Order & {
    store?: { name: string; currency?: string };
    user?: { firstName: string; lastName: string };
    customer?: { name: string } | null;
    table?: { number: number; name?: string } | null;
    change?: number;
  };
  onClose: () => void;
}

export function ReceiptModal({ order, onClose }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const fmt = (n: number) => formatAmount(n, order.store?.currency);
  const brandName = useBrandStore((s) => s.name);
  const logoUrl = useBrandStore((s) => s.logoUrl);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow || !receiptRef.current) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Ticket #${order.ticketNumber}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; width: 80mm; padding: 8px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .large { font-size: 16px; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; }
          .indent { padding-left: 8px; color: #555; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
        </style>
      </head>
      <body>
        ${receiptRef.current.innerHTML}
        <script>window.print(); window.close();<\/script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const now = new Date(order.createdAt);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Controls */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-cafe-beige">
          <p className="font-semibold text-cafe-black text-sm">Ticket de venta</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-cafe-terracota text-cafe-onBrand hover:bg-cafe-terracota2 transition-colors"
            >
              <FileDown size={13} />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-cafe-cream transition-colors text-cafe-gray"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Receipt preview */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          <div
            ref={receiptRef}
            className="font-mono text-xs text-cafe-black space-y-1"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            {/* Store header */}
            {logoUrl && (
              <div style={{ textAlign: 'center', marginBottom: 6 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt=""
                  style={{ width: 56, height: 56, objectFit: 'contain', filter: 'grayscale(1)', display: 'inline-block' }}
                />
              </div>
            )}
            <div className="center bold large" style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px', marginBottom: 2 }}>
              {brandName ?? order.store?.name ?? 'CafeFlow'}
            </div>
            <div className="center" style={{ textAlign: 'center', color: '#555' }}>
              {brandName ? order.store?.name : 'CafeFlow POS'}
            </div>
            <div className="divider" style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />

            {/* Ticket info */}
            <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Ticket</span>
              <span className="bold">#{order.ticketNumber}</span>
            </div>
            {order.callName && (
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Nombre</span>
                <span className="bold">{order.callName}</span>
              </div>
            )}
            <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Fecha</span>
              <span>{now.toLocaleDateString('es-CO')}</span>
            </div>
            <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Hora</span>
              <span>{now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {order.user && (
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Cajero</span>
                <span>{order.user.firstName} {order.user.lastName}</span>
              </div>
            )}
            {order.customer && (
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Cliente</span>
                <span>{order.customer.name}</span>
              </div>
            )}
            {order.table && (
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Mesa</span>
                <span>#{order.table.number}{order.table.name ? ` (${order.table.name})` : ''}</span>
              </div>
            )}

            <div className="divider" style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />

            {/* Items */}
            {order.items.map((item, i) => {
              const modifiers = (item as any).modifiers ?? [];
              return (
                <div key={i} style={{ marginBottom: 4 }}>
                  <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ flex: 1 }}>
                      {item.quantity}x {item.product?.name ?? 'Producto'}
                    </span>
                    <span style={{ fontWeight: 'bold' }}>${fmt(item.subtotal)}</span>
                  </div>
                  {modifiers.length > 0 && (
                    <div className="indent" style={{ paddingLeft: 8, color: '#777', fontSize: '10px' }}>
                      + {modifiers.map((m: any) => m.name).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="divider" style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />

            {/* Totals */}
            <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal</span>
              <span>${fmt(order.subtotal)}</span>
            </div>
            {order.taxAmount > 0 && (
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>IVA</span>
                <span>${fmt(order.taxAmount)}</span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                <span>Descuento</span>
                <span>-${fmt(order.discountAmount)}</span>
              </div>
            )}

            <div className="divider" style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />

            <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
              <span>TOTAL</span>
              <span>${fmt(order.total)}</span>
            </div>

            {/* Payment */}
            <div className="divider" style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />
            <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Pago</span>
              <span>{paymentLabel(order.paymentMethod)}</span>
            </div>
            {order.cashReceived && (
              <div className="row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Recibido</span>
                <span>${fmt(order.cashReceived)}</span>
              </div>
            )}
            {(order.change ?? 0) > 0 && (
              <div className="row bold" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Vuelto</span>
                <span>${fmt(order.change!)}</span>
              </div>
            )}

            <div className="divider" style={{ borderTop: '1px dashed #ccc', margin: '8px 0' }} />
            <div className="center" style={{ textAlign: 'center', color: '#777', fontSize: '10px' }}>
              ¡Gracias por su compra!
            </div>
            <div className="center" style={{ textAlign: 'center', color: '#aaa', fontSize: '9px' }}>
              Powered by CafeFlow
            </div>
          </div>
        </div>

        {/* Done button */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
          >
            <Check size={16} />
            Listo
          </button>
        </div>
      </motion.div>
    </div>
  );
}
