import api from '@/lib/axios';

export interface DashboardReport {
  summary: {
    totalStudents: number;
    activeStudents: number;
    totalCategories: number;
    totalShifts: number;
    pendingPayments: number;
    monthlyRevenue: number;
    monthlyPaidCount: number;
    monthlyAttendances: number;
  };
  studentsByCategory: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
  }>;
  paymentsByStatus: Array<{ status: string; count: number }>;
}

export type ReportRow = Record<string, unknown>;

const reportsApi = {
  getDashboard: (): Promise<DashboardReport> => api.get('/reports/dashboard'),
  exportPayments: (): Promise<ReportRow[]> =>
    api.get('/reports/export/payments'),
  exportTeachers: (): Promise<ReportRow[]> =>
    api.get('/reports/export/teachers'),
  exportCategoriesStudents: (categoryId?: string): Promise<ReportRow[]> =>
    api.get(
      `/reports/export/categories-students${categoryId ? `?categoryId=${categoryId}` : ''}`,
    ),
  exportParents: (search?: string): Promise<ReportRow[]> =>
    api.get(
      `/reports/export/parents${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    ),
};

export default reportsApi;
