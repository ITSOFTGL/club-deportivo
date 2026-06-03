'use client';

import { useEffect, useMemo, useState } from 'react';
import { useStudentsStore } from '@/store/studentsStore';
import attendancesApi, { Attendance } from '@/lib/api/attendances';
import { StudentAvatar } from '@/components/ui/StudentAvatar';
import { attendanceCameLabel, formatTimeBo } from '@/lib/exportPdf';
import { formatLocalDateLong, getLocalDateString, isoToLocalDateKey } from '@/lib/utils/date';

export function ParentAttendanceView() {
  const { students, fetchStudents } = useStudentsStore();
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [from, setFrom] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [to, setTo] = useState(getLocalDateString());
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (students.length === 1 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  useEffect(() => {
    if (!selectedStudentId) {
      setAttendances([]);
      return;
    }
    setLoading(true);
    attendancesApi
      .getForParent({ studentId: selectedStudentId, from, to })
      .then((data) => setAttendances(Array.isArray(data) ? data : []))
      .catch(() => setAttendances([]))
      .finally(() => setLoading(false));
  }, [selectedStudentId, from, to]);

  const selected = students.find((s) => s.id === selectedStudentId);

  const grouped = useMemo(() => {
    const map: Record<string, Attendance[]> = {};
    for (const a of attendances) {
      const key = isoToLocalDateKey(a.createdAt ?? '');
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [attendances]);

  const absentCount = attendances.filter(
    (a) => attendanceCameLabel(a.status) === 'No',
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Asistencia de mis hijos</h1>
        <p className="text-gray-500 mt-1">
          Solo puede ver la asistencia de sus hijos registrados, no de otros alumnos.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-sm font-medium mb-1">Hijo/a</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
          >
            <option value="">Seleccionar</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.lastName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
          />
        </div>
      </div>

      {selected && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
          <StudentAvatar
            name={selected.name}
            lastName={selected.lastName}
            profilePhotoUrl={selected.profilePhotoUrl}
            size="lg"
          />
          <div>
            <p className="font-semibold">
              {selected.name} {selected.lastName}
            </p>
            <p className="text-sm text-gray-600">
              {selected.branch?.name} · {selected.category?.name}
            </p>
            <p className="text-sm text-red-700 mt-1">
              Inasistencias en el período: {absentCount}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : !selectedStudentId ? (
        <p className="text-center text-gray-500 py-8">Seleccione un hijo</p>
      ) : grouped.length === 0 ? (
        <p className="text-center text-gray-500 py-8">Sin registros en este período</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, rows]) => (
            <div
              key={date}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
            >
              <div className="px-4 py-2 bg-gray-50 border-b font-medium text-sm">
                {formatLocalDateLong(date)}
              </div>
              <ul className="divide-y">
                {rows.map((a) => (
                  <li key={a.id} className="px-4 py-3 flex justify-between text-sm">
                    <span>{a.shift?.name ?? 'Turno'}</span>
                    <span
                      className={
                        attendanceCameLabel(a.status) === 'Sí'
                          ? 'text-green-700 font-medium'
                          : 'text-red-700 font-medium'
                      }
                    >
                      {attendanceCameLabel(a.status)}
                      {a.checkInTime ? ` · ${formatTimeBo(a.checkInTime)}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
