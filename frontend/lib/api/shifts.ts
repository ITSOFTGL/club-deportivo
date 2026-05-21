// lib/api/shifts.ts
import api from '../axios';

export interface Shift {
  id: string;
  name: string;
  type: 'MORNING' | 'AFTERNOON' | 'EVENING';
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateShiftDto {
  name: string;
  type: 'MORNING' | 'AFTERNOON' | 'EVENING';
  startTime: string;
  endTime: string;
}

export interface UpdateShiftDto extends Partial<CreateShiftDto> {
  isActive?: boolean;
}

const shiftsApi = {
  getAll: (): Promise<Shift[]> => api.get('/shifts'),
  getById: (id: string): Promise<Shift> => api.get(`/shifts/${id}`),
  create: (data: CreateShiftDto): Promise<Shift> => api.post('/shifts', data),
  update: (id: string, data: UpdateShiftDto): Promise<Shift> => api.patch(`/shifts/${id}`, data),
  delete: (id: string): Promise<void> => api.delete(`/shifts/${id}`),
};

export default shiftsApi;