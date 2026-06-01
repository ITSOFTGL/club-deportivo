// store/dashboardStore.ts
import { create } from 'zustand';
import api from '@/lib/axios';
import { USERS_API_BASE } from '@/lib/api/users';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalStudents: number;
  totalPayments: number;
  totalCategories: number;
  totalTeachers: number;
  recentActivities: Activity[];
  monthlyRevenue: MonthlyRevenue[];
}

interface Activity {
  id: string;
  type: 'student' | 'payment' | 'enrollment' | 'attendance';
  message: string;
  user: string;
  createdAt: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface DashboardState {
  stats: DashboardStats;
  loading: boolean;
  fetchStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: {
    totalStudents: 0,
    totalPayments: 0,
    totalCategories: 0,
    totalTeachers: 0,
    recentActivities: [],
    monthlyRevenue: [],
  },
  loading: false,

  fetchStats: async () => {
    set({ loading: true });
    try {
      // Obtener datos en paralelo
      const [students, categories, users, payments] = await Promise.all([
        api.get('/students').catch(() => ({ data: [] })),
        api.get('/categories').catch(() => ({ data: [] })),
        api.get(USERS_API_BASE).catch(() => []),
        api.get('/payments').catch(() => ({ data: [] })),
      ]);

      const studentsData = Array.isArray(students) ? students : students?.data || [];
      const categoriesData = Array.isArray(categories) ? categories : categories?.data || [];
      const usersData = Array.isArray(users) ? users : users?.data || [];
      const paymentsData = Array.isArray(payments) ? payments : payments?.data || [];

      // Calcular ingresos mensuales (últimos 6 meses)
      const monthlyRevenue = calculateMonthlyRevenue(paymentsData);
      
      // Generar actividades recientes
      const recentActivities = generateRecentActivities(paymentsData, studentsData);

      set({
        stats: {
          totalStudents: studentsData.length,
          totalPayments: paymentsData.filter((p: any) => p.status === 'PAID').length,
          totalCategories: categoriesData.length,
          totalTeachers: usersData.filter((u: any) => u.role === 'TEACHER').length,
          recentActivities,
          monthlyRevenue,
        },
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast.error('Error al cargar estadísticas');
      set({ loading: false });
    }
  },
}));

function calculateMonthlyRevenue(payments: any[]) {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const revenue = new Array(6).fill(0);
  const now = new Date();
  
  payments.filter((p: any) => p.status === 'PAID').forEach((payment: any) => {
    const date = new Date(payment.createdAt);
    const monthDiff = (now.getMonth() + 12 - date.getMonth()) % 12;
    if (monthDiff < 6) {
      revenue[5 - monthDiff] += payment.amount || 0;
    }
  });
  
  const currentMonth = now.getMonth();
  return revenue.map((value, i) => ({
    month: months[(currentMonth - 5 + i + 12) % 12],
    revenue: value,
  }));
}

function generateRecentActivities(payments: any[], students: any[]) {
  const activities: Activity[] = [];
  
  // Últimos pagos
  payments.slice(0, 3).forEach((payment: any) => {
    activities.push({
      id: payment.id,
      type: 'payment',
      message: `Pago registrado por Bs. ${payment.amount || 0}`,
      user: payment.userEmail || 'Usuario',
      createdAt: payment.createdAt,
    });
  });
  
  // Últimos alumnos
  students.slice(0, 3).forEach((student: any) => {
    activities.push({
      id: student.id,
      type: 'student',
      message: `Nuevo alumno registrado: ${student.name} ${student.lastName || ''}`,
      user: 'Sistema',
      createdAt: student.createdAt,
    });
  });
  
  // Ordenar por fecha (más reciente primero)
  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return activities.slice(0, 5);
}