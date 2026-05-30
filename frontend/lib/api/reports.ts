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

export interface ReportFilters {
  branchId?: string;
  categoryId?: string;
  from?: string;
  to?: string;
  search?: string;
}

function queryString(params: ReportFilters) {
  const q = new URLSearchParams();
  if (params.branchId) q.set('branchId', params.branchId);
  if (params.categoryId) q.set('categoryId', params.categoryId);
  if (params.from) q.set('from', params.from);
  if (params.to) q.set('to', params.to);
  if (params.search) q.set('search', params.search);
  const s = q.toString();
  return s ? `?${s}` : '';
}

const reportsApi = {
  getDashboard: (): Promise<DashboardReport> => api.get('/reports/dashboard'),
  exportPayments: (filters?: ReportFilters): Promise<ReportRow[]> =>
    api.get(`/reports/export/payments${queryString(filters ?? {})}`),
  exportTeachers: (): Promise<ReportRow[]> =>
    api.get('/reports/export/teachers'),
  exportCategoriesStudents: (filters?: ReportFilters): Promise<ReportRow[]> =>
    api.get(
      `/reports/export/categories-students${queryString(filters ?? {})}`,
    ),
  exportParents: (filters?: ReportFilters): Promise<ReportRow[]> =>
    api.get(`/reports/export/parents${queryString(filters ?? {})}`),
  exportMembership: (filters?: ReportFilters): Promise<ReportRow[]> =>
    api.get(`/reports/export/membership${queryString(filters ?? {})}`),
};

export default reportsApi;
