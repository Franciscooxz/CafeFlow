'use client';

import { useMemo, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { usePosStore } from '@/store/pos.store';
import { useProducts, useCategories } from '@/hooks/usePOS';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { useMoney } from '@/hooks/useCurrency';
import type { Product } from '@/types';
import { clsx } from 'clsx';
import { CoffeeCupIcon, Search, AlertTriangle, Sliders } from '@/components/icons';

// ─── ProductCard ───────────────────────────────────────────────────────────────

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const { localStockUpdates } = usePosStore();
  const { fmt } = useMoney();
  const stock = localStockUpdates[product.id] ?? product.stock;
  const isLowStock = stock > 0 && stock <= product.lowStockAlert;
  const isOutOfStock = stock <= 0;
  const hasModifiers = (product.modifierGroups?.length ?? 0) > 0;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: isOutOfStock ? 1 : 0.94 }}
      onClick={!isOutOfStock ? onAdd : undefined}
      className={clsx(
        'relative p-4 rounded-2xl text-left transition-colors duration-150 border',
        isOutOfStock
          ? 'bg-cafe-beige border-cafe-grayLight opacity-50 cursor-not-allowed'
          : 'bg-cafe-white border-transparent hover:border-cafe-terracota/30 hover:shadow-cafe cursor-pointer',
      )}
    >
      {/* Imagen o ícono placeholder */}
      <div className="w-full aspect-square rounded-xl bg-cafe-cream flex items-center justify-center mb-3 overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-cafe-terracota/40">
            <CoffeeCupIcon size={36} strokeWidth={1.2} />
          </span>
        )}
      </div>

      <p className="text-sm font-semibold text-cafe-black leading-tight line-clamp-2">
        {product.name}
      </p>

      <p className="text-xs text-cafe-gray mt-0.5 line-clamp-1">
        {product.category?.name}
      </p>

      <div className="flex items-center justify-between mt-2">
        <p className="text-sm font-bold text-cafe-terracota">
          {fmt(product.price)}
        </p>
        {hasModifiers && (
          <span className="text-cafe-grayLight">
            <Sliders size={13} strokeWidth={1.8} />
          </span>
        )}
      </div>

      {/* Badge stock bajo */}
      {isLowStock && !isOutOfStock && (
        <span className="absolute top-2 right-2 badge bg-amber-100 text-amber-700 flex items-center gap-0.5">
          <AlertTriangle size={10} className="shrink-0" /> {stock}
        </span>
      )}
      {isOutOfStock && (
        <span className="absolute top-2 right-2 badge bg-red-100 text-red-600">
          Agotado
        </span>
      )}

      {/* Tap indicator */}
      {!isOutOfStock && (
        <div className="absolute inset-0 rounded-2xl bg-cafe-terracota/0 hover:bg-cafe-terracota/5 transition-colors duration-150" />
      )}
    </motion.button>
  );
}

// ─── ProductGrid ───────────────────────────────────────────────────────────────

export function ProductGrid() {
  const t = useTranslations('pos');
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const {
    addToCart,
    openModifierModal,
    selectedCategoryId,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
  } = usePosStore();

  // Ref al input de búsqueda para foco programático
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchCategory = !selectedCategoryId || p.categoryId === selectedCategoryId;
      const matchSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);

  const handleAdd = useCallback(
    (product: Product) => {
      if ((product.modifierGroups?.length ?? 0) > 0) {
        openModifierModal(product);
      } else {
        addToCart(product);
      }
    },
    [openModifierModal, addToCart],
  );

  // Escucha el evento global "pos:focus-search" (disparado por el atajo "/")
  useEffect(() => {
    const handler = () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    };
    document.addEventListener('pos:focus-search', handler as EventListener);
    return () =>
      document.removeEventListener('pos:focus-search', handler as EventListener);
  }, []);

  // Lector de código de barras: cuando el scanner tipea sin input activo,
  // pone el código en el buscador y agrega automáticamente si hay 1 coincidencia.
  const handleBarcode = useCallback(
    (code: string) => {
      setSearchQuery(code);
      searchInputRef.current?.focus();

      if (products) {
        const matches = products.filter(
          (p) =>
            (p.stock ?? 0) > 0 &&
            p.name.toLowerCase().includes(code.toLowerCase()),
        );
        // Si hay exactamente un resultado, se agrega solo (con pequeño delay para que se vea)
        if (matches.length === 1) {
          setTimeout(() => {
            handleAdd(matches[0]);
            setSearchQuery('');
          }, 160);
        }
      }
    },
    [products, setSearchQuery, handleAdd],
  );

  useBarcodeScanner(handleBarcode);

  return (
    <div className="flex flex-col h-full">
      {/* Búsqueda */}
      <div className="px-4 pt-4 pb-3">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cafe-gray">
            <Search size={15} />
          </span>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={`${t('search')}  ·  / para enfocar`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              // Enter con exactamente un resultado → agrega al carrito (ideal para scanner)
              if (e.key === 'Enter' && filtered.length === 1 && searchQuery.trim()) {
                e.preventDefault();
                handleAdd(filtered[0]);
                setSearchQuery('');
              }
              // Escape → limpiar búsqueda y desenfocar
              if (e.key === 'Escape') {
                setSearchQuery('');
                searchInputRef.current?.blur();
              }
            }}
            className="input-field pl-9 pr-8 text-sm"
          />
          {/* Botón X para limpiar */}
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cafe-grayLight hover:text-cafe-gray text-xl leading-none transition-colors"
              tabIndex={-1}
              aria-label="Limpiar búsqueda"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Filtro de categorías */}
      {categories && categories.length > 0 && (
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={clsx(
              'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              !selectedCategoryId
                ? 'bg-cafe-terracota text-cafe-onBrand'
                : 'bg-cafe-beige text-cafe-gray hover:bg-cafe-grayLight',
            )}
          >
            {t('allCategories')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={clsx(
                'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                selectedCategoryId === cat.id
                  ? 'bg-cafe-terracota text-cafe-onBrand'
                  : 'bg-cafe-beige text-cafe-gray hover:bg-cafe-grayLight',
              )}
              style={
                selectedCategoryId === cat.id && cat.color
                  ? { backgroundColor: cat.color }
                  : undefined
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid de productos */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-cafe-beige rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-cafe-gray">
            <Search size={40} strokeWidth={1.2} className="mb-2 opacity-40" />
            <p className="text-sm">
              {searchQuery
                ? `No hay productos con "${searchQuery}"`
                : t('emptyCart')}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-cafe-terracota hover:underline"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <AnimatePresence>
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={() => handleAdd(product)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
