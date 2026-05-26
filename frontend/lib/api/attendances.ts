import api from '@/lib/axios';

export interface Attendance {
  id: string;
  reservationId?: string;
  shiftId: string;
  userId?: string;
  studentId?: string;
  status: 'PENDING' | 'PRESENT' | 'ABSENT' | 'LATE';
  checkInTime?: string;
  checkOutTime?: string;
  verifiedBy?: string;
  observations?: string;
  student?: {
    id: string;
    name: string;
    lastName: string;
    categoryId?: string;
    category?: { id: string; name: string };
  };
  user?: {
    id: string;
    name: string;
    lastName?: string;
    email?: string;
  };
  shift?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAttendanceDto {
  studentId: string;
  shiftId: string;
  status: 'PENDING' | 'PRESENT' | 'ABSENT' | 'LATE';
  checkInTime?: string;
  observations?: string;
  verifiedBy?: string;
}

export interface UpdateAttendanceDto extends Partial<CreateAttendanceDto> {
  checkOutTime?: string;
}

export interface BatchAttendanceDto {
  shiftId: string;
  records: Array<{
    studentId: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE';
    observations?: string;
  }>;
}

const attendancesApi = {
  getAll: (): Promise<Attendance[]> => api.get('/attendances'),
  getByDate: (date: string): Promise<Attendance[]> =>
    api.get(`/attendances?date=${date}`),
  getByDateAndStudent: (
    date: string,
    studentId: string,
  ): Promise<Attendance | null> =>
    api.get(`/attendances?date=${date}&studentId=${studentId}`),
  create: (data: CreateAttendanceDto): Promise<Attendance> =>
    api.post('/attendances', data),
  saveBatch: (data: BatchAttendanceDto): Promise<{ saved: number }> =>
    api.post('/attendances/batch', data),
  update: (id: string, data: UpdateAttendanceDto): Promise<Attendance> =>
    api.patch(`/attendances/${id}`, data),
  delete: (id: string): Promise<void> => api.delete(`/attendances/${id}`),
};

export default attendancesApi;
