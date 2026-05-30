'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckIcon,
  XMarkIcon,
  LockClosedIcon,
  BuildingOfficeIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import attendancesApi from '@/lib/api/attendances';
import {
  fetchTeacherAssignments,
  fetchTeacherStudents,
  buildTeacherSlots,
  type TeacherSlot,
} from '@/lib/api/teacher';
import { TeacherSlotSelector } from '@/components/teacher/TeacherSlotSelector';
import { formatLocalDateLong, getLocalDateString } from '@/lib/utils/date';
import { getMembershipBadge, type MembershipFields } from '@/lib/utils/membership';

type AttendanceStatus = 'PRESENT' | 'ABSENT';

interface AttendanceCell {
  id?: string;
  status: AttendanceStatus | 'PENDING';
  observations?: string;
}

interface StudentRow extends MembershipFields {
  id: string;
  name: string;
  lastName: string;
  branch?: { name: string };
}

const OBS_COMUNICADO = 'Comunicado previamente (no asistirá)';
const OBS_LICENCIA = 'Licencia / justificado';

export function TeacherAttendanceView() {
  const { data: session } = useSession();
  const [slots, setSlots] = useState<TeacherSlot[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [attendances, setAttendances] = useState<Record<string, AttendanceCell>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  const today = getLocalDateString();
  const activeSlot = slots.find((s) => s.categoryShiftId === selectedShiftId);

  const listLocked = useMemo(() => {
    if (students.length === 0) return false;
    return students.every((s) => {
      const a = attendances[s.id];
      return Boolean(a?.id) && a.status !== 'PENDING';
    });
  }, [students, attendances]);

  useEffect(() => {
    const load = async () => {
      if (!session?.user?.id) return;
      setLoading(true);
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
        toast.error('Error al cargar asignaciones');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session?.user?.id]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!session?.user?.id || !selectedShiftId || !activeSlot) {
        setStudents([]);
        return;
      }
      setLoadingStudents(true);
      try {
        const data = await fetchTeacherStudents(
          session.user.id,
          selectedShiftId,
        );
        setStudents(Array.isArray(data) ? data : []);
      } catch {
        toast.error('Error al cargar alumnos del grupo');
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, [session?.user?.id, selectedShiftId, activeSlot?.categoryShiftId]);

  const reloadAttendances = async () => {
    if (!activeSlot?.shiftId) return;
    try {
      const list = await attendancesApi.getByDateAndShift(
        today,
        activeSlot.shiftId,
      );
      const map: Record<string, AttendanceCell> = {};
      const studentIds = new Set(students.map((s) => s.id));
      for (const row of Array.isArray(list) ? list : []) {
        if (row.studentId && studentIds.has(row.studentId)) {
          const st =
            row.status === 'LATE' ? 'PRESENT' : (row.status as AttendanceStatus);
          map[row.studentId] = {
            id: row.id,
            status: st === 'PRESENT' || st === 'ABSENT' ? st : 'PENDING',
            observations: row.observations ?? undefined,
          };
        }
      }
      setAttendances(map);
    } catch {
      setAttendances({});
    }
  };

  useEffect(() => {
    if (students.length > 0 && activeSlot?.shiftId) {
      reloadAttendances();
    } else {
      setAttendances({});
    }
  }, [students, activeSlot?.shiftId, today]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendances((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        observations:
          status === 'ABSENT' ? prev[studentId]?.observations : undefined,
      },
    }));
  };

  const setAbsentWithNote = (studentId: string, note: string) => {
    setAttendances((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: 'ABSENT',
        observations: note,
      },
    }));
  };

  const handleObservationChange = (studentId: string, text: string) => {
    setAttendances((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], observations: text },
    }));
  };

  const saveObservationOnly = async (studentId: string) => {
    const cell = attendances[studentId];
    if (!cell?.id) return;
    setSavingNoteId(studentId);
    try {
      await attendancesApi.update(cell.id, {
        observations: cell.observations,
        status: cell.status === 'PENDING' ? 'ABSENT' : cell.status,
      });
      toast.success('Observación guardada');
      await reloadAttendances();
    } catch {
      toast.error('No se pudo guardar la observación');
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleSaveList = async () => {
    if (!activeSlot?.shiftId) {
      toast.error('Seleccione su grupo (sucursal + horario)');
      return;
    }
    if (listLocked) {
      toast.error('La lista ya está guardada');
      return;
    }

    const pending = students.filter(
      (s) => !attendances[s.id]?.status || attendances[s.id].status === 'PENDING',
    );
    if (pending.length > 0) {
      toast.error(`Marque a todos los alumnos (${pending.length} pendiente(s))`);
      return;
    }

    const records = students.map((s) => ({
      studentId: s.id,
      status: attendances[s.id].status as AttendanceStatus,
      observations: attendances[s.id].observations,
    }));

    setSaving(true);
    try {
      const result = await attendancesApi.saveBatch({
        shiftId: activeSlot.shiftId,
        records,
      });
      toast.success(`Lista guardada (${result.saved} registros)`);
      await reloadAttendances();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ??
        (err instanceof Error ? err.message : 'Error al guardar la lista');
      toast.error(typeof msg === 'string' ? msg : 'Error al guardar la lista');
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (studentId: string) => {
    const st = attendances[studentId]?.status;
    if (st === 'PRESENT') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
          <CheckIcon className="w-4 h-4" /> Vino
        </span>
      );
    }
    if (st === 'ABSENT') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
          <XMarkIcon className="w-4 h-4" /> No vino
        </span>
      );
    }
    return (
      <span className="text-xs text-gray-400">Sin marcar</span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c0613]" />
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 text-center">
        <p className="text-gray-500">No tienes grupos asignados</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className={`rounded-xl p-4 flex items-center justify-between ${
          listLocked ? 'bg-amber-50' : 'bg-green-50'
        }`}
      >
        <p
          className={`text-sm ${listLocked ? 'text-amber-800' : 'text-green-700'}`}
        >
          <strong>Hoy:</strong> {formatLocalDateLong(today)}
          {listLocked && (
            <span className="block mt-1 text-xs">
              Lista ya pasada para este grupo. Puede agregar observaciones o aviso
              de ausencia comunicada.
            </span>
          )}
        </p>
        <LockClosedIcon
          className={`w-5 h-5 ${listLocked ? 'text-amber-600' : 'text-green-600'}`}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        <TeacherSlotSelector
          slots={slots}
          value={selectedShiftId}
          onChange={setSelectedShiftId}
        />

        {activeSlot && (
          <div className="flex items-start gap-2 rounded-lg bg-[#7c0613]/5 border border-[#7c0613]/20 p-3 text-sm text-gray-700">
            <BuildingOfficeIcon className="w-5 h-5 text-[#7c0613] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[#7c0613]">
                {activeSlot.categoryName} — {activeSlot.branchName}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {activeSlot.label} · {students.length} alumno(s)
              </p>
            </div>
          </div>
        )}
      </div>

      {selectedShiftId && !loadingStudents && students.length > 0 && (
        <motion.div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          {!listLocked && (
            <div className="flex justify-end px-6 py-3 border-b bg-gray-50">
              <button
                type="button"
                onClick={handleSaveList}
                disabled={saving}
                className="px-5 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar lista completa'}
              </button>
            </div>
          )}
          <table className="w-full min-w-[720px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Alumno
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mensualidad
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  ¿Vino?
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Observación / licencia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((student) => {
                const badge = getMembershipBadge(student);
                const cell = attendances[student.id];
                const isAbsent = cell?.status === 'ABSENT';

                return (
                  <tr key={student.id} className={listLocked ? 'bg-gray-50/50' : ''}>
                    <td className="px-4 py-4 font-medium">
                      {student.name} {student.lastName}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-1 rounded-full border ${badge.className}`}
                      >
                        {badge.text}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {listLocked ? (
                        <div className="flex justify-center">{statusBadge(student.id)}</div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(student.id, 'PRESENT')
                              }
                              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                cell?.status === 'PRESENT'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-green-100'
                              }`}
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusChange(student.id, 'ABSENT')
                              }
                              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                                cell?.status === 'ABSENT'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-red-100'
                              }`}
                            >
                              No
                            </button>
                          </div>
                          {cell?.status === 'ABSENT' && (
                            <div className="flex flex-wrap gap-1 justify-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setAbsentWithNote(student.id, OBS_COMUNICADO)
                                }
                                className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900"
                              >
                                Avisó que no viene
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setAbsentWithNote(student.id, OBS_LICENCIA)
                                }
                                className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-900"
                              >
                                Licencia
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {(isAbsent || listLocked) && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={cell?.observations ?? ''}
                            onChange={(e) =>
                              handleObservationChange(student.id, e.target.value)
                            }
                            placeholder="Ej. comunicado por apoderado, licencia médica..."
                            disabled={listLocked && !cell?.id}
                            className="w-full text-sm px-2 py-1.5 border rounded-lg focus:ring-1 focus:ring-[#7c0613] disabled:bg-gray-100"
                          />
                          {listLocked && cell?.id && (
                            <button
                              type="button"
                              disabled={savingNoteId === student.id}
                              onClick={() => saveObservationOnly(student.id)}
                              className="text-xs text-[#7c0613] font-medium flex items-center gap-1"
                            >
                              <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                              {savingNoteId === student.id
                                ? 'Guardando...'
                                : 'Guardar observación'}
                            </button>
                          )}
                        </div>
                      )}
                      {!isAbsent && !listLocked && (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                      {!isAbsent && listLocked && cell?.observations && (
                        <p className="text-sm text-gray-600">{cell.observations}</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      {selectedShiftId && loadingStudents && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7c0613]" />
        </div>
      )}

      {selectedShiftId && !loadingStudents && students.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          No hay alumnos registrados en esta sucursal y categoría
        </div>
      )}

      {!selectedShiftId && (
        <div className="bg-white rounded-xl p-8 text-center text-gray-500">
          Seleccione el grupo donde va a pasar lista hoy
        </div>
      )}
    </div>
  );
}
