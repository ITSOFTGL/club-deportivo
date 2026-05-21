// app/dashboard/attendances/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useAttendancesStore } from '@/store/attendancesStore';
import { useStudentsStore } from '@/store/studentsStore';
import { useShiftsStore } from '@/store/shiftsStore';
import { AttendanceFormModal } from '@/components/attendances/AttendanceFormModal';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { CreateAttendanceDto } from '@/lib/api/attendances';

const statusColors: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ABSENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  LATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PENDING: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const statusLabels: Record<string, string> = {
  PRESENT: 'Presente',
  ABSENT: 'Ausente',
  LATE: 'Tardanza',
  PENDING: 'Pendiente',
};

const statusIcons: Record<string, string> = {
  PRESENT: '✅',
  ABSENT: '❌',
  LATE: '⏰',
  PENDING: '⏳',
};

export default function AttendancesPage() {
  const { attendances, loading, searchTerm, selectedDate, selectedShiftId, setSearchTerm, setSelectedDate, setSelectedShiftId, fetchAttendances, createAttendance, updateAttendance, deleteAttendance } = useAttendancesStore();
  const { students, fetchStudents } = useStudentsStore();
  const { shifts, fetchShifts } = useShiftsStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<any>(null);
  const [deletingAttendance, setDeletingAttendance] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchAttendances();
    fetchStudents();
    fetchShifts();
  }, []);

  const filteredAttendances = attendances.filter((attendance) => {
    const search = searchTerm.toLowerCase();
    const studentName = `${attendance.student?.name || ''} ${attendance.student?.lastName || ''}`.toLowerCase();
    return studentName.includes(search);
  });

  const stats = [
    { label: 'Total Asistencias', value: attendances.length, icon: CheckCircleIcon, color: 'from-blue-500 to-blue-600' },
    { label: 'Presentes', value: attendances.filter(a => a.status === 'PRESENT').length, icon: CheckCircleIcon, color: 'from-green-500 to-green-600' },
    { label: 'Ausentes', value: attendances.filter(a => a.status === 'ABSENT').length, icon: CheckCircleIcon, color: 'from-red-500 to-red-600' },
  ];

  const handleSubmit = async (data: CreateAttendanceDto) => {
    setFormLoading(true);
    let success: boolean;
    if (editingAttendance) {
      success = await updateAttendance(editingAttendance.id, data);
    } else {
      success = await createAttendance(data);
    }
    setFormLoading(false);
    if (success) {
      setIsModalOpen(false);
      setEditingAttendance(null);
    }
    return success;
  };

  const handleDelete = async () => {
    if (!deletingAttendance) return;
    setFormLoading(true);
    const success = await deleteAttendance(deletingAttendance.id);
    setFormLoading(false);
    if (success) {
      setIsDeleteModalOpen(false);
      setDeletingAttendance(null);
    }
  };

  const handleEdit = (attendance: any) => {
    setEditingAttendance(attendance);
    setIsModalOpen(true);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES');
  };

  const formatTime = (time: string) => {
    if (!time) return 'N/A';
    return time;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Asistencias</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Registra y controla las asistencias de los alumnos</p>
        </div>
        <button
          onClick={() => {
            setEditingAttendance(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg hover:shadow-lg transition-all shadow-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Registrar Asistencia
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-r ${stat.color} rounded-xl p-4 text-white shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className="w-10 h-10 text-white/30" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#7c0613]"
            />
          </div>
          <div className="relative">
            <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedShiftId}
              onChange={(e) => setSelectedShiftId(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#7c0613]"
            >
              <option value="">Todos los turnos</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por alumno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#7c0613]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-16 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <CheckCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    {searchTerm ? 'No se encontraron asistencias' : 'No hay asistencias registradas'}
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredAttendances.map((attendance, index) => (
                    <motion.tr
                      key={attendance.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-[#7c0613] to-[#4a030b] rounded-lg flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-white" />
                          </div>
                          <p className="font-medium text-gray-900">
                            {attendance.student?.name} {attendance.student?.lastName}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{attendance.shift?.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{formatDate(attendance.createdAt || new Date().toISOString())}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${statusColors[attendance.status]}`}>
                          {statusIcons[attendance.status]} {statusLabels[attendance.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{formatTime(attendance.checkInTime || '')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500 truncate max-w-xs">{attendance.observations || '-'}</p>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(attendance)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingAttendance(attendance);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AttendanceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAttendance(null);
        }}
        attendance={editingAttendance}
        students={students.map(s => ({ id: s.id, name: s.name, lastName: s.lastName }))}
        shifts={shifts}
        onSubmit={handleSubmit}
        loading={formLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingAttendance(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Asistencia"
        message={`¿Estás seguro de eliminar esta asistencia? Esta acción no se puede deshacer.`}
        loading={formLoading}
      />
    </motion.div>
  );
}