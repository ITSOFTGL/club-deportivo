import api from '@/lib/axios';
import type { TeacherAssignment } from './teacher-assignments';

export interface TeacherShiftOption {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface TeacherCategoryOption {
  id: string;
  name: string;
}

export async function fetchTeacherAssignments(teacherId: string) {
  return api.get(`/teacher-assignments?teacherId=${teacherId}`) as Promise<
    TeacherAssignment[]
  >;
}

export async function fetchTeacherStudents(teacherId: string) {
  return api.get('/students') as Promise<
    Array<{
      id: string;
      name: string;
      lastName: string;
      categoryId: string;
      category?: { id: string; name: string };
      branch?: { name: string };
      birthDate?: string;
      documentId?: string;
    }>
  >;
}

export function parseTeacherContext(assignments: TeacherAssignment[]) {
  const categoriesMap = new Map<string, TeacherCategoryOption>();
  const shiftsByCategory = new Map<string, Map<string, TeacherShiftOption>>();

  for (const assignment of assignments) {
    const cs = assignment.categoryShift;
    if (!cs?.category || !cs?.shift) continue;

    categoriesMap.set(cs.category.id, {
      id: cs.category.id,
      name: cs.category.name,
    });

    if (!shiftsByCategory.has(cs.category.id)) {
      shiftsByCategory.set(cs.category.id, new Map());
    }
    shiftsByCategory.get(cs.category.id)!.set(cs.shift.id, {
      id: cs.shift.id,
      name: cs.shift.name,
      startTime: cs.shift.startTime ?? '',
      endTime: cs.shift.endTime ?? '',
    });
  }

  return {
    categories: Array.from(categoriesMap.values()),
    shiftsByCategory,
    schedule: assignments.map((a) => ({
      id: a.id,
      categoryName: a.categoryShift?.category?.name ?? '—',
      shiftName: a.categoryShift?.shift?.name ?? '—',
      branchName: a.categoryShift?.branch?.name ?? '—',
      role: a.role,
      isLeadTeacher: a.isLeadTeacher,
      startTime: a.categoryShift?.shift?.startTime,
      endTime: a.categoryShift?.shift?.endTime,
    })),
  };
}
