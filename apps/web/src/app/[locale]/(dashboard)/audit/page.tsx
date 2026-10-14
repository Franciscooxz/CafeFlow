'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuditLogs } from '@/hooks/useAdmin';
import { Clock, ChevronLeft, ChevronRight } from '@/components/icons';
import { clsx } from 'clsx';

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-cafe-terracota/10 text-cafe-terracota',
  LOGOUT: 'bg-gray-100 text-gray-600',
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Eliminación',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
};

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditLogs(page, 20);

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-cafe-black flex items-center gap-2">
          <Clock size={20} className="text-cafe-terracota" />
          Registro de actividad
        </h1>
        <p className="text-sm text-cafe-gray mt-0.5">
          Historial inmutable de todas las acciones
        </p>
      </div>

      {/* Tabla */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-cafe-white rounded-2xl shadow-cafe border border-cafe-beige/60 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cafe-beige bg-cafe-cream/50">
                <th className="text-left px-5 py-3 text-cafe-grayDark font-medium">Fecha</th>
                <th className="text-left px-4 py-3 text-cafe-grayDark font-medium">Usuario</th>
                <th className="text-left px-4 py-3 text-cafe-grayDark font-medium">Acción</th>
                <th className="text-left px-4 py-3 text-cafe-grayDark font-medium">Entidad</th>
                <th className="text-left px-4 py-3 text-cafe-grayDark font-medium">ID</th>
                <th className="text-left px-5 py-3 text-cafe-grayDark font-medium">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cafe-beige">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-cafe-cream rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-cafe-grayLight">
                    <Clock size={32} className="mx-auto mb-2 opacity-30" />
                    Sin registros de actividad
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr
                    key={log.id}
                    className="hover:bg-cafe-cream/30 transition-colors"
                  >
                    <td className="px-5 py-3 text-cafe-gray whitespace-nowrap">
                      <p className="text-xs font-medium text-cafe-black">
                        {new Date(log.createdAt).toLocaleDateString('es-CO', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </p>
                      <p className="text-xs text-cafe-grayLight">
                        {new Date(log.createdAt).toLocaleTimeString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {log.user ? (
                        <p className="text-cafe-black font-medium text-xs">
                          {log.user.firstName} {log.user.lastName}
                        </p>
                      ) : (
                        <span className="text-cafe-grayLight text-xs">Sistema</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'badge text-xs',
                          ACTION_STYLES[log.action] ?? 'bg-gray-100 text-gray-600',
                        )}
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-cafe-black text-xs font-medium">
                      {log.entity ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-cafe-grayLight">
                        {log.entityId ? log.entityId.slice(0, 8) + '...' : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-cafe-grayLight">
                        {log.ipAddress ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination && pagination.pages > 1 && (
          <div className="px-5 py-3 border-t border-cafe-beige flex items-center justify-between">
            <p className="text-xs text-cafe-gray">
              Mostrando {logs.length} de {pagination.total} registros
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-cafe-gray hover:bg-cafe-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-cafe-grayDark px-2">
                {page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-cafe-gray hover:bg-cafe-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
