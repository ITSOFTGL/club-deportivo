'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { usePaymentsStore } from '@/store/paymentsStore';
import { useStudentsStore } from '@/store/studentsStore';
import { useCategoriesStore } from '@/store/categoriesStore';
import paymentsApi from '@/lib/api/payments';
import toast from 'react-hot-toast';
import { getLocalDateString, isoToLocalDateKey } from '@/lib/utils/date';
import { useClubConfig } from '@/hooks/useClubConfig';
import {
  addCalendarMonths,
  formatLocalDate,
  parseLocalDateInput,
  resolvePaymentQrUrl,
} from '@/lib/utils/membershipDates';

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
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Cargando pagos...</div>}>
      <PaymentsPageContent />
    </Suspense>
  );
}

function getStudentContact(st?: {
  parent?: { name: string; lastName: string; phone?: string };
  guardians?: Array<{ name: string; lastName: string; phone: string }>;
}) {
  if (!st) return { name: '—', phone: '—' };
  if (st.parent) {
    return {
      name: `${st.parent.name} ${st.parent.lastName}`.trim(),
      phone: st.parent.phone || '—',
    };
  }
  const g = st.guardians?.[0];
  if (g) {
    return { name: `${g.name} ${g.lastName}`.trim(), phone: g.phone || '—' };
  }
  return { name: 'Sin apoderado', phone: '—' };
}

function PaymentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectId = searchParams.get('studentId');
  const { data: session } = useSession();
  const role = session?.user?.role || '';
  const isStaffEditor = role === 'SUPER_ADMIN' || role === 'ADMIN';

  const { paymentQrUrl: defaultQrUrl } = useClubConfig();
  const [paymentQrUrl, setPaymentQrUrl] = useState(defaultQrUrl);
  const { payments, loading, searchTerm, setSearchTerm, fetchPayments } =
    usePaymentsStore();
  const { students, fetchStudents } = useStudentsStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState(1);
  const [paymentDate] = useState(getLocalDateString());
  const [extendFromDate, setExtendFromDate] = useState(getLocalDateString());
  const [notes, setNotes] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [method, setMethod] = useState<'CASH' | 'QR' | 'CARD' | 'TRANSFER'>('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [studentsReady, setStudentsReady] = useState(false);

  const selectedStudent = students.find((s) => s.id === studentId);
  const discountPercent = selectedStudent?.discountPercent ?? 0;
  const monthlyFee = selectedStudent?.category?.monthlyPrice ?? 0;

  const nextExpiryPreview = useMemo(() => {
    if (!extendFromDate) return '—';
    try {
      const base = parseLocalDateInput(extendFromDate);
      return addCalendarMonths(base, months).toLocaleDateString('es-BO');
    } catch {
      return '—';
    }
  }, [extendFromDate, months]);

  const qrImageSrc = resolvePaymentQrUrl(paymentQrUrl || defaultQrUrl);

  useEffect(() => {
    Promise.all([fetchPayments(), fetchStudents(), fetchCategories()])
      .finally(() => setStudentsReady(true));
    paymentsApi
      .getConfig()
      .then((cfg) => {
        if (cfg?.paymentQrUrl) setPaymentQrUrl(cfg.paymentQrUrl);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!preselectId) return;
    setStudentId(preselectId);
    setShowForm(true);
  }, [preselectId]);

  useEffect(() => {
    if (!studentId || !selectedStudent) return;
    const base = selectedStudent.membershipPaidUntil
      ? isoToLocalDateKey(selectedStudent.membershipPaidUntil)
      : getLocalDateString();
    setExtendFromDate(base);
  }, [studentId, selectedStudent?.membershipPaidUntil, selectedStudent?.id]);

  useEffect(() => {
    if (!studentId) return;
    if (monthlyFee > 0) {
      const base = monthlyFee * months;
      const total = base - (base * discountPercent) / 100;
      setAmount(String(Math.round(total * 100) / 100));
    } else if (studentsReady && !amount) {
      setAmount('');
    }
  }, [studentId, months, monthlyFee, discountPercent, studentsReady]);

  const studentsForSelect = categoryFilter
    ? students.filter((s) => s.categoryId === categoryFilter)
    : students;

  const selectOptions = useMemo(() => {
    if (studentId && !studentsForSelect.some((s) => s.id === studentId)) {
      const extra = students.find((s) => s.id === studentId);
      return extra ? [...studentsForSelect, extra] : studentsForSelect;
    }
    return studentsForSelect;
  }, [studentsForSelect, studentId, students]);

  const filtered = payments.filter((p) => {
    const st = p.students?.[0];
    if (categoryFilter && st?.category?.id !== categoryFilter) return false;
    const q = searchTerm.toLowerCase();
    const studentName = st ? `${st.name} ${st.lastName}`.toLowerCase() : '';
    const contact = getStudentContact(st);
    return (
      p.id.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q) ||
      studentName.includes(q) ||
      contact.name.toLowerCase().includes(q) ||
      contact.phone.includes(q)
    );
  });

  const resetForm = () => {
    setShowForm(false);
    setStudentId('');
    setAmount('');
    setMonths(1);
    setProofUrl('');
    setNotes('');
    if (preselectId) router.replace('/dashboard/payments');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error('Seleccione un alumno');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Ingrese un monto válido. Espere a que cargue la cuota del alumno.');
      return;
    }
    if (!extendFromDate) {
      toast.error('Indique la fecha de vencimiento base');
      return;
    }

    setSubmitting(true);
    try {
      const isQrPending = method === 'QR' && proofUrl.trim().length > 0;
      await paymentsApi.create({
        studentId,
        amount: parseFloat(amount),
        method,
        monthsCovered: months,
        paymentDate,
        extendFromDate,
        proofUrl: proofUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        status: isQrPending ? 'PENDING' : 'PAID',
      });
      toast.success(
        isQrPending
          ? 'Pago registrado como pendiente de verificación'
          : 'Pago registrado correctamente',
      );
      resetForm();
      fetchPayments();
      fetchStudents();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Error al registrar pago';
      toast.error(message);
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
      fetchStudents();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'No se pudo verificar';
      toast.error(message);
    } finally {
      setVerifyingId(null);
    }
  };

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(n);

  const stats = [
    { label: 'Total pagos', value: payments.length, color: 'from-blue-500 to-blue-600' },
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
          <p className="text-gray-500 mt-1">Historial y registro de cobros</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg shadow-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Registrar pago
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`bg-gradient-to-r ${s.color} rounded-xl p-4 text-white shadow-lg`}>
            <p className="text-white/80 text-sm">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar alumno, apoderado o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7c0613]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#7c0613]"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alumno</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apoderado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagó</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vence</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-500">Cargando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                  <CreditCardIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  No hay pagos registrados
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const st = p.students?.[0];
                const contact = getStudentContact(st);
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{st ? `${st.name} ${st.lastName}` : '—'}</td>
                    <td className="px-4 py-3 text-sm">{st?.category?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm">{contact.name}</td>
                    <td className="px-4 py-3 text-sm">{contact.phone}</td>
                    <td className="px-4 py-3 font-medium">{formatMoney(p.total)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('es-BO') : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('es-BO') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${p.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {statusLabels[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.status === 'PENDING' && (
                        <button type="button" onClick={() => handleVerify(p.id)} disabled={verifyingId === p.id} className="text-sm text-[#7c0613] font-medium hover:underline disabled:opacity-50">
                          {verifyingId === p.id ? '...' : 'Verificar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl my-8">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-[#7c0613]" />
              Registrar pago
            </h2>
            {preselectId && studentId && (
              <p className="text-xs text-gray-500 mb-4">
                Alumno seleccionado desde la lista de pendientes
              </p>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Alumno</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                  disabled={Boolean(preselectId) && !isStaffEditor}
                >
                  <option value="">Seleccionar alumno</option>
                  {selectOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.lastName}
                      {s.category?.name ? ` — ${s.category.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Meses a pagar</label>
                  <select
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {[1, 2, 3, 4, 5, 6, 12].map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? 'mes' : 'meses'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha de registro (hoy)</label>
                  <input
                    type="date"
                    value={paymentDate}
                    readOnly
                    className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Vencimiento actual (desde aquí se suman los meses)
                </label>
                <input
                  type="date"
                  value={extendFromDate}
                  onChange={(e) => setExtendFromDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si el alumno vuelve después de meses sin pagar, ajuste esta fecha.
                  Próximo vencimiento: <strong>{nextExpiryPreview}</strong>
                  {extendFromDate && ` (desde ${formatLocalDate(extendFromDate)} + ${months} mes${months > 1 ? 'es' : ''})`}
                </p>
              </div>

              {monthlyFee > 0 && (
                <p className="text-xs text-gray-500">
                  Cuota: {formatMoney(monthlyFee)} × {months}
                  {discountPercent > 0 && ` − ${discountPercent}% desc.`} = {formatMoney(parseFloat(amount || '0'))}
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
                  readOnly={!isStaffEditor && monthlyFee > 0}
                  className={`w-full border rounded-lg px-3 py-2 ${!isStaffEditor && monthlyFee > 0 ? 'bg-gray-50' : ''}`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Método</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as typeof method)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="QR">QR / Transferencia</option>
                  <option value="CARD">Tarjeta</option>
                  <option value="TRANSFER">Transferencia bancaria</option>
                </select>
              </div>

              {method === 'QR' && (
                <div className="text-center p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-600 mb-2">Escaneá el QR del club para pagar</p>
                  {qrImageSrc ? (
                    <img
                      src={qrImageSrc}
                      alt="QR de pago del club"
                      className="mx-auto max-h-48 object-contain rounded-lg"
                    />
                  ) : (
                    <p className="text-xs text-amber-700">
                      El super admin debe subir el QR en Configuración o colocar{' '}
                      <code className="bg-white px-1 rounded">public/images/payment-qr.png</code>
                    </p>
                  )}
                </div>
              )}

              {method === 'QR' && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    URL del comprobante (opcional)
                  </label>
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si adjunta comprobante queda pendiente de verificación. Sin comprobante se registra como pagado.
                  </p>
                </div>
              )}

              {isStaffEditor && (
                <div>
                  <label className="block text-sm font-medium mb-1">Notas (opcional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Ej. pago adelantado, alumno que retoma..."
                  />
                </div>
              )}

              {!studentsReady && (
                <p className="text-xs text-amber-600">Cargando datos del alumno...</p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 border rounded-lg py-2">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !studentsReady}
                  className="flex-1 bg-[#7c0613] text-white rounded-lg py-2 disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Guardar pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
