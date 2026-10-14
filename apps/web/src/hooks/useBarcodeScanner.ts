'use client';

import { useEffect, useRef } from 'react';

const BARCODE_MIN_LENGTH = 4;
// Los lectores de código de barras USB tipean < 30ms por carácter.
// Usamos 50ms como umbral generoso para distinguirlos del tipeo humano.
const BARCODE_MAX_INTERVAL_MS = 50;

/**
 * Detecta input de lectores de código de barras USB.
 * Los scanners se comportan como teclados que tipean muy rápido
 * y terminan con Enter.
 *
 * Solo se activa cuando ningún input/textarea tiene el foco
 * (si el scanner tipea en un input activo, ese input maneja el evento).
 */
export function useBarcodeScanner(
  onScan: (code: string) => void,
  enabled = true,
) {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  // Usamos ref para onScan para evitar re-registrar el listener en cada render
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const tag = target.tagName;

      // Si hay un input/textarea activo, ese elemento maneja su propio scanner
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const now = Date.now();

      if (e.key === 'Enter') {
        const code = bufferRef.current.trim();
        bufferRef.current = '';
        if (code.length >= BARCODE_MIN_LENGTH) {
          e.preventDefault();
          onScanRef.current(code);
        }
        return;
      }

      // Resetear buffer si el intervalo entre teclas es demasiado largo (tipeo humano)
      if (
        now - lastKeyTimeRef.current > BARCODE_MAX_INTERVAL_MS &&
        bufferRef.current.length > 0
      ) {
        bufferRef.current = '';
      }

      // Acumular solo caracteres imprimibles
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }

      lastKeyTimeRef.current = now;
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}
