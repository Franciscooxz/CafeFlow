'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  useAllProducts,
  useCreateProduct,
  useUpdateProduct,
  useToggleProduct,
  useAdjustStock,
  useAdminCategories,
  useCreateCategory,
  useBulkCreateProducts,
  useProductHistory,
} from '@/hooks/useAdmin';
import { CSVImportModal } from '@/components/dashboard/CSVImportModal';
import { useMoney } from '@/hooks/useCurrency';
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  X,
  Edit3,
  CheckCircle2,
  XCircle,
  CoffeeCupIcon,
  Upload,
  History,
} from '@/components/icons';
import { clsx } from 'clsx';

// ─── Modal de producto ────────────────────────────────────────────────────────

function ProductModal({
  product,
  categories,
  onClose,
}: {
  product: any | null;
  categories: any[];
  onClose: () => void;
}) {
  const isEdit = !!product;
  const create = useCreateProduct();
  const update = useUpdateProduct();

  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: String(product?.price ?? ''),
    taxRate: String(product?.taxRate ?? '0'),
    stock: String(product?.stock ?? '0'),
    lowStockAlert: String(product?.lowStockAlert ?? '5'),
    categoryId: product?.categoryId ?? '',
    imageUrl: product?.imageUrl ?? '',
    isActive: product?.isActive ?? true,
  });
  const [error, setError] = useState('');

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.price) { setError('Nombre y precio son obligatorios'); return; }
    setError('');
    const dto = {
      name: form.name,
      description: form.description || undefined,
      price: parseFloat(form.price),
      taxRate: parseFloat(form.taxRate) / 100,
      stock: parseInt(form.stock),
      lowStockAlert: parseInt(form.lowStockAlert),
      categoryId: form.categoryId || undefined,
      imageUrl: form.imageUrl || undefined,
      isActive: form.isActive,
    };
    try {
      if (isEdit) await update.mutateAsync({ id: product.id, ...dto });
      else await create.mutateAsync(dto);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al guardar');
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cafe-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-cafe-white rounded-2xl shadow-cafe-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-cafe-beige">
          <h2 className="font-semibold text-cafe-black">
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose} className="text-cafe-grayLight hover:text-cafe-gray">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <Input
            label="Nombre *"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Espresso doble"
          />
          <Input
            label="Descripción"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Descripción opcional"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Precio *"
              type="number"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="0"
            />
            <Input
              label="Impuesto (%)"
              type="number"
              value={form.taxRate}
              onChange={(e) => set('taxRate', e.target.value)}
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Stock inicial"
              type="number"
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
              placeholder="0"
            />
            <Input
              label="Alerta de stock"
              type="number"
              value={form.lowStockAlert}
              onChange={(e) => set('lowStockAlert', e.target.value)}
              placeholder="5"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-cafe-grayDark">Categoría</label>
            <select
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
              className="input-field"
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <Input
            label="URL de imagen"
            value={form.imageUrl}
            onChange={(e) => set('imageUrl', e.target.value)}
            placeholder="https://..."
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              className="w-4 h-4 accent-cafe-terracota"
            />
            <span className="text-sm text-cafe-grayDark">Producto activo</span>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-cafe-beige">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSubmit} loading={isPending} className="flex-[2]">
            {isEdit ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal de categoría ───────────────────────────────────────────────────────

function CategoryModal({ onClose }: { onClose: () => void }) {
  const create = useCreateCategory();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#C4704A');
  const [error, setError] = useState('');

  const COLORS = ['#C4704A', '#2563EB', '#16A34A', '#9333EA', '#DC2626', '#F59E0B', '#0891B2', '#6B7280'];

  const handleSubmit = async () => {
    if (!name) { setError('El nombre es obligatorio'); return; }
    try {
      await create.mutateAsync({ name, color });
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al crear');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cafe-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-cafe-white rounded-2xl shadow-cafe-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-cafe-black">Nueva categoría</h2>
          <button onClick={onClose} className="text-cafe-grayLight"><X size={18} /></button>
        </div>
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bebidas calientes"
          autoFocus
        />
        <div>
          <label className="text-sm font-medium text-cafe-grayDark block mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-cafe-black scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSubmit} loading={create.isPending} className="flex-[2]">
            Crear categoría
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal de historial ───────────────────────────────────────────────────────

function ProductHistoryModal({ product, onClose }: { product: any; onClose: () => void }) {
  const { data: history, isLoading } = useProductHistory(product.id);

  const actionMeta = (action: string) => {
    if (action === 'CREATE') return { label: 'Creado',   cls: 'text-green-600 bg-green-50' };
    if (action === 'UPDATE') return { label: 'Editado',  cls: 'text-blue-600 bg-blue-50' };
    if (action === 'DELETE') return { label: 'Eliminado', cls: 'text-red-600 bg-red-50' };
    return { label: action, cls: 'text-cafe-gray bg-cafe-cream' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cafe-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-cafe-white rounded-2xl shadow-cafe-xl flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cafe-beige shrink-0">
          <div>
            <h2 className="font-semibold text-cafe-black flex items-center gap-2">
              <History size={16} className="text-cafe-terracota" />
              Historial — {product.name}
            </h2>
            <p className="text-xs text-cafe-gray mt-0.5">Últimas 50 modificaciones registradas</p>
          </div>
          <button onClick={onClose} className="text-cafe-grayLight hover:text-cafe-black transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-14 bg-cafe-cream rounded-xl animate-pulse" />
            ))
          ) : !history || history.length === 0 ? (
            <div className="text-center py-10 text-cafe-grayLight">
              <History size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin historial de cambios para este producto</p>
            </div>
          ) : (
            history.map((entry: any) => {
              const { label, cls } = actionMeta(entry.action);
              return (
                <div
                  key={entry.id}
                  className="flex gap-3 p-3 rounded-xl border border-cafe-beige/60 hover:bg-cafe-cream/30 transition-colors"
                >
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-cafe-cream flex items-center justify-center">
                    <History size={13} className="text-cafe-terracota" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
                      {entry.user && (
                        <span className="text-xs text-cafe-gray">
                          {entry.user.firstName} {entry.user.lastName}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-cafe-grayLight mt-0.5">
                      {new Date(entry.createdAt).toLocaleString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    {entry.newValue && typeof entry.newValue === 'object' && (
                      <p className="text-xs text-cafe-gray mt-0.5 truncate">
                        {Object.entries(entry.newValue as Record<string, unknown>)
                          .filter(([k]) => !['id', 'tenantId', 'categoryId'].includes(k))
                          .map(([k, v]) => `${k}: ${v}`)
                          .slice(0, 3)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-cafe-beige shrink-0">
          <Button variant="secondary" onClick={onClose} className="w-full">Cerrar</Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Products Page ────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { fmt } = useMoney();
  const { data: products, isLoading } = useAllProducts();
  const { data: categories } = useAdminCategories();
  const toggleProduct = useToggleProduct();
  const bulkCreate = useBulkCreateProducts();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [historyProduct, setHistoryProduct] = useState<any | null>(null);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = !filterCat || p.categoryId === filterCat;
      const matchStatus =
        !filterStatus ||
        (filterStatus === 'active' ? p.isActive : !p.isActive);
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, filterCat, filterStatus]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-cafe-black">Productos</h1>
          <p className="text-sm text-cafe-gray mt-0.5">
            {products?.length ?? 0} productos · {categories?.length ?? 0} categorías
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCategoryModal(true)}
          >
            <Plus size={14} className="mr-1" /> Categoría
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCSVImport(true)}
          >
            <Upload size={14} className="mr-1" /> Importar CSV
          </Button>
          <Button
            size="sm"
            onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
          >
            <Plus size={14} className="mr-1" /> Nuevo producto
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-gray" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-sm w-full"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="input-field text-sm w-40"
        >
          <option value="">Todas las categorías</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-field text-sm w-32"
        >
          <option value="">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-cafe-white rounded-2xl shadow-cafe border border-cafe-beige/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cafe-beige bg-cafe-cream/50">
                <th className="text-left px-5 py-3 text-cafe-grayDark font-medium">Producto</th>
                <th className="text-left px-4 py-3 text-cafe-grayDark font-medium">Categoría</th>
                <th className="text-right px-4 py-3 text-cafe-grayDark font-medium">Precio</th>
                <th className="text-right px-4 py-3 text-cafe-grayDark font-medium">Stock</th>
                <th className="text-center px-4 py-3 text-cafe-grayDark font-medium">Estado</th>
                <th className="text-right px-5 py-3 text-cafe-grayDark font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cafe-beige">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-cafe-cream rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-cafe-grayLight">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    Sin productos que coincidan
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filtered.map((product) => (
                    <motion.tr
                      key={product.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-cafe-cream/30 transition-colors"
                    >
                      {/* Producto */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-cafe-cream flex items-center justify-center shrink-0 text-cafe-terracota/50">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <CoffeeCupIcon size={18} strokeWidth={1.2} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-cafe-black">{product.name}</p>
                            {product.description && (
                              <p className="text-xs text-cafe-gray line-clamp-1">{product.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Categoría */}
                      <td className="px-4 py-3">
                        {product.category ? (
                          <span
                            className="badge text-xs"
                            style={
                              product.category.color
                                ? { backgroundColor: product.category.color + '22', color: product.category.color }
                                : {}
                            }
                          >
                            {product.category.name}
                          </span>
                        ) : (
                          <span className="text-cafe-grayLight text-xs">—</span>
                        )}
                      </td>
                      {/* Precio */}
                      <td className="px-4 py-3 text-right font-medium text-cafe-black">
                        ${fmt(product.price)}
                      </td>
                      {/* Stock */}
                      <td className="px-4 py-3 text-right">
                        <span
                          className={clsx(
                            'font-medium',
                            product.stock <= 0
                              ? 'text-red-500'
                              : product.stock <= product.lowStockAlert
                              ? 'text-amber-500'
                              : 'text-cafe-black',
                          )}
                        >
                          {product.stock}
                          {product.stock <= product.lowStockAlert && product.stock > 0 && (
                            <AlertTriangle size={11} className="inline ml-1 text-amber-400" />
                          )}
                        </span>
                      </td>
                      {/* Estado */}
                      <td className="px-4 py-3 text-center">
                        {product.isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                            <CheckCircle2 size={13} /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-cafe-grayLight">
                            <XCircle size={13} /> Inactivo
                          </span>
                        )}
                      </td>
                      {/* Acciones */}
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setHistoryProduct(product)}
                            className="text-cafe-grayLight hover:text-cafe-terracota transition-colors"
                            title="Ver historial"
                          >
                            <History size={14} />
                          </button>
                          <button
                            onClick={() => { setEditingProduct(product); setShowProductModal(true); }}
                            className="text-cafe-gray hover:text-cafe-black transition-colors"
                            title="Editar"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => toggleProduct.mutate(product.id)}
                            className={clsx(
                              'text-xs font-medium transition-colors',
                              product.isActive
                                ? 'text-red-400 hover:text-red-500'
                                : 'text-green-500 hover:text-green-600',
                            )}
                          >
                            {product.isActive ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories ?? []}
          onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
        />
      )}
      {showCategoryModal && (
        <CategoryModal onClose={() => setShowCategoryModal(false)} />
      )}
      {showCSVImport && (
        <CSVImportModal
          categories={categories ?? []}
          onImport={async (items) => {
            await bulkCreate.mutateAsync(items);
          }}
          onClose={() => setShowCSVImport(false)}
        />
      )}
      {historyProduct && (
        <ProductHistoryModal
          product={historyProduct}
          onClose={() => setHistoryProduct(null)}
        />
      )}
    </div>
  );
}
