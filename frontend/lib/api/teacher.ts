import api from '@/lib/axios';
import type { TeacherAssignment } from './teacher-assignments';

export interface TeacherSlot {
  assignmentId: string;
  categoryShiftId: string;
  categoryId: string;
  branchId: string;
  shiftId: string;
  label: string;
  categoryName: string;
  branchName: string;
  shiftName: string;
  daysOfWeek: string;
  startTime: string;
  endTime: string;
}

function formatDaysShort(raw?: string): string {
  if (!raw) return '';
  const map: Record<string, string> = {
    LUNES: 'Lun',
    LUN: 'Lun',
    MARTES: 'Mar',
    MAR: 'Mar',
    MIERCOLES: 'Mié',
    MIE: 'Mié',
    JUEVES: 'Jue',
    JUE: 'Jue',
    VIERNES: 'Vie',
    VIE: 'Vie',
    SABADO: 'Sáb',
    SAB: 'Sáb',
    DOMINGO: 'Dom',
    DOM: 'Dom',
  };
  return raw
    .toUpperCase()
    .split(/[,;\s]+/)
    .map((p) => map[p.trim()] || p.trim())
    .filter(Boolean)
    .join(', ');
}

export function buildTeacherSlots(
  assignments: TeacherAssignment[],
): TeacherSlot[] {
  return assignments
    .filter((a) => a.isActive && a.categoryShift)
    .map((a) => {
      const cs = a.categoryShift!;
      const days = formatDaysShort(cs.daysOfWeek);
      const time =
        cs.startTime && cs.endTime
          ? `${cs.startTime}–${cs.endTime}`
          : cs.shift?.startTime && cs.shift?.endTime
            ? `${cs.shift.startTime}–${cs.shift.endTime}`
            : '';
      const categoryName = cs.category?.name ?? 'Categoría';
      const branchName = cs.branch?.name ?? 'Sucursal';
      const shiftName = cs.shift?.name ?? cs.name ?? 'Turno';

      return {
        assignmentId: a.id,
        categoryShiftId: cs.id,
        categoryId: cs.category?.id ?? '',
        branchId: cs.branch?.id ?? '',
        shiftId: cs.shift?.id ?? '',
        categoryName,
        branchName,
        shiftName,
        daysOfWeek: cs.daysOfWeek ?? '',
        startTime: cs.startTime ?? cs.shift?.startTime ?? '',
        endTime: cs.endTime ?? cs.shift?.endTime ?? '',
        label: `${categoryName} · ${branchName} · ${days} ${time}`.replace(
          /\s+/g,
          ' ',
        ).trim(),
      };
    });
}

export async function fetchTeacherAssignments(teacherId: string) {
  return api.get(`/teacher-assignments?teacherId=${teacherId}`) as Promise<
    TeacherAssignment[]
  >;
}

export async function fetchTeacherStudents(
  teacherId: string,
  categoryShiftId: string,
) {
  const q = new URLSearchParams({ categoryShiftId });
  return api.get(`/students?${q.toString()}`) as Promise<
    Array<{
      id: string;
      name: string;
      lastName: string;
      categoryId: string;
      branchId: string;
      category?: { id: string; name: string };
      branch?: { id: string; name: string };
      birthDate?: string;
      documentId?: string;
      membershipPaidUntil?: string | null;
      membershipActive?: boolean;
      membershipStatus?: string;
      membershipLabel?: string;
    }>
  >;
}

export function buildTeacherSchedule(assignments: TeacherAssignment[]) {
  return buildTeacherSlots(assignments).map((slot) => {
    const a = assignments.find(
      (x) => x.categoryShift?.id === slot.categoryShiftId,
    );
    return {
      id: a?.id ?? slot.categoryShiftId,
      categoryName: slot.categoryName,
      shiftName: slot.shiftName,
      branchName: slot.branchName,
      role: a?.role ?? 'ASSISTANT',
      isLeadTeacher: a?.isLeadTeacher ?? false,
      startTime: slot.startTime,
      endTime: slot.endTime,
      daysLabel: formatDaysShort(slot.daysOfWeek),
    };
  });
}

export async function fetchTeacherGuardians(categoryShiftId: string) {
  return api.get(
    `/guardians?categoryShiftId=${encodeURIComponent(categoryShiftId)}`,
  ) as Promise<
    Array<{
      id: string;
      name: string;
      lastName: string;
      phone: string;
      email?: string;
      relationship: string;
      student?: {
        name: string;
        lastName: string;
        category?: { name: string };
        branch?: { name: string };
      };
    }>
  >;
}
