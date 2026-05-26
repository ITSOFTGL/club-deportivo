'use client';

import { useEffect, useState } from 'react';
import attendancesApi, { Attendance } from '@/lib/api/attendances';
import { getLocalDateString, formatLocalDateLong } from '@/lib/utils/date';

const statusLabels: Record<string, string> = {
  PRESENT: 'Presente',
  ABSENT: 'Ausente',
  LATE: 'Tardanza',
  PENDING: 'Pendiente',
};

export function TeacherAttendanceHistory() {
  const [date, setDate] = useState(getLocalDateString());
  const [rows, setRows] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await attendancesApi.getByDate(date);
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [date]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <p className="text-sm text-gray-600">Consultar asistencias del día</p>
          <p className="font-medium text-gray-900">{formatLocalDateLong(date)}</p>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7c0613] sm:ml-auto"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c0613]" />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          No hay asistencias registradas para esta fecha
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Alumno
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Turno
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    {r.student?.name} {r.student?.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {r.shift?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium">
                      {statusLabels[r.status] ?? r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
