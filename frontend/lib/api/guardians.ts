// lib/api/guardians.ts
import api from '../axios';

export interface Guardian {
  id: string;
  studentId: string;
  name: string;
  lastName: string;
  documentId: string;
  phone: string;
  email?: string;
  relationship: 'PADRE' | 'MADRE' | 'TUTOR' | 'ABUELO' | 'OTRO';
  isPrimary: boolean;
  isActive: boolean;
  student?: {
    name: string;
    lastName: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGuardianDto {
  studentId: string;
  name: string;
  lastName: string;
  documentId: string;
  phone: string;
  email?: string;
  relationship: 'PADRE' | 'MADRE' | 'TUTOR' | 'ABUELO' | 'OTRO';
  isPrimary?: boolean;
}

export interface UpdateGuardianDto extends Partial<CreateGuardianDto> {
  isActive?: boolean;
}

const guardiansApi = {
  getAll: (): Promise<Guardian[]> => api.get('/guardians'),
  getById: (id: string): Promise<Guardian> => api.get(`/guardians/${id}`),
  create: (data: CreateGuardianDto): Promise<Guardian> => api.post('/guardians', data),
  update: (id: string, data: UpdateGuardianDto): Promise<Guardian> => api.patch(`/guardians/${id}`, data),
  delete: (id: string): Promise<void> => api.delete(`/guardians/${id}`),
};

export default guardiansApi;