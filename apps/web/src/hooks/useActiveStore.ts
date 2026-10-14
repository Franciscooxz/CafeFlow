'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useAllStores } from '@/hooks/useAdmin';

// Por dispositivo: la tablet de barra y la TV de cada sede recuerdan la suya.
const STORAGE_KEY = 'cafeflow-active-store';

/**
 * Sede para pantallas de barra y de clientes. Un usuario con sede asignada usa
 * esa; el dueño (sin sede fija) usa la que eligió en este dispositivo, o la
 * única que exista.
 */
export function useActiveStore() {
  const { user } = useAuthStore();
  const { data: stores = [], isLoading } = useAllStores();
  const [chosen, setChosen] = useState<string | null>(null);

  useEffect(() => {
    setChosen(localStorage.getItem(STORAGE_KEY));
  }, []);

  const fixed = user?.storeId ?? null;
  const storeId =
    fixed ??
    (chosen && stores.some((s) => s.id === chosen) ? chosen : stores.length === 1 ? stores[0].id : null);

  const choose = (id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setChosen(id);
  };

  return {
    storeId,
    stores: stores as Array<{ id: string; name: string }>,
    canChoose: !fixed && stores.length > 1,
    choose,
    isLoading: !fixed && isLoading,
  };
}
