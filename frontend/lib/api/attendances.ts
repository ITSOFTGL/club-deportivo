// lib/api/attendances.ts
import api from '../axios';

export interface Attendance {
  id: string;
  reservationId: string;
  shiftId: string;
  userId: string;
  studentId: string;
  status: 'PENDING' | 'PRESENT' | 'ABSENT' | 'LATE';
  checkInTime?: string;
  checkOutTime?: string;
  verifiedBy?: string;
  verifiedMethod?: string;
  observations?: string;
  student?: {
    id: string;
    name: string;
    lastName: string;
  };
  shift?: {
    id: string;
    name: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAttendanceDto {
  studentId: string;
  shiftId: string;
  status: 'PENDING' | 'PRESENT' | 'ABSENT' | 'LATE';
  checkInTime?: string;
  observations?: string;
}

export interface UpdateAttendanceDto extends Partial<CreateAttendanceDto> {
  checkOutTime?: string;
}

const attendancesApi = {
  getAll: (): Promise<Attendance[]> => api.get('/attendances'),
  getById: (id: string): Promise<Attendance> => api.get(`/attendances/${id}`),
  create: (data: CreateAttendanceDto): Promise<Attendance> => api.post('/attendances', data),
  update: (id: string, data: UpdateAttendanceDto): Promise<Attendance> => api.patch(`/attendances/${id}`, data),
  delete: (id: string): Promise<void> => api.delete(`/attendances/${id}`),
  getByDate: (date: string): Promise<Attendance[]> => api.get(`/attendances?date=${date}`),
  getByStudent: (studentId: string): Promise<Attendance[]> => api.get(`/attendances/student/${studentId}`),
};

export default attendancesApi;