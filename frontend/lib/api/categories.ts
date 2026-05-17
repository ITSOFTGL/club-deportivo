// lib/api/categories.ts
import api from '../axios';

export interface Category {
  id: string;
  name: string;
  description?: string;
  minAge?: number;
  maxAge?: number;
  branchId: string;
  branchName?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  minAge?: number;
  maxAge?: number;
  branchId: string;
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {
  status?: 'ACTIVE' | 'INACTIVE';
}

const categoriesApi = {
  // Obtener todas las categorías
  getAll: (): Promise<Category[]> => api.get('/categories'),
  
  // Obtener una categoría por ID
  getById: (id: string): Promise<Category> => api.get(`/categories/${id}`),
  
  // Crear categoría
  create: (data: CreateCategoryDto): Promise<Category> => api.post('/categories', data),
  
  // Actualizar categoría
  update: (id: string, data: UpdateCategoryDto): Promise<Category> => api.patch(`/categories/${id}`, data),
  
  // Eliminar categoría (soft delete)
  delete: (id: string): Promise<void> => api.delete(`/categories/${id}`),
};

export default categoriesApi;