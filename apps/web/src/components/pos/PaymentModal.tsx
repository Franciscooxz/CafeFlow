'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { usePosStore } from '@/store/pos.store';
import { useCreateOrder, useValidateDiscount } from '@/hooks/usePOS';
import { ReceiptModal } from './ReceiptModal';
import { Button } from '@/components/ui/Button';
import { useMoney } from '@/hooks/useCurrency';
import {
  Banknote,
  CreditCard,
  ArrowLeftRight,
  Check,
  Tag,
  FileDown,
  AlertTriangle,
  Megaphone,
} from '@/components/icons';
import type { PaymentMethod, Order } from '@/types';

type Step = 'discount' | 'method' | 'cash' | 'mixed' | 'success';

interface PaymentModalProps {
  storeId: string;
}

const METHOD_ICONS: Record<PaymentMethod, React.ReactNode> = {
  CASH: <Banknote size={22} strokeWidth={1.5} />,
  CARD: <CreditCard size={22} strokeWidth={1.5} />,
  MIXED: <ArrowLeftRight size={22} strokeWidth={1.5} />,
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  MIXED: 'Mixto',
};

// ─── Convierte mensajes de error técnicos en mensajes amigables ────────────────

function parseErrorMessage(raw: string): { title: string; hint?: string } {
  if (!raw) return { title: 'Error al procesar el pago. Intenta nuevamente.' };

  if (raw.includes('Stock insuficiente')) {
    // Ejemplo: "Stock insuficiente para "Espresso": disponible 2, solicitado 5"
    return {
      title: raw,
      hint: 'Ajusta la cantidad en el carrito antes de intentar de nuevo.',
    };
  }
  if (raw.includes('turno') || raw.includes('shift')) {
    return {
      title: 'No hay un turno activo.',
      hint: 'Pide al administrador que abra el turno antes de cobrar.',
    };
  }
  if (raw.includes('descuento') || raw.includes('Descuento') || raw.includes('código')) {
    return {
      title: 'El código de descuento ya no es válido.',
      hint: 'Quítalo e intenta nuevamente.',
    };
  }
  if (raw.includes('cliente') || raw.includes('customer')) {
    return {
      title: 'El cliente seleccionado no está disponible.',
      hint: 'Deselecciona el cliente e intenta de nuevo.',
    };
  }
  return { title: raw };
}

// ─── Banner de error mejorado ──────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  const { title, hint } = parseErrorMessage(message);
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
    >
      <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-red-700">{title}</p>
        {hint && <p className="text-xs text-red-500 mt-0.5">{hint}</p>}
      </div>
    </motion.div>
  );
}

// ─── PaymentModal ──────────────────────────────────────────────────────────────

