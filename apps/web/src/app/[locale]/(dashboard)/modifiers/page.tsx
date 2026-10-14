'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useModifierGroups,
  useCreateModifierGroup,
  useUpdateModifierGroup,
  useToggleModifierGroup,
  useAddModifierItem,
  useUpdateModifierItem,
  useToggleModifierItem,
} from '@/hooks/useAdmin';
import { useMoney } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/Button';
import {
  Plus,
  Sliders,
  Edit3,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  Check,
} from '@/components/icons';

interface GroupModalProps {
  initial?: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

function GroupModal({ initial, onClose, onSave }: GroupModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [required, setRequired] = useState(initial?.required ?? false);
  const [multiSelect, setMultiSelect] = useState(initial?.multiSelect ?? false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave({ name: name.trim(), required, multiSelect });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cafe-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-cafe-white rounded-3xl shadow-cafe-xl overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-cafe-beige">
          <h3 className="font-semibold text-cafe-black">
            {initial ? 'Editar grupo' : 'Nuevo grupo de modificadores'}
          </h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-cafe-grayDark mb-1.5">Nombre del grupo</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Tamaño, Extras, Tipo de leche"
              className="input-field"
              autoFocus
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setRequired(!required)}
              className={`w-10 h-6 rounded-full transition-colors relative ${required ? 'bg-cafe-terracota' : 'bg-cafe-grayLight'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${required ? 'left-5' : 'left-1'}`} />
            </div>
            <span className="text-sm text-cafe-grayDark">Selección requerida</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setMultiSelect(!multiSelect)}
              className={`w-10 h-6 rounded-full transition-colors relative ${multiSelect ? 'bg-cafe-terracota' : 'bg-cafe-grayLight'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${multiSelect ? 'left-5' : 'left-1'}`} />
            </div>
            <span className="text-sm text-cafe-grayDark">Selección múltiple</span>
          </label>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" loading={loading} onClick={handleSubmit}>Guardar</Button>
        </div>
      </motion.div>
    </div>
  );
}

