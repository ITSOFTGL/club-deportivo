'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { TeacherAttendanceView } from '@/components/attendances/TeacherAttendanceView';
import { TeacherAttendanceHistory } from '@/components/attendances/TeacherAttendanceHistory';
import { AdminAttendanceView } from '@/components/attendances/AdminAttendanceView';
import { ParentAttendanceView } from '@/components/attendances/ParentAttendanceView';
import { AttendanceReportsPanel } from '@/components/attendances/AttendanceReportsPanel';

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

  if (userRole === 'PARENT') {
    return <ParentAttendanceView />;
  }

  if (userRole === 'TEACHER') {
    return <TeacherAttendancesTabs />;
  }

  return (
    <div className="space-y-0">
      <AdminAttendanceView />
      <AttendanceReportsPanel />
    </div>
  );
}

function TeacherAttendancesTabs() {
  const [tab, setTab] = useState<'list' | 'history' | 'reports'>('list');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Asistencias</h1>
        <p className="text-gray-500 mt-1">Pasa lista, historial y reportes de sus categorías</p>
      </div>
      <div className="flex gap-2 border-b border-gray-200 flex-wrap">
        {(
          [
            ['list', 'Pasar lista'],
            ['history', 'Historial'],
            ['reports', 'Reportes / inasistencias'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === id
                ? 'border-[#7c0613] text-[#7c0613]'
                : 'border-transparent text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'list' && <TeacherAttendanceView />}
      {tab === 'history' && <TeacherAttendanceHistory />}
      {tab === 'reports' && <AttendanceReportsPanel />}
    </div>
  );
}
