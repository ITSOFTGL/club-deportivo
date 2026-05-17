'use client';

import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { data: session } = useSession();

  const stats = [
    { title: 'Total Alumnos', value: '0', change: '+0%', color: 'bg-blue-500' },
    { title: 'Ingresos Mensuales', value: 'S/ 0', change: '+0%', color: 'bg-green-500' },
    { title: 'Categorías Activas', value: '0', change: '+0', color: 'bg-purple-500' },
    { title: 'Eventos Próximos', value: '0', change: '0', color: 'bg-yellow-500' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Bienvenido, {session?.user?.name || session?.user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg opacity-20`} />
            </div>
            <p className="text-sm text-green-600 mt-2">{stat.change} vs mes anterior</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bienvenido al Sistema</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Este es el panel de control de Club Deportivo. Aquí podrás gestionar todas las áreas del club.
        </p>
      </div>
    </motion.div>
  );
}