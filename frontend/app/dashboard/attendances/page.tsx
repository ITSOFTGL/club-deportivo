// app/dashboard/attendances/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { TeacherAttendanceView } from '@/components/attendances/TeacherAttendanceView';
import { TeacherAttendanceHistory } from '@/components/attendances/TeacherAttendanceHistory';
import { AdminAttendanceView } from '@/components/attendances/AdminAttendanceView';

export default function AttendancesPage() {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c0613]" />
      </div>
    );
  }

  // Profesor ve su vista para pasar lista
  if (userRole === 'TEACHER') {
    return <TeacherAttendancesTabs />;
  }

  // Super Admin, Admin y otros roles ven el reporte completo
  return <AdminAttendanceView />;
}

function TeacherAttendancesTabs() {
  const [tab, setTab] = useState<'list' | 'history'>('list');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Asistencias</h1>
        <p className="text-gray-500 mt-1">Pasa lista y consulta registros por fecha</p>
      </div>
      <div className="flex gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setTab('list')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'list'
              ? 'border-[#7c0613] text-[#7c0613]'
              : 'border-transparent text-gray-500'
          }`}
        >
          Pasar lista
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'history'
              ? 'border-[#7c0613] text-[#7c0613]'
              : 'border-transparent text-gray-500'
          }`}
        >
          Historial
        </button>
      </div>
      {tab === 'list' ? <TeacherAttendanceView /> : <TeacherAttendanceHistory />}
    </div>
  );
}