'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ordersApi, { Order, OrderStatus } from '@/lib/api/orders';

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente de pago',
  RESERVED: 'Reservada (48h)',
  PAID: 'Pagada',
  PROCESSING: 'En proceso',
  READY: 'Lista para retirar',
  SHIPPED: 'Enviada',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
  REFUNDED: 'Reembolsada',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-900',
  RESERVED: 'bg-orange-100 text-orange-900',
  PAID: 'bg-blue-100 text-blue-900',
  PROCESSING: 'bg-indigo-100 text-indigo-900',
  READY: 'bg-purple-100 text-purple-900',
  SHIPPED: 'bg-cyan-100 text-cyan-900',
  DELIVERED: 'bg-green-100 text-green-900',
  CANCELLED: 'bg-red-100 text-red-900',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

const ADMIN_NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ['PAID', 'CANCELLED'],
  RESERVED: ['PAID', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY'],
  READY: ['DELIVERED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
};

export default function OrdersPage() {
  const { data: session } = useSession();
  const role = session?.user?.role ?? 'PARENT';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);

  const load = () => {
    setLoading(true);
    const req = isAdmin ? ordersApi.getAll() : ordersApi.getMine();
    req
      .then(setOrders)
      .catch(() => toast.error('No se pudieron cargar las órdenes'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [isAdmin]);

  const filtered = orders.filter((o) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.buyerName.toLowerCase().includes(q)
    );
  });

  const changeStatus = async (id: string, status: OrderStatus) => {
    try {
      await ordersApi.updateStatus(id, status);
      toast.success('Estado actualizado');
      load();
      setSelected(null);
    } catch {
      toast.error('No se pudo actualizar');
    }
  };

  const cancelOrder = async (id: string) => {
    try {
      await ordersApi.cancel(id);
      toast.success('Orden cancelada');
      load();
      setSelected(null);
    } catch {
      toast.error('No se pudo cancelar');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isAdmin ? 'Órdenes de tienda' : 'Mis pedidos'}</h1>
        <p className="text-gray-500 mt-1">
          {isAdmin ? 'Gestione compras y reservas' : 'Seguimiento de tus compras'}
        </p>
      </div>

      <input
        type="text"
        placeholder="Buscar por número o cliente..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full max-w-md border rounded-lg px-4 py-2"
      />

      <div className="card-app table-scroll">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
              {isAdmin && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Sin órdenes</td></tr>
            ) : (
              filtered.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{o.orderNumber}</td>
                  {isAdmin && <td className="px-4 py-3 text-sm">{o.buyerName}</td>}
                  <td className="px-4 py-3 font-medium">Bs. {o.total.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[o.status] ?? ''}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(o.orderDate).toLocaleDateString('es-BO')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(o)}
                      className="text-sm text-[#7c0613] font-medium hover:underline"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-2">{selected.orderNumber}</h2>
            <p className="text-sm text-gray-600 mb-4">{selected.buyerName} · {selected.buyerPhone}</p>
            <ul className="text-sm space-y-2 mb-4 border-b pb-4">
              {selected.orderItems?.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.productName} x{item.quantity} {item.size && `(${item.size})`}</span>
                  <span>Bs. {item.subtotal.toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <p className="font-bold mb-4">Total: Bs. {selected.total.toLocaleString()}</p>

            {isAdmin && ADMIN_NEXT[selected.status] && (
              <div className="flex flex-wrap gap-2 mb-3">
                {ADMIN_NEXT[selected.status]!.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => changeStatus(selected.id, st)}
                    className="px-3 py-1 text-sm bg-[#7c0613] text-white rounded-lg"
                  >
                    → {STATUS_LABELS[st]}
                  </button>
                ))}
              </div>
            )}

            {!isAdmin && (selected.status === 'PENDING' || selected.status === 'RESERVED') && (
              <button
                type="button"
                onClick={() => cancelOrder(selected.id)}
                className="text-sm text-red-600 hover:underline"
              >
                Cancelar orden
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-4 w-full py-2 border rounded-lg text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