interface ItemModalProps {
  groupId: string;
  initial?: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

function ItemModal({ initial, onClose, onSave }: ItemModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(String(initial?.priceAdjustment ?? 0));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave({ name: name.trim(), priceAdjustment: parseFloat(price) || 0 });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cafe-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-cafe-white rounded-3xl shadow-cafe-xl"
      >
        <div className="px-6 py-5 border-b border-cafe-beige">
          <h3 className="font-semibold text-cafe-black">
            {initial ? 'Editar opción' : 'Nueva opción'}
          </h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-cafe-grayDark mb-1.5">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Grande, Shot extra" className="input-field" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-cafe-grayDark mb-1.5">Ajuste de precio (puede ser negativo)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="input-field" />
            <p className="text-xs text-cafe-gray mt-1">0 = sin costo adicional</p>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" loading={loading} onClick={handleSubmit}>Guardar</Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ModifiersPage() {
  const money = useMoney();
  const fmt = (n: number) => (n === 0 ? 'Sin costo' : (n > 0 ? '+' : '') + money.fmt(n));
  const { data: groups, isLoading } = useModifierGroups();
  const createGroup = useCreateModifierGroup();
  const updateGroup = useUpdateModifierGroup();
  const toggleGroup = useToggleModifierGroup();
  const addItem = useAddModifierItem();
  const updateItem = useUpdateModifierItem();
  const toggleItem = useToggleModifierItem();

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [groupModal, setGroupModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [itemModal, setItemModal] = useState<{ open: boolean; groupId?: string; data?: any }>({ open: false });

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-cafe-black flex items-center gap-2">
            <Sliders size={20} className="text-cafe-terracota" />
            Modificadores
          </h1>
          <p className="text-sm text-cafe-gray mt-0.5">
            Grupos de opciones para personalizar productos (tamaño, extras, etc.)
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setGroupModal({ open: true })}
          className="flex items-center gap-1.5"
        >
          <Plus size={16} /> Nuevo grupo
        </Button>
      </div>

      {/* Groups list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-cafe-beige rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : groups?.length === 0 ? (
        <div className="text-center py-16 text-cafe-gray">
          <Sliders size={40} strokeWidth={1.2} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay grupos de modificadores</p>
          <p className="text-xs mt-1">Crea grupos para personalizar tus productos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups?.map((group: any) => (
            <div key={group.id} className="bg-cafe-white rounded-2xl border border-cafe-beige overflow-hidden">
              {/* Group header */}
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-cafe-cream/50 transition-colors"
                onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${group.isActive ? 'text-cafe-black' : 'text-cafe-grayLight'}`}>
                      {group.name}
                    </p>
                    {group.required && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-cafe-terracota/10 text-cafe-terracota rounded-full">
                        Requerido
                      </span>
                    )}
                    {group.multiSelect && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                        Múltiple
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-cafe-gray mt-0.5">
                    {group.modifiers.length} opcion{group.modifiers.length !== 1 ? 'es' : ''} · {group._count?.products ?? 0} producto{(group._count?.products ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setGroupModal({ open: true, data: group }); }}
                    className="p-1.5 text-cafe-grayLight hover:text-cafe-gray rounded-lg hover:bg-cafe-beige transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleGroup.mutate(group.id); }}
                    className={`transition-colors ${group.isActive ? 'text-cafe-terracota' : 'text-cafe-grayLight'}`}
                  >
                    {group.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <motion.div
                    animate={{ rotate: expandedGroup === group.id ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-cafe-grayLight"
                  >
                    <ChevronDown size={18} />
                  </motion.div>
                </div>
              </div>

              {/* Items */}
              <AnimatePresence>
                {expandedGroup === group.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-cafe-beige overflow-hidden"
                  >
                    <div className="px-5 py-3 space-y-2 bg-cafe-cream/30">
                      {group.modifiers.map((mod: any) => (
                        <div
                          key={mod.id}
                          className="flex items-center gap-3 px-3 py-2 bg-cafe-white rounded-xl"
                        >
                          {mod.isActive ? (
                            <Check size={14} className="text-cafe-terracota shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-cafe-grayLight shrink-0" />
                          )}
                          <span className={`text-sm flex-1 ${mod.isActive ? 'text-cafe-black' : 'text-cafe-grayLight'}`}>
                            {mod.name}
                          </span>
                          <span className="text-xs text-cafe-gray">{fmt(mod.priceAdjustment)}</span>
                          <button
                            onClick={() => setItemModal({ open: true, groupId: group.id, data: mod })}
                            className="p-1 text-cafe-grayLight hover:text-cafe-gray rounded-lg hover:bg-cafe-beige transition-colors"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => toggleItem.mutate({ groupId: group.id, itemId: mod.id })}
                            className={`transition-colors ${mod.isActive ? 'text-cafe-terracota' : 'text-cafe-grayLight'}`}
                          >
                            {mod.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => setItemModal({ open: true, groupId: group.id })}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-cafe-grayLight text-cafe-gray hover:border-cafe-terracota hover:text-cafe-terracota transition-colors text-sm"
                      >
                        <Plus size={14} /> Agregar opción
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Group modal */}
      {groupModal.open && (
        <GroupModal
          initial={groupModal.data}
          onClose={() => setGroupModal({ open: false })}
          onSave={async (data) => {
            if (groupModal.data) {
              await updateGroup.mutateAsync({ id: groupModal.data.id, ...data });
            } else {
              await createGroup.mutateAsync(data);
            }
          }}
        />
      )}

      {/* Item modal */}
      {itemModal.open && itemModal.groupId && (
        <ItemModal
          groupId={itemModal.groupId}
          initial={itemModal.data}
          onClose={() => setItemModal({ open: false })}
          onSave={async (data) => {
            if (itemModal.data) {
              await updateItem.mutateAsync({ groupId: itemModal.groupId!, itemId: itemModal.data.id, ...data });
            } else {
              await addItem.mutateAsync({ groupId: itemModal.groupId!, ...data });
            }
          }}
        />
      )}
    </div>
  );
}
