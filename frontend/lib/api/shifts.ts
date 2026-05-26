import api from '@/lib/axios';

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface CreateShiftDto {
  name: string;
  startTime: string;
  endTime: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateShiftDto extends Partial<CreateShiftDto> {}

const shiftsApi = {
  getAll: (): Promise<Shift[]> => api.get('/shifts'),
  getOne: (id: string): Promise<Shift> => api.get(`/shifts/${id}`),
  create: (data: CreateShiftDto): Promise<Shift> => api.post('/shifts', data),
  update: (id: string, data: UpdateShiftDto): Promise<Shift> =>
    api.patch(`/shifts/${id}`, data),
  delete: (id: string): Promise<void> => api.delete(`/shifts/${id}`),
};

export default shiftsApi;
