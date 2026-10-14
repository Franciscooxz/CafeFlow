'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAllCustomers, useCreateCustomer, useUpdateCustomer } from '@/hooks/useAdmin';
import { useMoney } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/Button';
import {
  Users,
  Plus,
  Edit3,
  Phone,
  Search,
  UserCheck,
} from '@/components/icons';

function CustomerModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: any;
  onClose: () => void;
  onSave: (d: any) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave({ name: name.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined });
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
            {initial ? 'Editar cliente' : 'Nuevo cliente'}
          </h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-cafe-grayDark mb-1.5">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" className="input-field" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-cafe-grayDark mb-1.5">Teléfono</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+57 300 0000000" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-cafe-grayDark mb-1.5">Email (opcional)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" className="input-field" />
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

export default function CustomersPage() {
  const { data: customers, isLoading } = useAllCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const [modal, setModal] = useState<{ open: boolean; data?: any }>({ open: false });
  const [search, setSearch] = useState('');

  const { fmt } = useMoney();

  const filtered = customers?.filter(
    (c: any) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-cafe-black flex items-center gap-2">
            <UserCheck size={20} className="text-cafe-terracota" />
            Clientes
          </h1>
          <p className="text-sm text-cafe-gray mt-0.5">
            {customers?.length ?? 0} cliente{customers?.length !== 1 ? 's' : ''} registrados
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-1.5"
        >
          <Plus size={16} /> Nuevo cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cafe-gray">
          <Search size={15} />
        </span>
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9 text-sm"
        />
      </div>

      {/* Stats */}
      {customers && customers.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total clientes', value: customers.length },
            { label: 'Puntos promedio', value: Math.round(customers.reduce((s: number, c: any) => s + c.loyaltyPoints, 0) / customers.length) },
            { label: 'Gasto promedio', value: fmt(customers.reduce((s: number, c: any) => s + c.totalSpent, 0) / customers.length) },
          ].map((stat) => (
            <div key={stat.label} className="bg-cafe-white rounded-2xl border border-cafe-beige px-4 py-3">
              <p className="text-xs text-cafe-gray">{stat.label}</p>
              <p className="text-xl font-bold text-cafe-black mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-cafe-beige rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-16 text-cafe-gray">
          <Users size={40} strokeWidth={1.2} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{search ? 'Sin resultados' : 'No hay clientes registrados'}</p>
        </div>
      ) : (
        <div className="bg-cafe-white rounded-2xl border border-cafe-beige overflow-hidden">
          <table className="w-full">
            <thead className="bg-cafe-cream/60">
              <tr>
                <th className="text-left text-xs font-semibold text-cafe-gray px-4 py-3">Cliente</th>
                <th className="text-left text-xs font-semibold text-cafe-gray px-4 py-3 hidden sm:table-cell">Contacto</th>
                <th className="text-right text-xs font-semibold text-cafe-gray px-4 py-3">Puntos</th>
                <th className="text-right text-xs font-semibold text-cafe-gray px-4 py-3 hidden md:table-cell">Total gastado</th>
                <th className="text-right text-xs font-semibold text-cafe-gray px-4 py-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((customer: any, i: number) => (
                <tr key={customer.id} className={`border-t border-cafe-beige hover:bg-cafe-cream/30 transition-colors ${i % 2 === 0 ? '' : 'bg-cafe-cream/20'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-cafe-terracota/10 text-cafe-terracota flex items-center justify-center text-xs font-bold shrink-0">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-cafe-black">{customer.name}</p>
                        <p className="text-xs text-cafe-gray">{new Date(customer.createdAt).toLocaleDateString('es-CO')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="space-y-0.5">
                      {customer.phone && (
                        <p className="text-xs text-cafe-grayDark flex items-center gap-1">
                          <Phone size={11} /> {customer.phone}
                        </p>
                      )}
                      {customer.email && (
                        <p className="text-xs text-cafe-gray">{customer.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      ★ {customer.loyaltyPoints}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <span className="text-sm font-medium text-cafe-black">{fmt(customer.totalSpent)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setModal({ open: true, data: customer })}
                      className="p-1.5 text-cafe-grayLight hover:text-cafe-terracota rounded-lg hover:bg-cafe-beige transition-colors"
                    >
                      <Edit3 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <CustomerModal
          initial={modal.data}
          onClose={() => setModal({ open: false })}
          onSave={async (data) => {
            if (modal.data) {
              await updateCustomer.mutateAsync({ id: modal.data.id, ...data });
            } else {
              await createCustomer.mutateAsync(data);
            }
          }}
        />
      )}
    </div>
  );
}
