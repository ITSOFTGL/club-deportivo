'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UsersIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useStudentsStore } from '@/store/studentsStore';
import { getMembershipBadge } from '@/lib/utils/membership';
import { getStudentMonthlyFee } from '@/lib/utils/studentFee';
import { formatCategoryLabel } from '@/lib/api/categories';
import { StudentAvatar } from '@/components/ui/StudentAvatar';

export default function MyChildrenPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { students, loading, fetchStudents } = useStudentsStore();

  useEffect(() => {
    if (session?.user?.role && session.user.role !== 'PARENT') {
      router.replace('/dashboard');
      return;
    }
    fetchStudents();
  }, [session?.user?.role]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis hijos</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Alumnos vinculados a su cuenta de apoderado
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7c0613]" />
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-10 text-center shadow-sm">
          <UsersIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            No hay alumnos vinculados. Si acaba de registrarse, el club debe asociar su cuenta en
            Apoderados con la opción de crear acceso.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {students.map((child) => {
            const badge = getMembershipBadge(child);
            return (
              <div
                key={child.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {child.name} {child.lastName}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {child.branch?.name ?? '—'} ·{' '}
                      {child.category ? formatCategoryLabel(child.category) : '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Mensualidad: Bs {getStudentMonthlyFee(child)}
                    </p>
                    {child.enrollmentDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ingreso:{' '}
                        {new Date(child.enrollmentDate).toLocaleDateString('es-BO')}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${badge.className}`}
                  >
                    {badge.text}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/payments?studentId=${child.id}`)}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#7c0613] hover:underline"
                >
                  <CreditCardIcon className="w-4 h-4" />
                  Ver / registrar pago
                </button>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
