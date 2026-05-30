'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import attendancesApi, { Attendance } from '@/lib/api/attendances';
import {
  buildTeacherSlots,
  fetchTeacherAssignments,
  fetchTeacherStudents,
} from '@/lib/api/teacher';
import { TeacherSlotSelector } from '@/components/teacher/TeacherSlotSelector';
import { getLocalDateString, formatLocalDateLong } from '@/lib/utils/date';
import { attendanceCameLabel } from '@/lib/exportPdf';

export function TeacherAttendanceHistory() {
  const { data: session } = useSession();
  const [date, setDate] = useState(getLocalDateString());
  const [slots, setSlots] = useState(
    [] as ReturnType<typeof buildTeacherSlots>,
  );
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [groupStudentIds, setGroupStudentIds] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  const activeSlot = slots.find((s) => s.categoryShiftId === selectedShiftId);

  useEffect(() => {
    const load = async () => {
      if (!session?.user?.id) return;
      try {
        const assignments = await fetchTeacherAssignments(session.user.id);
        const built = buildTeacherSlots(
          Array.isArray(assignments) ? assignments : [],
        );
        setSlots(built);
        if (built.length === 1) {
          setSelectedShiftId(built[0].categoryShiftId);
        }
      } catch {
        setSlots([]);
      }
    };
    load();
  }, [session?.user?.id]);

  useEffect(() => {
    const loadGroup = async () => {
      if (!session?.user?.id || !selectedShiftId) {
        setGroupStudentIds(new Set());
        return;
      }
      try {
        const students = await fetchTeacherStudents(
          session.user.id,
          selectedShiftId,
        );
        setGroupStudentIds(
          new Set(
            (Array.isArray(students) ? students : []).map(
              (s: { id: string }) => s.id,
            ),
          ),
        );
      } catch {
        setGroupStudentIds(new Set());
      }
    };
    loadGroup();
  }, [session?.user?.id, selectedShiftId]);

  useEffect(() => {
    const load = async () => {
      if (!session?.user?.id) return;
      setLoading(true);
      try {
        const data = await attendancesApi.getByDate(date, session.user.id);
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [date, session?.user?.id]);

  const filtered = useMemo(() => {
    if (!selectedShiftId || !activeSlot) return [];
    return rows.filter((r) => {
      if (!r.studentId || !groupStudentIds.has(r.studentId)) return false;
      if (activeSlot.shiftId && r.shiftId !== activeSlot.shiftId) return false;
      return true;
    });
  }, [rows, selectedShiftId, activeSlot, groupStudentIds]);

  const present = filtered.filter(
    (r) => r.status === 'PRESENT' || r.status === 'LATE',
  ).length;
  const absent = filtered.filter((r) => r.status === 'ABSENT').length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        <TeacherSlotSelector
          slots={slots}
          value={selectedShiftId}
          onChange={setSelectedShiftId}
          label="Grupo para ver historial"
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <p className="text-sm text-gray-600">Historial de listas pasadas</p>
            <p className="font-medium text-gray-900">
              {formatLocalDateLong(date)}
            </p>
            {filtered.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {present} vinieron · {absent} no vinieron
              </p>
            )}
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7c0613] sm:ml-auto"
          />
        </div>
      </div>

      {!selectedShiftId ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          Seleccione un grupo para ver el historial
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c0613]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          No hay lista guardada para esta fecha y grupo
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Alumno
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sucursal
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ¿Vino?
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Observación
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    {r.student?.name} {r.student?.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {r.student?.branch?.name ?? activeSlot?.branchName ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-sm font-medium ${
                        attendanceCameLabel(r.status) === 'Sí'
                          ? 'text-green-700'
                          : 'text-red-700'
                      }`}
                    >
                      {attendanceCameLabel(r.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {r.observations || '—'}
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
