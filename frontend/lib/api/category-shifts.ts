import api from '@/lib/axios';

export interface CategoryShift {
  id: string;
  name: string;
  categoryId: string;
  branchId: string;
  shiftId: string;
  daysOfWeek?: string;
  startTime?: string;
  endTime?: string;
  totalCapacity: number;
  enrolledCount: number;
  isActive: boolean;
  category?: { id: string; name: string };
  shift?: { id: string; name: string; startTime: string; endTime: string };
  branch?: { id: string; name: string };
}

export function formatCategoryShiftLabel(cs: CategoryShift): string {
  const cat = cs.category?.name ?? cs.name;
  const branch = cs.branch?.name ?? '';
  const days = cs.daysOfWeek
    ? cs.daysOfWeek
        .split(/[,;]+/)
        .map((d) => d.trim().slice(0, 3))
        .join(',')
    : '';
  const time =
    cs.startTime && cs.endTime
      ? `${cs.startTime}–${cs.endTime}`
      : cs.shift?.startTime && cs.shift?.endTime
        ? `${cs.shift.startTime}–${cs.shift.endTime}`
        : '';
  return [cat, branch, days, time].filter(Boolean).join(' · ');
}

const categoryShiftsApi = {
  getAll: (): Promise<CategoryShift[]> => api.get('/category-shifts'),
  getByCategory: (categoryId: string): Promise<CategoryShift[]> =>
    api.get(`/category-shifts/category/${categoryId}`),
  getOne: (id: string): Promise<CategoryShift> =>
    api.get(`/category-shifts/${id}`),
};

export default categoryShiftsApi;
