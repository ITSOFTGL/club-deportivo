// lib/api/branches.ts
import api from '../axios';

export interface Branch {
  id: string;
  name: string;
  location: string;
  phone: string;
  email?: string;
  manager?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  schedule?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBranchDto {
  name: string;
  location: string;
  phone: string;
  email?: string;
  manager?: string;
  schedule?: string;
}

export interface UpdateBranchDto extends Partial<CreateBranchDto> {
  status?: 'ACTIVE' | 'INACTIVE';
}

const branchesApi = {
  // Obtener todas las sucursales
  getAll: (): Promise<Branch[]> => api.get('/branches'),
  
  // Obtener una sucursal por ID
  getById: (id: string): Promise<Branch> => api.get(`/branches/${id}`),
  
  // Crear sucursal
  create: (data: CreateBranchDto): Promise<Branch> => api.post('/branches', data),
  
  // Actualizar sucursal
  update: (id: string, data: UpdateBranchDto): Promise<Branch> => api.patch(`/branches/${id}`, data),
  
  // Eliminar sucursal
  delete: (id: string): Promise<void> => api.delete(`/branches/${id}`),
};

export default branchesApi;