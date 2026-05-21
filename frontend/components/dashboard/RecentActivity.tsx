// components/dashboard/RecentActivity.tsx
'use client';

import { motion } from 'framer-motion';
import { 
  CreditCardIcon, 
  UserPlusIcon, 
  CalendarIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

interface Activity {
  id: string;
  type: 'student' | 'payment' | 'enrollment' | 'attendance';
  message: string;
  user: string;
  createdAt: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const icons = {
  student: <UserPlusIcon className="w-5 h-5 text-green-500" />,
  payment: <CreditCardIcon className="w-5 h-5 text-blue-500" />,
  enrollment: <CalendarIcon className="w-5 h-5 text-purple-500" />,
  attendance: <CheckCircleIcon className="w-5 h-5 text-yellow-500" />,
};

export function RecentActivity({ activities }: RecentActivityProps) {
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Hace unos minutos';
    if (hours < 24) return `Hace ${hours} horas`;
    return `Hace ${Math.floor(hours / 24)} días`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Actividad Reciente
      </h3>
      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No hay actividad reciente
          </p>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                {icons[activity.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">
                  {activity.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {activity.user} • {formatDate(activity.createdAt)}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}