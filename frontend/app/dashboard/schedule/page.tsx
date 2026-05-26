'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { ClockIcon, AcademicCapIcon, BuildingOfficeIcon, StarIcon } from '@heroicons/react/24/outline';
import { fetchTeacherAssignments, parseTeacherContext } from '@/lib/api/teacher';
import toast from 'react-hot-toast';

export default function SchedulePage() {
  const { data: session } = useSession();
  const [schedule, setSchedule] = useState<
    Array<{
      id: string;
      categoryName: string;
      shiftName: string;
      branchName: string;
      role: string;
      isLeadTeacher: boolean;
      startTime?: string;
      endTime?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!session?.user?.id) return;
      setLoading(true);
      try {
        const assignments = await fetchTeacherAssignments(session.user.id);
        const ctx = parseTeacherContext(
          Array.isArray(assignments) ? assignments : [],
        );
        setSchedule(ctx.schedule);
      } catch {
        toast.error('Error al cargar horarios');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [session?.user?.id]);

  const formatTime = (t?: string) => (t ? t.substring(0, 5) : '--:--');

  const roleLabel: Record<string, string> = {
    HEAD_COACH: 'Entrenador principal',
    ASSISTANT_COACH: 'Asistente',
    ASSISTANT: 'Asistente',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Horarios</h1>
        <p className="text-gray-500 mt-1">
          Clases asignadas según categoría y turno
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#7c0613]" />
        </div>
      ) : schedule.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center text-gray-500">
          <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          No tienes horarios asignados
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedule.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-[#7c0613]"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                    <AcademicCapIcon className="w-5 h-5 text-[#7c0613]" />
                    {item.categoryName}
                  </p>
                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    {item.shiftName} · {formatTime(item.startTime)} -{' '}
                    {formatTime(item.endTime)}
                  </p>
                </div>
                {item.isLeadTeacher && (
                  <StarIcon className="w-6 h-6 text-yellow-500" title="Profesor principal" />
                )}
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <BuildingOfficeIcon className="w-4 h-4" />
                {item.branchName}
              </p>
              <span className="inline-block mt-3 px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                {roleLabel[item.role] ?? item.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
