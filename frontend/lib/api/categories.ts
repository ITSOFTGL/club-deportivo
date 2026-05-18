// lib/api/categories.ts
import api from '../axios';

export interface Category {
  id: string;
  name: string;
  description?: string;
  type?: string;
  monthlyPrice: number;
  maxCapacity?: number;
  minAge?: number;
  maxAge?: number;
  requiresEquipment?: boolean;
  branchId: string;
  branchName?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  type?: string;
  monthlyPrice: number;
  maxCapacity?: number;
  minAge?: number;
  maxAge?: number;
  requiresEquipment?: boolean;
  branchId: string;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {
  isActive?: boolean;
}

const categoriesApi = {
  getAll: (): Promise<Category[]> => api.get('/categories'),
  getById: (id: string): Promise<Category> => api.get(`/categories/${id}`),
  create: (data: CreateCategoryDto): Promise<Category> => api.post('/categories', data),
  update: (id: string, data: UpdateCategoryDto): Promise<Category> => api.patch(`/categories/${id}`, data),
  delete: (id: string): Promise<void> => api.delete(`/categories/${id}`),
};

export default categoriesApi;