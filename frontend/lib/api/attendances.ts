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
    branchId?: string;
    category?: { id: string; name: string };
    branch?: { id: string; name: string };
  };
  user?: {
    id: string;
    name: string;
    lastName?: string;
    email?: string;
  };
  verifier?: {
    id: string;
    name: string;
    lastName?: string;
    email?: string;
  } | null;
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

export interface MonthlyAttendanceReport {
  year: number;
  month: number;
  listDays: Array<{ date: string; shiftName: string; recordsCount: number }>;
  listDates: string[];
  students: Array<{
    studentId: string;
    name: string;
    lastName: string;
    category?: string;
    branch?: string;
    profilePhotoUrl?: string | null;
    byDay: Record<string, string>;
    absences: string[];
  }>;
}

export interface AbsenceSearchResult {
  from: string;
  to: string;
  results: Array<{
    studentId: string;
    name: string;
    lastName: string;
    category?: string;
    branch?: string;
    profilePhotoUrl?: string | null;
    parentPhone?: string | null;
    parentName?: string | null;
    missed: Array<{ date: string; status: string; shiftName: string }>;
    missedCount: number;
  }>;
}

const attendancesApi = {
  getAll: (): Promise<Attendance[]> => api.get('/attendances'),
  getForParent: (params?: {
    studentId?: string;
    from?: string;
    to?: string;
  }): Promise<Attendance[]> => {
    const q = new URLSearchParams();
    if (params?.studentId) q.set('studentId', params.studentId);
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    const qs = q.toString();
    return api.get(`/attendances${qs ? `?${qs}` : ''}`);
  },
  getMonthlyReport: (params: {
    year: number;
    month: number;
    categoryId?: string;
    branchId?: string;
  }): Promise<MonthlyAttendanceReport> => {
    const q = new URLSearchParams({
      year: String(params.year),
      month: String(params.month),
    });
    if (params.categoryId) q.set('categoryId', params.categoryId);
    if (params.branchId) q.set('branchId', params.branchId);
    return api.get(`/attendances/report/monthly?${q}`);
  },
  searchAbsences: (params: {
    search?: string;
    from: string;
    to: string;
    categoryId?: string;
    branchId?: string;
  }): Promise<AbsenceSearchResult> => {
    const q = new URLSearchParams({
      from: params.from,
      to: params.to,
    });
    if (params.search) q.set('search', params.search);
    if (params.categoryId) q.set('categoryId', params.categoryId);
    if (params.branchId) q.set('branchId', params.branchId);
    return api.get(`/attendances/report/absences?${q}`);
  },
  getByDate: (date: string, teacherId?: string): Promise<Attendance[]> =>
    api.get(
      `/attendances?date=${date}${teacherId ? `&teacherId=${teacherId}` : ''}`,
    ),
  getByDateAndShift: (date: string, shiftId: string): Promise<Attendance[]> =>
    api.get(`/attendances?date=${date}&shiftId=${shiftId}`),
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
