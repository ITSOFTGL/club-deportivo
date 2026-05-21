// components/dashboard/StatsCard.tsx
'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  suffix?: string;
  prefix?: string;
}

export function StatsCard({ title, value, icon: Icon, color, suffix = '', prefix = '' }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-r ${color} rounded-xl p-6 text-white shadow-lg`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">
            {prefix}{value.toLocaleString()}{suffix}
          </p>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}