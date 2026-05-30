'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import studentsApi, { Student } from '@/lib/api/students';
import { formatMembershipDate, getMembershipBadge } from '@/lib/utils/membership';
import toast from 'react-hot-toast';

function getContact(student: Student) {
  if (student.parent) {
    return {
      name: `${student.parent.name} ${student.parent.lastName}`,
      phone: student.parent.phone || '—',
    };
  }
  const g = student.guardians?.find((x) => x.isPrimary) ?? student.guardians?.[0];
  if (g) return { name: `${g.name} ${g.lastName}`, phone: g.phone || '—' };
  return { name: 'Sin apoderado', phone: '—' };
}

function rowStyle(status?: string) {
  if (status === 'EXPIRED' || status === 'NONE') {
    return 'border-l-4 border-red-500 bg-red-50/60';
  }
  if (status === 'LAST_DAY') {
    return 'border-l-4 border-red-400 bg-red-50/40';
  }
  if (status === 'EXPIRING') {
    return 'border-l-4 border-orange-400 bg-orange-50/60';
  }
  return '';
}

export default function PendingPaymentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentsApi
      .getMembershipAlerts()
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => toast.error('No se pudo cargar la lista de pendientes'))
      .finally(() => setLoading(false));
  }, []);

  const expired = students.filter(
    (s) => s.membershipStatus === 'EXPIRED' || s.membershipStatus === 'NONE',
  );
  const lastDay = students.filter((s) => s.membershipStatus === 'LAST_DAY');
  const expiring = students.filter((s) => s.membershipStatus === 'EXPIRING');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mensualidades pendientes</h1>
        <p className="text-gray-500 mt-1">
          Alumnos sin pago, vencidos o por vencer en los próximos 5 días
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-100 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 text-sm font-medium">Vencidos / sin pago</p>
          <p className="text-3xl font-bold text-red-900">{expired.length + lastDay.length}</p>
        </div>
        <div className="bg-orange-100 border border-orange-200 rounded-xl p-4">
          <p className="text-orange-800 text-sm font-medium">Por vencer (≤ 5 días)</p>
          <p className="text-3xl font-bold text-orange-900">{expiring.length}</p>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <p className="text-gray-600 text-sm font-medium">Total en alerta</p>
          <p className="text-3xl font-bold text-gray-900">{students.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-800">
          <ExclamationTriangleIcon className="w-4 h-4" /> Rojo: vencido o sin pago
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-100 text-orange-800">
          <ClockIcon className="w-4 h-4" /> Naranja: vence en 1–5 días
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-500">Cargando...</p>
        ) : students.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No hay alumnos con mensualidad pendiente</p>
        ) : (
          <ul className="divide-y">
            {students.map((s) => {
              const badge = getMembershipBadge(s);
              const contact = getContact(s);
              return (
                <li
                  key={s.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${rowStyle(s.membershipStatus)}`}
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {s.name} {s.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {s.category?.name ?? '—'} · {contact.name} · {contact.phone}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Vence: {formatMembershipDate(s.membershipPaidUntil ?? undefined)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full border ${badge.className}`}>
                      {badge.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/payments?studentId=${s.id}`)}
                      className="inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-[#7c0613] text-white rounded-lg hover:opacity-90"
                    >
                      <CreditCardIcon className="w-4 h-4" />
                      Cobrar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
