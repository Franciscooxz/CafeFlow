'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePosStore } from '@/store/pos.store';
import { useProductModifierGroups } from '@/hooks/usePOS';
import { useMoney } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/Button';
import { Check, Sliders } from '@/components/icons';
import type { SelectedModifier } from '@/types';

export function ModifierModal() {
  const { modifierProduct, closeModifierModal, addToCart } = usePosStore();
  const { data: groups, isLoading } = useProductModifierGroups(modifierProduct?.id ?? null);

  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const money = useMoney();

  if (!modifierProduct) return null;

  const fmt = (n: number) => (n === 0 ? '' : n > 0 ? `+${money.fmt(n)}` : money.fmt(n));

  const toggle = (groupId: string, modId: string, multiSelect: boolean) => {
    setSelections((prev) => {
      const current = prev[groupId] ?? [];
      if (multiSelect) {
        return {
          ...prev,
          [groupId]: current.includes(modId)
            ? current.filter((id) => id !== modId)
            : [...current, modId],
        };
      }
      return { ...prev, [groupId]: current[0] === modId ? [] : [modId] };
    });
  };

  const handleAdd = () => {
    if (!groups) return;
    // Validate required groups
    for (const group of groups) {
      if (group.required && !(selections[group.id]?.length > 0)) return;
    }

    const selectedMods: SelectedModifier[] = groups.flatMap((group: any) =>
      (selections[group.id] ?? []).map((modId: string) => {
        const mod = group.modifiers.find((m: any) => m.id === modId)!;
        return {
          groupId: group.id,
          groupName: group.name,
          modifierId: modId,
          name: mod.name,
          priceAdjustment: mod.priceAdjustment,
        };
      }),
    );

    addToCart(modifierProduct, selectedMods);
    setSelections({});
    closeModifierModal();
  };

  const canAdd =
    groups?.every(
      (g: any) => !g.required || (selections[g.id]?.length ?? 0) > 0,
    ) ?? false;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-cafe-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="w-full max-w-sm bg-cafe-white rounded-3xl shadow-cafe-xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-cafe-beige flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-cafe-terracota">
                <Sliders size={18} strokeWidth={1.8} />
              </span>
              <div>
                <p className="font-semibold text-cafe-black text-sm leading-tight">
                  {modifierProduct.name}
                </p>
                <p className="text-xs text-cafe-gray">Personaliza tu pedido</p>
              </div>
            </div>
            <button
              onClick={() => { setSelections({}); closeModifierModal(); }}
              className="text-cafe-grayLight hover:text-cafe-gray text-xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-5">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-cafe-beige rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              groups?.map((group: any) => (
                <div key={group.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-semibold text-cafe-black">{group.name}</p>
                    {group.required && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-cafe-terracota/10 text-cafe-terracota rounded-full">
                        Requerido
                      </span>
                    )}
                    {group.multiSelect && (
                      <span className="text-[10px] text-cafe-gray ml-auto">
                        Selección múltiple
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {group.modifiers
                      .filter((m: any) => m.isActive)
                      .map((mod: any) => {
                        const selected = (selections[group.id] ?? []).includes(mod.id);
                        return (
                          <button
                            key={mod.id}
                            onClick={() => toggle(group.id, mod.id, group.multiSelect)}
                            className={`relative flex items-center justify-between px-3 py-2.5 rounded-xl border text-left text-sm transition-all ${
                              selected
                                ? 'border-cafe-terracota bg-cafe-terracota/5 text-cafe-black'
                                : 'border-cafe-beige hover:border-cafe-grayLight text-cafe-grayDark'
                            }`}
                          >
                            <span className="font-medium truncate pr-2">{mod.name}</span>
                            <span className={`text-xs shrink-0 ${selected ? 'text-cafe-terracota font-semibold' : 'text-cafe-gray'}`}>
                              {fmt(mod.priceAdjustment)}
                            </span>
                            {selected && (
                              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-cafe-terracota flex items-center justify-center">
                                <Check size={8} strokeWidth={3} className="text-cafe-onBrand" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 pt-3 border-t border-cafe-beige">
            <Button
              fullWidth
              size="lg"
              onClick={handleAdd}
              disabled={!canAdd}
            >
              Agregar al carrito
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
