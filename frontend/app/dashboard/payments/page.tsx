'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { usePaymentsStore } from '@/store/paymentsStore';
import { useStudentsStore } from '@/store/studentsStore';
import paymentsApi from '@/lib/api/payments';
import toast from 'react-hot-toast';
import { getLocalDateString } from '@/lib/utils/date';
import { useClubConfig } from '@/hooks/useClubConfig';

const methodLabels: Record<string, string> = {
  QR: 'QR',
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  EXPIRED: 'Vencido',
  REFUNDED: 'Reembolsado',
  CANCELLED: 'Cancelado',
};

export default function PaymentsPage() {
  const { paymentQrUrl: defaultQrUrl } = useClubConfig();
  const [paymentQrUrl, setPaymentQrUrl] = useState(defaultQrUrl);
  const { payments, loading, searchTerm, setSearchTerm, fetchPayments } =
    usePaymentsStore();
  const { students, fetchStudents } = useStudentsStore();
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState(1);
  const [paymentDate, setPaymentDate] = useState(getLocalDateString());
  const [proofUrl, setProofUrl] = useState('');
  const [method, setMethod] = useState<'CASH' | 'QR' | 'CARD' | 'TRANSFER'>(
    'CASH',
  );
  const [submitting, setSubmitting] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const selectedStudent = students.find((s) => s.id === studentId);
  const discountPercent = selectedStudent?.discountPercent ?? 0;
  const monthlyFee = selectedStudent?.category?.monthlyPrice ?? 0;

  useEffect(() => {
    if (monthlyFee > 0) {
      const base = monthlyFee * months;
      const total = base - (base * discountPercent) / 100;
      setAmount(String(Math.round(total * 100) / 100));
    }
  }, [studentId, months, monthlyFee, discountPercent]);

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    paymentsApi.getConfig().then((cfg) => {
      if (cfg?.paymentQrUrl) setPaymentQrUrl(cfg.paymentQrUrl);
    }).catch(() => {});
  }, []);

  const filtered = payments.filter((p) => {
    const q = searchTerm.toLowerCase();
    const studentName = p.students?.[0]
      ? `${p.students[0].name} ${p.students[0].lastName}`.toLowerCase()
      : '';
    return (
      p.id.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q) ||
      studentName.includes(q)
    );
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !amount) return;
    setSubmitting(true);
    try {
      const isQrPending = method === 'QR' && proofUrl;
      await paymentsApi.create({
        studentId,
        amount: parseFloat(amount),
        method,
        monthsCovered: months,
        paymentDate,
        proofUrl: proofUrl || undefined,
        status: isQrPending ? 'PENDING' : 'PAID',
        notes: isQrPending ? 'Pendiente verificación de comprobante' : undefined,
      });
      toast.success(
        isQrPending
          ? 'Pago registrado como pendiente de verificación'
          : 'Pago registrado',
      );
      setShowForm(false);
      setStudentId('');
      setAmount('');
      setMonths(1);
      setProofUrl('');
      fetchPayments();
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar pago');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    try {
      await paymentsApi.verify(id);
      toast.success('Pago verificado — mensualidad extendida');
      fetchPayments();
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo verificar');
    } finally {
      setVerifyingId(null);
    }
  };

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
    }).format(n);

  const stats = [
    {
      label: 'Total pagos',
      value: payments.length,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Pagados',
      value: payments.filter((p) => p.status === 'PAID').length,
      color: 'from-green-500 to-green-600',
    },
    {
      label: 'Pendientes',
      value: payments.filter((p) => p.status === 'PENDING').length,
      color: 'from-amber-500 to-amber-600',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
          <p className="text-gray-500 mt-1">Historial y registro de cobros</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg shadow-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Registrar pago
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`bg-gradient-to-r ${s.color} rounded-xl p-4 text-white shadow-lg`}
          >
            <p className="text-white/80 text-sm">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pago..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7c0613]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Alumno
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Monto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Método
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <CreditCardIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  No hay pagos registrados
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {p.students?.[0]
                      ? `${p.students[0].name} ${p.students[0].lastName}`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {formatMoney(p.total)}
                  </td>
                  <td className="px-6 py-4">
                    {methodLabels[p.method] || p.method}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        p.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {statusLabels[p.status] || p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {p.paymentDate
                      ? new Date(p.paymentDate).toLocaleDateString('es-BO')
                      : new Date(p.createdAt).toLocaleDateString('es-BO')}
                  </td>
                  <td className="px-6 py-4">
                    {p.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleVerify(p.id)}
                        disabled={verifyingId === p.id}
                        className="text-sm text-[#7c0613] font-medium hover:underline disabled:opacity-50"
                      >
                        {verifyingId === p.id ? '...' : 'Verificar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl my-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-[#7c0613]" />
              Registrar pago
            </h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Alumno</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Seleccionar alumno</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Meses</label>
                  <select
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {[1, 2, 3, 4, 5, 6, 12].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'mes' : 'meses'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fecha de pago
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
              </div>
              {monthlyFee > 0 && (
                <p className="text-xs text-gray-500">
                  Cuota: {formatMoney(monthlyFee)} × {months}
                  {discountPercent > 0 && ` − ${discountPercent}% desc.`} ={' '}
                  {formatMoney(parseFloat(amount || '0'))}
                </p>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Monto (BOB)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Método</label>
                <select
                  value={method}
                  onChange={(e) =>
                    setMethod(e.target.value as typeof method)
                  }
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="QR">QR</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="TRANSFER">Transferencia</option>
                </select>
              </div>
              {method === 'QR' && (
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    QR del club para transferencia
                  </p>
                  {paymentQrUrl ? (
                    <img
                      src={paymentQrUrl}
                      alt="QR de pago del club"
                      className="mx-auto max-h-44 object-contain rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <p className="text-xs text-amber-700">
                      Configure la imagen en{' '}
                      <code className="bg-white px-1 rounded">
                        public/images/payment-qr.png
                      </code>{' '}
                      o variable{' '}
                      <code className="bg-white px-1 rounded">
                        NEXT_PUBLIC_PAYMENT_QR_URL
                      </code>{' '}
                      (HTTPS recomendado).
                    </p>
                  )}
                </div>
              )}
              {method === 'QR' && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    URL del comprobante (imagen)
                  </label>
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quedará pendiente hasta que un cobrador lo verifique (+30 días por mes).
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border rounded-lg py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#7c0613] text-white rounded-lg py-2 disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
