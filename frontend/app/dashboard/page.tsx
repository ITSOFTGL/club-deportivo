// app/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { 
  UsersIcon, 
  CurrencyDollarIcon, 
  AcademicCapIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { useDashboardStore } from '@/store/dashboardStore';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';

// Configuración por rol
const roleConfig = {
  SUPER_ADMIN: {
    stats: ['students', 'payments', 'categories', 'teachers'],
    showChart: true,
    showActivity: true,
  },
  ADMIN: {
    stats: ['students', 'payments', 'categories'],
    showChart: true,
    showActivity: true,
  },
  TEACHER: {
    stats: ['students', 'attendance'],
    showChart: false,
    showActivity: true,
  },
  COLLECTOR: {
    stats: ['payments', 'pending'],
    showChart: true,
    showActivity: false,
  },
  PARENT: {
    stats: ['children', 'payments'],
    showChart: false,
    showActivity: true,
  },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { stats, loading, fetchStats } = useDashboardStore();
  const role = session?.user?.role || 'PARENT';
  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.PARENT;

  useEffect(() => {
    fetchStats();
  }, []);

  // Definir las tarjetas según el rol
  const getStatsCards = () => {
    const cards = [];
    
    if (config.stats.includes('students')) {
      cards.push({
        title: 'Total Alumnos',
        value: stats.totalStudents,
        icon: UsersIcon,
        color: 'from-blue-500 to-blue-600',
      });
    }
    
    if (config.stats.includes('payments')) {
      cards.push({
        title: 'Ingresos Mensuales',
        value: stats.totalPayments,
        icon: CurrencyDollarIcon,
        color: 'from-green-500 to-green-600',
        prefix: 'Bs. ',
      });
    }
    
    if (config.stats.includes('categories')) {
      cards.push({
        title: 'Categorías Activas',
        value: stats.totalCategories,
        icon: AcademicCapIcon,
        color: 'from-purple-500 to-purple-600',
      });
    }
    
    if (config.stats.includes('teachers')) {
      cards.push({
        title: 'Profesores',
        value: stats.totalTeachers,
        icon: UserGroupIcon,
        color: 'from-orange-500 to-orange-600',
      });
    }
    
    return cards;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7c0613]"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Bienvenido, {session?.user?.name || session?.user?.email}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatsCards().map((stat, index) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts Section */}
      {config.showChart && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={stats.monthlyRevenue} />
          
          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Resumen Rápido
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Total Recaudado</span>
                <span className="text-2xl font-bold text-green-600">
                  Bs. {stats.monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Alumnos por Categoría</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.totalCategories} categorías
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-gray-600 dark:text-gray-300">Profesores Activos</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.totalTeachers}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {config.showActivity && (
        <RecentActivity activities={stats.recentActivities} />
      )}
    </motion.div>
  );
}