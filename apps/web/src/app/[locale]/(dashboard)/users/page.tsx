'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAllUsers, useCreateUser, useUpdateUser, useAllStores } from '@/hooks/useAdmin';
import { Plus, X, Users, CheckCircle2, XCircle, Edit3 } from '@/components/icons';
import { clsx } from 'clsx';

const ROLES = [
  { value: 'CASHIER', label: 'Cajero' },
  { value: 'MANAGER', label: 'Gerente' },
  { value: 'OWNER', label: 'Dueño' },
];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  OWNER: 'bg-cafe-terracota/10 text-cafe-terracota',
  MANAGER: 'bg-blue-100 text-blue-700',
  CASHIER: 'bg-green-100 text-green-700',
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Dueño',
  MANAGER: 'Gerente',
  CASHIER: 'Cajero',
};

// ─── Modal de usuario ─────────────────────────────────────────────────────────

function UserModal({
  onClose,
  stores,
}: {
  onClose: () => void;
  stores: any[];
}) {
  const create = useCreateUser();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'CASHIER',
    storeId: '',
  });
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.firstName || !form.email || !form.password) {
      setError('Nombre, email y contraseña son obligatorios');
      return;
    }
    setError('');
    try {
      await create.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName || undefined,
        email: form.email,
        password: form.password,
        role: form.role,
        storeId: form.storeId || undefined,
      });
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Error al crear usuario');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cafe-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-cafe-white rounded-2xl shadow-cafe-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-cafe-beige">
          <h2 className="font-semibold text-cafe-black">Nuevo usuario</h2>
          <button onClick={onClose} className="text-cafe-grayLight hover:text-cafe-gray">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombre *"
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              placeholder="Ana"
            />
            <Input
              label="Apellido"
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              placeholder="López"
            />
          </div>
          <Input
            label="Email *"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="ana@micafeteria.com"
          />
          <Input
            label="Contraseña *"
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder="mínimo 6 caracteres"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-cafe-grayDark">Rol</label>
              <select
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
                className="input-field"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-cafe-grayDark">Sede</label>
              <select
                value={form.storeId}
                onChange={(e) => set('storeId', e.target.value)}
                className="input-field"
              >
                <option value="">Sin sede</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-cafe-beige">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleSubmit} loading={create.isPending} className="flex-[2]">
            Crear usuario
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Users Page ───────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { data: users, isLoading } = useAllUsers();
  const { data: stores } = useAllStores();
  const toggleUser = useUpdateUser();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-cafe-black">Usuarios</h1>
          <p className="text-sm text-cafe-gray mt-0.5">{users?.length ?? 0} usuarios registrados</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus size={14} className="mr-1" /> Nuevo usuario
        </Button>
      </div>

      {/* Tabla */}
      <div className="bg-cafe-white rounded-2xl shadow-cafe border border-cafe-beige/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cafe-beige bg-cafe-cream/50">
                <th className="text-left px-5 py-3 text-cafe-grayDark font-medium">Usuario</th>
                <th className="text-left px-4 py-3 text-cafe-grayDark font-medium">Rol</th>
                <th className="text-left px-4 py-3 text-cafe-grayDark font-medium">Sede</th>
                <th className="text-center px-4 py-3 text-cafe-grayDark font-medium">Estado</th>
                <th className="text-right px-5 py-3 text-cafe-grayDark font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cafe-beige">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-cafe-cream rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !users || users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-cafe-grayLight">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    Sin usuarios registrados
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {users.map((u) => {
                    const initials = `${u.firstName?.[0] ?? ''}${u.lastName?.[0] ?? ''}`.toUpperCase();
                    return (
                      <motion.tr
                        key={u.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-cafe-cream/30 transition-colors"
                      >
                        {/* Usuario */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-cafe-terracota/10 text-cafe-terracota flex items-center justify-center text-xs font-bold shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-medium text-cafe-black">
                                {u.firstName} {u.lastName}
                              </p>
                              <p className="text-xs text-cafe-gray">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Rol */}
                        <td className="px-4 py-3">
                          <span className={clsx('badge text-xs', ROLE_COLORS[u.role])}>
                            {ROLE_LABELS[u.role] ?? u.role}
                          </span>
                        </td>
                        {/* Sede */}
                        <td className="px-4 py-3 text-cafe-gray text-xs">
                          {u.store?.name ?? '—'}
                        </td>
                        {/* Estado */}
                        <td className="px-4 py-3 text-center">
                          {u.isActive ? (
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
                          {u.role !== 'OWNER' && (
                            <button
                              onClick={() =>
                                toggleUser.mutate({ id: u.id, isActive: !u.isActive })
                              }
                              className={clsx(
                                'text-xs font-medium transition-colors',
                                u.isActive
                                  ? 'text-red-400 hover:text-red-500'
                                  : 'text-green-500 hover:text-green-600',
                              )}
                            >
                              {u.isActive ? 'Desactivar' : 'Activar'}
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <UserModal stores={stores ?? []} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
