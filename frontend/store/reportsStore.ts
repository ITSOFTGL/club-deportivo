import { create } from 'zustand';
import reportsApi, { DashboardReport } from '@/lib/api/reports';
import toast from 'react-hot-toast';

interface ReportsState {
  dashboard: DashboardReport | null;
  loading: boolean;
  fetchDashboard: () => Promise<void>;
}

export const useReportsStore = create<ReportsState>((set) => ({
  dashboard: null,
  loading: false,

  fetchDashboard: async () => {
    set({ loading: true });
    try {
      const data = await reportsApi.getDashboard();
      set({ dashboard: data, loading: false });
    } catch {
      toast.error('Error al cargar reportes');
      set({ dashboard: null, loading: false });
    }
  },
}));
