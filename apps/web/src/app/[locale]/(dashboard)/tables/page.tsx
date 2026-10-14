'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth.store';
import {
  useTables,
  useCreateTable,
  useUpdateTable,
  useUpdateTableStatus,
  useDeleteTable,
} from '@/hooks/useAdmin';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Table, TableStatus } from '@/types';
import {
  Plus,
  X,
  Edit3,
  Trash2,
  Users,
  ChefHat,
} from '@/components/icons';
import { clsx } from 'clsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TableStatus,
  { label: string; color: string; dot: string; next: TableStatus }
> = {
  AVAILABLE: { label: 'Disponible', color: 'bg-green-50 border-green-200 text-green-700', dot: 'bg-green-400', next: 'OCCUPIED' },
  OCCUPIED:  { label: 'Ocupada',    color: 'bg-red-50 border-red-200 text-red-700',       dot: 'bg-red-400',   next: 'RESERVED' },
  RESERVED:  { label: 'Reservada',  color: 'bg-amber-50 border-amber-200 text-amber-700', dot: 'bg-amber-400', next: 'AVAILABLE' },
};

// ─── Table Card ───────────────────────────────────────────────────────────────

function TableCard({
  table,
  onEdit,
  onDelete,
  onStatusClick,
}: {
  table: Table;
  onEdit: (t: Table) => void;
  onDelete: (id: string) => void;
  onStatusClick: (id: string, status: TableStatus) => void;
}) {
  const cfg = STATUS_CONFIG[table.status];
  const updateStatus = useUpdateTableStatus();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl border-2 p-4 flex flex-col gap-3 transition-all ${cfg.color}`}
    >
      {/* Number + status */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xl font-bold leading-tight">
            Mesa {table.number}
          </p>
          {table.name && (
            <p className="text-xs mt-0.5 opacity-70">{table.name}</p>
          )}
        </div>
        <button
          onClick={() => onStatusClick(table.id, cfg.next)}
          disabled={updateStatus.isPending}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-white/60 hover:bg-white/90 transition-colors"
        >
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </button>
      </div>

      {/* Capacity */}
      <div className="flex items-center gap-1.5 text-xs opacity-60">
        <Users size={12} />
        <span>{table.capacity} personas</span>
      </div>

      {/* Notes */}
      {table.notes && (
        <p className="text-xs opacity-60 truncate">{table.notes}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onEdit(table)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-white/50 hover:bg-white/80 text-xs font-medium transition-colors"
        >
          <Edit3 size={12} />
          Editar
        </button>
        <button
          onClick={() => onDelete(table.id)}
          className="p-1.5 rounded-xl bg-white/50 hover:bg-red-100 text-xs font-medium transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  initial?: Partial<Table>;
  storeId: string;
  onClose: () => void;
}

function TableModal({ initial, storeId, onClose }: ModalProps) {
  const isEdit = !!initial?.id;
  const [number, setNumber] = useState(String(initial?.number ?? ''));
  const [name, setName] = useState(initial?.name ?? '');
  const [capacity, setCapacity] = useState(String(initial?.capacity ?? 2));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [err, setErr] = useState('');

  const create = useCreateTable();
  const update = useUpdateTable();

  const isPending = create.isPending || update.isPending;

  const handleSubmit = async () => {
    if (!number) return setErr('El número de mesa es requerido');
    setErr('');
    try {
      if (isEdit && initial?.id) {
        await update.mutateAsync({ id: initial.id, name: name || undefined, capacity: parseInt(capacity) || 2, notes: notes || undefined });
      } else {
        await create.mutateAsync({ storeId, number: parseInt(number), name: name || undefined, capacity: parseInt(capacity) || 2, notes: notes || undefined });
      }
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? 'Error al guardar');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-cafe-white rounded-3xl shadow-2xl p-6 w-full max-w-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-cafe-black">
            {isEdit ? 'Editar mesa' : 'Nueva mesa'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-cafe-cream transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <Input
            label="Número de mesa *"
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            disabled={isEdit}
            placeholder="1"
          />
          <Input
            label="Nombre (opcional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Terraza, VIP..."
          />
          <Input
            label="Capacidad (personas)"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="2"
          />
          <Input
            label="Notas"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Junto a la ventana..."
          />
        </div>

        {err && <p className="text-sm text-red-500">{err}</p>}

        <div className="flex gap-3">
          <Button variant="secondary" size="lg" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button size="lg" loading={isPending} onClick={handleSubmit} className="flex-[2]">
            {isEdit ? 'Guardar' : 'Crear mesa'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Tables Page ──────────────────────────────────────────────────────────────

export default function TablesPage() {
  const { user } = useAuthStore();
  const storeId = user?.storeId ?? '';
  const { data: tables, isLoading } = useTables(storeId);
  const deleteTable = useDeleteTable();
  const updateStatus = useUpdateTableStatus();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTable, setEditTable] = useState<Table | null>(null);
  const [filterStatus, setFilterStatus] = useState<TableStatus | 'ALL'>('ALL');

  const filtered =
    filterStatus === 'ALL'
      ? tables ?? []
      : (tables ?? []).filter((t: Table) => t.status === filterStatus);

  const counts = {
    AVAILABLE: (tables ?? []).filter((t: Table) => t.status === 'AVAILABLE').length,
    OCCUPIED: (tables ?? []).filter((t: Table) => t.status === 'OCCUPIED').length,
    RESERVED: (tables ?? []).filter((t: Table) => t.status === 'RESERVED').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-cafe-black flex items-center gap-2">
            <ChefHat size={20} className="text-cafe-terracota" />
            Mesas
          </h1>
          <p className="text-sm text-cafe-gray mt-0.5">
            {tables?.length ?? 0} mesas · {counts.OCCUPIED} ocupadas · {counts.AVAILABLE} disponibles
          </p>
        </div>
        {user?.role !== 'CASHIER' && (
          <Button onClick={() => { setEditTable(null); setModalOpen(true); }} className="flex items-center gap-1.5">
            <Plus size={15} />
            Nueva mesa
          </Button>
        )}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED'] as const).map((s) => {
          const cfg = s !== 'ALL' ? STATUS_CONFIG[s] : null;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                filterStatus === s
                  ? 'bg-cafe-terracota text-cafe-onBrand'
                  : 'bg-cafe-cream text-cafe-gray hover:bg-cafe-beige',
              )}
            >
              {cfg && <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />}
              {s === 'ALL' ? 'Todas' : cfg?.label}
              <span className="ml-1 opacity-60">
                {s === 'ALL' ? (tables?.length ?? 0) : counts[s]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-cafe-cream rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-cafe-grayLight">
          <ChefHat size={48} strokeWidth={1} className="opacity-30 mb-3" />
          <p className="text-sm">
            {filterStatus === 'ALL'
              ? 'No hay mesas. Crea la primera.'
              : `No hay mesas con estado "${STATUS_CONFIG[filterStatus]?.label}"`}
          </p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
        >
          <AnimatePresence>
            {filtered.map((table: Table) => (
              <TableCard
                key={table.id}
                table={table}
                onEdit={(t) => { setEditTable(t); setModalOpen(true); }}
                onDelete={(id) => deleteTable.mutate(id)}
                onStatusClick={(id, status) => updateStatus.mutate({ id, status })}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Modal */}
      {modalOpen && (
        <TableModal
          initial={editTable ?? undefined}
          storeId={storeId}
          onClose={() => { setModalOpen(false); setEditTable(null); }}
        />
      )}
    </div>
  );
}