export function PaymentModal({ storeId }: PaymentModalProps) {
  const t = useTranslations('pos');
  const {
    isPaymentModalOpen,
    setPaymentModalOpen,
    cart,
    activeShift,
    getTotals,
    discountCode,
    discountAmount,
    setDiscountCode,
    clearDiscount,
  } = usePosStore();
  const createOrder = useCreateOrder();
  const validateDiscount = useValidateDiscount();
  const totals = getTotals();

  const [step, setStep] = useState<Step>('discount');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [cashReceived, setCashReceived] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [callName, setCallName] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  // Confirmación antes de cancelar el pago
  const [confirmClose, setConfirmClose] = useState(false);

  const { fmt } = useMoney();

  const resetModal = () => {
    setStep('discount');
    setMethod('CASH');
    setCashReceived('');
    setCardAmount('');
    setLastOrder(null);
    setError('');
    setCodeInput('');
    setCallName('');
    setShowReceipt(false);
    setConfirmClose(false);
    setPaymentModalOpen(false);
  };

  const handleClose = () => {
    if (step === 'success') { resetModal(); return; }
    setConfirmClose(true);
  };

  // ─── Atajos de teclado dentro del modal ──────────────────────────────────
  useEffect(() => {
    if (!isPaymentModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape → pedir confirmación (a menos que ya esté pidiendo o sea success)
      if (e.key === 'Escape') {
        if (confirmClose) { setConfirmClose(false); return; }
        if (step !== 'success') { e.preventDefault(); setConfirmClose(true); }
        return;
      }

      const target = e.target as HTMLElement;
      const tag = target.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA';

      // Enter en step cash → confirmar si hay suficiente efectivo
      if (e.key === 'Enter' && step === 'cash' && !isInput) {
        const cashVal = parseFloat(cashReceived) || 0;
        if (cashVal >= totals.total) { e.preventDefault(); handleConfirm(); }
        return;
      }

      // Enter en step method → avanzar
      if (e.key === 'Enter' && step === 'method' && !isInput) {
        e.preventDefault();
        if (method === 'CASH') setStep('cash');
        else if (method === 'MIXED') setStep('mixed');
        else handleConfirm();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPaymentModalOpen, step, confirmClose, cashReceived, totals.total, method]);

  const handleValidateCode = async () => {
    if (!codeInput.trim()) { setStep('method'); return; }
    setIsValidating(true);
    setError('');
    try {
      const result = await validateDiscount.mutateAsync({
        code: codeInput.trim(),
        orderTotal: totals.subtotal + totals.taxAmount,
        storeId: activeShift?.storeId,
      });
      setDiscountCode(
        codeInput.trim().toUpperCase(),
        result.discountAmount,
        `${result.discount.code} (${result.discount.type === 'PERCENTAGE' ? result.discount.value + '%' : fmt(result.discount.value)})`,
      );
      setStep('method');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Código no válido');
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirm = async () => {
    if (!activeShift) return;
    setError('');

    const cashVal = parseFloat(cashReceived) || 0;
    const cardVal = parseFloat(cardAmount) || 0;

    if (method === 'CASH' && cashVal < totals.total) {
      setError(`Efectivo recibido (${ fmt(cashVal)}) es menor al total (${fmt(totals.total)})`);
      return;
    }
    if (method === 'MIXED' && cashVal + cardVal < totals.total) {
      setError(`La suma (${fmt(cashVal + cardVal)}) no cubre el total (${fmt(totals.total)})`);
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        storeId,
        shiftId: activeShift.id,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          modifierIds: i.selectedModifiers.map((m) => m.modifierId),
        })),
        paymentMethod: method,
        cashReceived: method !== 'CARD' ? cashVal || undefined : undefined,
        cardAmount: method !== 'CASH' ? (method === 'MIXED' ? cardVal : totals.total) : undefined,
        discountCode: discountCode || undefined,
        discountAmount: totals.discountAmount || undefined,
        callName: callName.trim() || undefined,
      });
      setLastOrder(order);
      setStep('success');
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? '';
      setError(raw || 'Error al procesar el pago. Intenta nuevamente.');
    }
  };

  if (!isPaymentModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-cafe-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-cafe-white rounded-3xl shadow-cafe-xl overflow-hidden"
        >
          {/* ── Overlay de confirmación de cierre ── */}
          <AnimatePresence>
            {confirmClose && (
              <motion.div
                key="confirm-close"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 bg-cafe-white/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-8 gap-5"
              >
                <div className="text-center space-y-2">
                  <p className="font-semibold text-cafe-black text-lg">¿Cancelar el cobro?</p>
                  <p className="text-sm text-cafe-gray">
                    Los productos del carrito se conservarán. Podrás volver a cobrar cuando quieras.
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => setConfirmClose(false)}
                    className="flex-1"
                  >
                    Seguir cobrando
                  </Button>
                  <Button
                    size="lg"
                    onClick={resetModal}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white border-red-500"
                  >
                    Sí, cancelar
                  </Button>
                </div>
                <p className="text-xs text-cafe-grayLight">Atajo: Esc para volver</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="px-6 py-5 border-b border-cafe-beige flex items-center justify-between">
            <h2 className="font-semibold text-cafe-black flex items-center gap-2">
              {step === 'success' ? (
                <>
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                    <Check size={12} className="text-green-600" />
                  </span>
                  {t('orderSuccess')}
                </>
              ) : (
                t('confirmPayment')
              )}
            </h2>
            <button
              onClick={handleClose}
              className="text-cafe-grayLight hover:text-cafe-gray transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="px-6 py-5">
            <AnimatePresence mode="wait">

              {/* STEP: Código de descuento */}
              {step === 'discount' && (
                <motion.div
                  key="discount"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-cafe-cream rounded-2xl p-4 text-center">
                    <p className="text-sm text-cafe-gray">{t('total')}</p>
                    <p className="text-3xl font-bold text-cafe-terracota mt-1">
                      {fmt(totals.subtotal + totals.taxAmount)}
                    </p>
                    <p className="text-xs text-cafe-gray mt-1">
                      {cart.length} ítem{cart.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="call-name"
                      className="block text-sm font-medium text-cafe-grayDark mb-1.5 flex items-center gap-1.5"
                    >
                      <Megaphone size={14} className="text-cafe-gray" />
                      Nombre para llamar (opcional)
                    </label>
                    <input
                      id="call-name"
                      type="text"
                      value={callName}
                      onChange={(e) => setCallName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleValidateCode()}
                      maxLength={40}
                      autoFocus
                      autoComplete="off"
                      placeholder="Ej: Ana"
                      className="input-field w-full"
                    />
                    <p className="text-xs text-cafe-grayLight mt-1">
                      Se muestra en la pantalla de pedidos. Si lo dejas vacío, se llama por número de ticket.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cafe-grayDark mb-1.5 flex items-center gap-1.5">
                      <Tag size={14} className="text-cafe-gray" />
                      Código de descuento (opcional)
                    </label>
                    {discountAmount > 0 ? (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        <Check size={15} className="text-green-600 shrink-0" />
                        <span className="text-sm text-green-700 font-medium flex-1">
                          {discountCode} — −{fmt(discountAmount)}
                        </span>
                        <button
                          onClick={() => { clearDiscount(); setCodeInput(''); }}
                          className="text-green-400 hover:text-red-400 text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={codeInput}
                          onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && handleValidateCode()}
                          placeholder="CAFE10"
                          className="input-field flex-1 uppercase"
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleValidateCode}
                          loading={isValidating}
                        >
                          Aplicar
                        </Button>
                      </div>
                    )}
                  </div>

                  {error && <ErrorBanner message={error} />}

                  <Button
                    fullWidth
                    size="lg"
                    onClick={() => { setError(''); setStep('method'); }}
                  >
                    Continuar →
                  </Button>
                </motion.div>
              )}

              {/* STEP: Método de pago */}
              {step === 'method' && (
                <motion.div
                  key="method"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-cafe-cream rounded-2xl p-4 text-center">
                    <p className="text-sm text-cafe-gray">{t('total')}</p>
                    <p className="text-3xl font-bold text-cafe-terracota mt-1">
                      {fmt(totals.total)}
                    </p>
                    {totals.discountAmount > 0 && (
                      <p className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                        <Tag size={10} /> Descuento −{fmt(totals.discountAmount)}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {(['CASH', 'CARD', 'MIXED'] as PaymentMethod[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMethod(m)}
                        className={`p-4 rounded-2xl border-2 text-center transition-all duration-150 ${
                          method === m
                            ? 'border-cafe-terracota bg-cafe-terracota/5'
                            : 'border-cafe-beige hover:border-cafe-grayLight'
                        }`}
                      >
                        <div className={`flex justify-center mb-1 ${method === m ? 'text-cafe-terracota' : 'text-cafe-gray'}`}>
                          {METHOD_ICONS[m]}
                        </div>
                        <p className="text-xs font-medium text-cafe-black">
                          {t(m.toLowerCase() as any)}
                        </p>
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-cafe-grayLight text-center">
                    Selecciona y presiona Enter para continuar
                  </p>

                  <div className="flex gap-3">
                    <Button variant="secondary" size="lg" onClick={() => setStep('discount')} className="flex-1">
                      ← Atrás
                    </Button>
                    <Button
                      size="lg"
                      onClick={() => {
                        if (method === 'CASH') setStep('cash');
                        else if (method === 'MIXED') setStep('mixed');
                        else handleConfirm();
                      }}
                      loading={createOrder.isPending && method === 'CARD'}
                      className="flex-[2]"
                    >
                      {method === 'CARD' ? t('confirmPayment') : 'Continuar →'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP: Efectivo */}
              {step === 'cash' && (
                <motion.div
                  key="cash"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-cafe-cream rounded-2xl p-4 text-center">
                    <p className="text-sm text-cafe-gray">{t('total')}</p>
                    <p className="text-3xl font-bold text-cafe-terracota">{fmt(totals.total)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cafe-grayDark mb-1.5">
                      {t('cashReceived')}
                    </label>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const cashVal = parseFloat(cashReceived) || 0;
                          if (cashVal >= totals.total) handleConfirm();
                        }
                      }}
                      placeholder="0"
                      autoFocus
                      className="input-field text-xl font-bold text-center"
                    />
                  </div>

                  {cashReceived && parseFloat(cashReceived) >= totals.total && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex justify-between items-center"
                    >
                      <span className="text-sm text-green-700">{t('change')}</span>
                      <span className="font-bold text-green-700 text-lg">
                        {fmt(parseFloat(cashReceived) - totals.total)}
                      </span>
                    </motion.div>
                  )}

                  {error && <ErrorBanner message={error} />}

                  <p className="text-xs text-cafe-grayLight text-center">
                    Presiona Enter para confirmar el pago
                  </p>

                  <div className="flex gap-3">
                    <Button variant="secondary" size="lg" onClick={() => setStep('method')} className="flex-1">
                      ← Atrás
                    </Button>
                    <Button
                      size="lg"
                      loading={createOrder.isPending}
                      disabled={!cashReceived || parseFloat(cashReceived) < totals.total}
                      onClick={handleConfirm}
                      className="flex-[2]"
                    >
                      {createOrder.isPending ? t('processing') : t('confirmPayment')}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP: Mixto */}
              {step === 'mixed' && (
                <motion.div
                  key="mixed"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="bg-cafe-cream rounded-2xl p-4 text-center">
                    <p className="text-sm text-cafe-gray">{t('total')}</p>
                    <p className="text-3xl font-bold text-cafe-terracota">{fmt(totals.total)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cafe-grayDark mb-1.5 flex items-center gap-1.5">
                      <Banknote size={15} className="text-cafe-gray" /> {t('cashReceived')}
                    </label>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      placeholder="0"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cafe-grayDark mb-1.5 flex items-center gap-1.5">
                      <CreditCard size={15} className="text-cafe-gray" /> Monto en tarjeta
                    </label>
                    <input
                      type="number"
                      value={cardAmount}
                      onChange={(e) => setCardAmount(e.target.value)}
                      placeholder="0"
                      className="input-field"
                    />
                  </div>

                  {cashReceived && cardAmount && (
                    <div className="text-sm text-cafe-gray text-center">
                      Cubierto:{' '}
                      <span className={`font-bold ${parseFloat(cashReceived) + parseFloat(cardAmount) >= totals.total ? 'text-green-600' : 'text-red-500'}`}>
                        {fmt(parseFloat(cashReceived || '0') + parseFloat(cardAmount || '0'))}
                      </span>
                      {' / '}{fmt(totals.total)}
                    </div>
                  )}

                  {error && <ErrorBanner message={error} />}

                  <div className="flex gap-3">
                    <Button variant="secondary" size="lg" onClick={() => setStep('method')} className="flex-1">
                      ← Atrás
                    </Button>
                    <Button
                      size="lg"
                      loading={createOrder.isPending}
                      onClick={handleConfirm}
                      className="flex-[2]"
                    >
                      {createOrder.isPending ? t('processing') : t('confirmPayment')}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP: Éxito */}
              {step === 'success' && lastOrder && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4 py-2"
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.4 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mx-auto"
                  >
                    <Check size={32} strokeWidth={2.5} />
                  </motion.div>

                  <div>
                    <p className="font-semibold text-cafe-black text-lg">{t('orderSuccess')}</p>
                    <p className="text-cafe-gray text-sm mt-1">
                      {t('ticketNumber')}{lastOrder.ticketNumber}
                      {lastOrder.callName && (
                        <span className="text-cafe-black font-medium"> · {lastOrder.callName}</span>
                      )}
                    </p>
                  </div>

                  <div className="bg-cafe-cream rounded-2xl p-4 text-left space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-cafe-gray">{t('total')}</span>
                      <span className="font-bold text-cafe-terracota">{fmt(lastOrder.total)}</span>
                    </div>
                    {lastOrder.change !== undefined && lastOrder.change > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-cafe-gray">{t('change')}</span>
                        <span className="font-bold text-green-600">{fmt(lastOrder.change)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-cafe-gray">Método</span>
                      <span className="font-medium text-cafe-black flex items-center gap-1.5">
                        {METHOD_ICONS[lastOrder.paymentMethod]}
                        {METHOD_LABELS[lastOrder.paymentMethod]}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={() => setShowReceipt(true)}
                    >
                      <FileDown size={16} />
                      Ticket
                    </Button>
                    <Button fullWidth size="lg" onClick={resetModal} className="flex-[2]">
                      Nueva venta →
                    </Button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Receipt print modal */}
      {showReceipt && lastOrder && (
        <ReceiptModal
          order={lastOrder}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </AnimatePresence>
  );
}
