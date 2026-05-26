'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import attendancesApi from '@/lib/api/attendances';
import {
  fetchTeacherAssignments,
  fetchTeacherStudents,
  parseTeacherContext,
} from '@/lib/api/teacher';
import { formatLocalDateLong, getLocalDateString } from '@/lib/utils/date';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

interface StudentRow {
  id: string;
  name: string;
  lastName: string;
  categoryId: string;
  category?: { name: string };
}

export function TeacherAttendanceView() {
  const { data: session } = useSession();
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [shiftsByCategory, setShiftsByCategory] = useState<
    Map<string, Map<string, { id: string; name: string }>>
  >(new Map());
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [attendances, setAttendances] = useState<
    Record<string, { id?: string; status: AttendanceStatus | 'PENDING' }>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = getLocalDateString();

  useEffect(() => {
    const load = async () => {
      if (!session?.user?.id) return;
      setLoading(true);
      try {
        const assignments = await fetchTeacherAssignments(session.user.id);
        const list = Array.isArray(assignments) ? assignments : [];
        const ctx = parseTeacherContext(list);
        setCategories(ctx.categories);
        setShiftsByCategory(ctx.shiftsByCategory);

        const studentsData = await fetchTeacherStudents(session.user.id);
        setStudents(Array.isArray(studentsData) ? studentsData : []);

        if (ctx.categories.length === 1) {
          setSelectedCategoryId(ctx.categories[0].id);
        }
      } catch {
        toast.error('Error al cargar datos del profesor');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session?.user?.id]);

  const availableShifts = useMemo(() => {
    if (!selectedCategoryId) return [];
    const map = shiftsByCategory.get(selectedCategoryId);
    return map ? Array.from(map.values()) : [];
  }, [selectedCategoryId, shiftsByCategory]);

  useEffect(() => {
    if (availableShifts.length === 1) {
      setSelectedShiftId(availableShifts[0].id);
    } else {
      setSelectedShiftId('');
    }
  }, [selectedCategoryId, availableShifts]);

  useEffect(() => {
    const loadAttendances = async () => {
      if (!selectedShiftId || students.length === 0) return;
      const map: Record<string, { id?: string; status: AttendanceStatus | 'PENDING' }> = {};
      const filtered = selectedCategoryId
        ? students.filter((s) => s.categoryId === selectedCategoryId)
        : students;

      for (const student of filtered) {
        try {
          const row = await attendancesApi.getByDateAndStudent(
            today,
            student.id,
          );
          if (row && row.shiftId === selectedShiftId) {
            map[student.id] = {
              id: row.id,
              status: row.status as AttendanceStatus,
            };
          }
        } catch {
          /* sin registro previo */
        }
      }
      setAttendances(map);
    };
    loadAttendances();
  }, [selectedShiftId, selectedCategoryId, students, today]);

  const filteredStudents = selectedCategoryId
    ? students.filter((s) => s.categoryId === selectedCategoryId)
    : students;

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendances((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleSaveList = async () => {
    if (!selectedShiftId) {
      toast.error('Selecciona un turno');
      return;
    }

    const records = filteredStudents
      .filter((s) => {
        const st = attendances[s.id]?.status;
        return st && st !== 'PENDING';
      })
      .map((s) => ({
        studentId: s.id,
        status: attendances[s.id].status as AttendanceStatus,
      }));

    if (records.length === 0) {
      toast.error('Marca al menos un alumno antes de guardar');
      return;
    }

    setSaving(true);
    try {
      const result = await attendancesApi.saveBatch({
        shiftId: selectedShiftId,
        records,
      });
      toast.success(`Lista guardada (${result.saved} registros)`);
      const list = await attendancesApi.getByDate(today);
      const map: Record<string, { id?: string; status: AttendanceStatus | 'PENDING' }> = {};
      for (const row of Array.isArray(list) ? list : []) {
        if (row.studentId) {
          map[row.studentId] = { id: row.id, status: row.status as AttendanceStatus };
        }
      }
      setAttendances(map);
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar la lista');
    } finally {
      setSaving(false);
    }
  };

  const getStatusButtonClass = (studentId: string, statusValue: string) => {
    const current = attendances[studentId]?.status;
    const isActive = current === statusValue;
    if (statusValue === 'PRESENT') {
      return isActive
        ? 'bg-green-500 text-white shadow-md'
        : 'bg-gray-100 text-gray-600 hover:bg-green-100';
    }
    if (statusValue === 'ABSENT') {
      return isActive
        ? 'bg-red-500 text-white shadow-md'
        : 'bg-gray-100 text-gray-600 hover:bg-red-100';
    }
    return isActive
      ? 'bg-yellow-500 text-white shadow-md'
      : 'bg-gray-100 text-gray-600 hover:bg-yellow-100';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c0613]" />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <p className="text-gray-500">No tienes categorías asignadas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-4 bg-green-50 flex items-center justify-between">
        <p className="text-sm text-green-700">
          <strong>Hoy:</strong> {formatLocalDateLong(today)}
        </p>
        <LockClosedIcon className="w-5 h-5 text-green-600" />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Categoría</label>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7c0613]"
          >
            <option value="">Seleccionar categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Turno</label>
          <select
            value={selectedShiftId}
            onChange={(e) => setSelectedShiftId(e.target.value)}
            disabled={!selectedCategoryId}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#7c0613] disabled:opacity-50"
          >
            <option value="">
              {selectedCategoryId
                ? 'Seleccionar turno de tu categoría'
                : 'Primero elige categoría'}
            </option>
            {availableShifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedShiftId ? (
        <motion.div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex justify-end px-6 py-3 border-b bg-gray-50">
            <button
              type="button"
              onClick={handleSaveList}
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg font-medium disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar lista'}
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Alumno
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Asistencia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 font-medium">
                    {student.name} {student.lastName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      {(['PRESENT', 'ABSENT', 'LATE'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleStatusChange(student.id, st)}
                          className={`p-2 rounded-lg ${getStatusButtonClass(student.id, st)}`}
                          title={st}
                        >
                          {st === 'PRESENT' && <CheckIcon className="w-5 h-5" />}
                          {st === 'ABSENT' && <XMarkIcon className="w-5 h-5" />}
                          {st === 'LATE' && <ClockIcon className="w-5 h-5" />}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          Selecciona categoría y turno para pasar lista
        </div>
      )}
    </div>
  );
}
