import api from '@/lib/axios';

export interface CategoryShift {
  id: string;
  name: string;
  categoryId: string;
  branchId: string;
  shiftId: string;
  totalCapacity: number;
  enrolledCount: number;
  isActive: boolean;
  category?: { id: string; name: string };
  shift?: { id: string; name: string; startTime: string; endTime: string };
  branch?: { id: string; name: string };
}

const categoryShiftsApi = {
  getAll: (): Promise<CategoryShift[]> => api.get('/category-shifts'),
  getByCategory: (categoryId: string): Promise<CategoryShift[]> =>
    api.get(`/category-shifts/category/${categoryId}`),
  getOne: (id: string): Promise<CategoryShift> =>
    api.get(`/category-shifts/${id}`),
};

export default categoryShiftsApi;
