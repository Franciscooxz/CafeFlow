'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useMoney } from '@/hooks/useCurrency';
import {
  Upload,
  X,
  FileDown,
  CheckCircle2,
  AlertTriangle,
  Package,
} from '@/components/icons';

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface ParsedRow {
  name: string;
  description: string;
  price: number;
  taxRate: number;
  stock: number;
  lowStockAlert: number;
  categoryId?: string;
  _error?: string;
}

interface CSVImportModalProps {
  categories: { id: string; name: string }[];
  onImport: (items: Omit<ParsedRow, '_error'>[]) => Promise<void>;
  onClose: () => void;
}

// ─── CSV Template ─────────────────────────────────────────────────────────────

function downloadTemplate() {
  const rows = [
    ['nombre', 'descripcion', 'precio', 'impuesto%', 'stock', 'alertaStock'],
    ['Café Americano', 'Café negro simple', '3500', '0.08', '50', '10'],
    ['Croissant', 'Croissant de mantequilla', '4500', '0', '20', '5'],
  ];
  const csv = '\uFEFF' + rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plantilla-productos.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseCSV(text: string): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  // Detectar si hay cabecera (primera celda no es número)
  const firstCell = lines[0].split(',')[0].trim().toLowerCase();
  const hasHeader =
    isNaN(Number(firstCell)) && firstCell !== '';
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line, idx) => {
    // Soporte básico para campos con comas entre comillas
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { cells.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    cells.push(current.trim());

    const name = cells[0] ?? '';
    const description = cells[1] ?? '';
    const price = parseFloat(cells[2] ?? '0');
    const taxRate = parseFloat(cells[3] ?? '0');
    const stock = parseInt(cells[4] ?? '0', 10);
    const lowStockAlert = parseInt(cells[5] ?? '5', 10);

    const errors: string[] = [];
    if (!name) errors.push('Nombre requerido');
    if (isNaN(price) || price < 0) errors.push('Precio inválido');
    if (isNaN(taxRate) || taxRate < 0) errors.push('Impuesto inválido');

    return {
      name,
      description,
      price: isNaN(price) ? 0 : price,
      taxRate: isNaN(taxRate) ? 0 : taxRate,
      stock: isNaN(stock) ? 0 : stock,
      lowStockAlert: isNaN(lowStockAlert) ? 5 : lowStockAlert,
      _error: errors.length > 0 ? errors.join(', ') : undefined,
    };
  });
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function CSVImportModal({ categories, onImport, onClose }: CSVImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ created: number } | null>(null);

  const validRows = rows.filter((r) => !r._error);
  const errorRows = rows.filter((r) => !!r._error);

  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRows(parseCSV(text));
      setDone(null);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) handleFile(file);
  };

  const handleSubmit = async () => {
    if (validRows.length === 0) return;
    setLoading(true);
    try {
      await onImport(validRows.map(({ _error, ...r }) => r));
      setDone({ created: validRows.length });
    } finally {
      setLoading(false);
    }
  };

  const { fmt } = useMoney();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cafe-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-cafe-white rounded-3xl shadow-cafe-xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-cafe-beige shrink-0">
          <div>
            <h2 className="text-base font-semibold text-cafe-black flex items-center gap-2">
              <Upload size={18} className="text-cafe-terracota" />
              Importar productos por CSV
            </h2>
            <p className="text-xs text-cafe-gray mt-0.5">
              Columnas: nombre, descripcion, precio, impuesto%, stock, alertaStock
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-cafe-grayLight hover:text-cafe-black hover:bg-cafe-cream transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Éxito */}
          {done ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <CheckCircle2 size={48} className="text-green-500" strokeWidth={1.5} />
              <p className="text-lg font-semibold text-cafe-black">
                {done.created} productos importados
              </p>
              <p className="text-sm text-cafe-gray">Los productos ya están disponibles en el inventario.</p>
              <Button onClick={onClose} className="mt-2">Cerrar</Button>
            </div>
          ) : (
            <>
              {/* Zona de drop */}
              {rows.length === 0 && (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-cafe-beige rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-cafe-terracota/50 hover:bg-cafe-cream/30 transition-all"
                >
                  <Package size={36} strokeWidth={1.2} className="text-cafe-grayLight" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-cafe-black">
                      Arrastra tu archivo CSV o haz clic
                    </p>
                    <p className="text-xs text-cafe-gray mt-1">Solo archivos .csv</p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                </div>
              )}

              {/* Botón descargar plantilla */}
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 text-xs text-cafe-gray hover:text-cafe-terracota transition-colors"
              >
                <FileDown size={13} />
                Descargar plantilla CSV de ejemplo
              </button>

              {/* Vista previa */}
              {rows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-cafe-black">
                      Vista previa — <span className="text-cafe-terracota">{fileName}</span>
                    </p>
                    <button
                      onClick={() => { setRows([]); setFileName(''); }}
                      className="text-xs text-cafe-grayLight hover:text-red-400 transition-colors"
                    >
                      Cambiar archivo
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 size={13} />
                      {validRows.length} válidos
                    </div>
                    {errorRows.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">
                        <AlertTriangle size={13} />
                        {errorRows.length} con errores (se omitirán)
                      </div>
                    )}
                  </div>

                  {/* Tabla */}
                  <div className="border border-cafe-beige rounded-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-56">
                      <table className="w-full text-xs">
                        <thead className="bg-cafe-cream sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-cafe-gray font-medium">#</th>
                            <th className="px-3 py-2 text-left text-cafe-gray font-medium">Nombre</th>
                            <th className="px-3 py-2 text-right text-cafe-gray font-medium">Precio</th>
                            <th className="px-3 py-2 text-right text-cafe-gray font-medium">IVA</th>
                            <th className="px-3 py-2 text-right text-cafe-gray font-medium">Stock</th>
                            <th className="px-3 py-2 text-left text-cafe-gray font-medium">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cafe-beige/60">
                          {rows.map((r, i) => (
                            <tr
                              key={i}
                              className={r._error ? 'bg-red-50/50' : 'hover:bg-cafe-cream/30'}
                            >
                              <td className="px-3 py-2 text-cafe-grayLight">{i + 1}</td>
                              <td className="px-3 py-2 text-cafe-black font-medium max-w-[160px] truncate">
                                {r.name || <span className="text-red-400 italic">vacío</span>}
                              </td>
                              <td className="px-3 py-2 text-right">${fmt(r.price)}</td>
                              <td className="px-3 py-2 text-right">{(r.taxRate * 100).toFixed(0)}%</td>
                              <td className="px-3 py-2 text-right">{r.stock}</td>
                              <td className="px-3 py-2">
                                {r._error ? (
                                  <span className="text-red-500 flex items-center gap-1">
                                    <AlertTriangle size={11} />
                                    {r._error}
                                  </span>
                                ) : (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <CheckCircle2 size={11} />
                                    OK
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!done && rows.length > 0 && (
          <div className="flex gap-3 px-6 py-4 border-t border-cafe-beige shrink-0">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={validRows.length === 0}
              className="flex-[2]"
            >
              Importar {validRows.length} productos
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
