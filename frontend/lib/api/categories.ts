import api from '@/lib/axios';

export interface ShiftCapacity {
  shiftId: string;
  capacity: number;
}

export function formatCategoryDisplayName(category: {
  name: string;
  groupLabel?: string | null;
}): string {
  return category.groupLabel?.trim()
    ? `${category.name} (${category.groupLabel.trim()})`
    : category.name;
}

/** Nombre con sucursal (selectores de alumnos, etc.) */
export function formatCategoryLabel(category: {
  name: string;
  groupLabel?: string | null;
  branch?: { name?: string };
  branchId?: string;
}): string {
  const base = formatCategoryDisplayName(category);
  return category.branch?.name ? `${base} — ${category.branch.name}` : base;
}

export interface Category {
  id: string;
  name: string;
  groupLabel?: string;
  description?: string;
  type: string;
  monthlyPrice: number;
  maxCapacity?: number;
  minAge?: number;
  maxAge?: number;
  requiresEquipment: boolean;
  branchId: string;
  branch?: { id: string; name: string };
  isActive?: boolean;
  shifts?: Array<{
    shiftId: string;
    capacity: number;
    shift: {
      id: string;
      name: string;
      startTime: string;
      endTime: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  groupLabel?: string;
  description?: string;
  isActive?: boolean;
  type: string;
  monthlyPrice: number;
  maxCapacity?: number;
  minAge?: number;
  maxAge?: number;
  requiresEquipment: boolean;
  branchId: string;
  shifts?: ShiftCapacity[];
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

const categoriesApi = {
  getAll: (): Promise<Category[]> => api.get('/categories'),
  getOne: (id: string): Promise<Category> => api.get(`/categories/${id}`),
  create: (data: CreateCategoryDto): Promise<Category> =>
    api.post('/categories', data),
  update: (id: string, data: UpdateCategoryDto): Promise<Category> =>
    api.patch(`/categories/${id}`, data),
  delete: (id: string): Promise<void> => api.delete(`/categories/${id}`),
};

export default categoriesApi;
