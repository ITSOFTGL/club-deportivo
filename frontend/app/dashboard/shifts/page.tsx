// app/dashboard/shifts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useShiftsStore } from '@/store/shiftsStore';
import { ShiftFormModal } from '@/components/shifts/ShiftFormModal';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { Shift, CreateShiftDto } from '@/lib/api/shifts';

const shiftTypeLabels: Record<string, string> = {
  MORNING: 'Mañana',
  AFTERNOON: 'Tarde',
  EVENING: 'Noche',
};

const shiftTypeColors: Record<string, string> = {
  MORNING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  AFTERNOON: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  EVENING: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

export default function ShiftsPage() {
  const { shifts, loading, searchTerm, setSearchTerm, fetchShifts, createShift, updateShift, deleteShift } = useShiftsStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [deletingShift, setDeletingShift] = useState<Shift | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchShifts();
  }, []);

  const filteredShifts = shifts.filter((shift) => {
    const search = searchTerm.toLowerCase();
    return (
      shift.name?.toLowerCase().includes(search) ||
      shift.type?.toLowerCase().includes(search)
    );
  });

  const stats = [
    { label: 'Total Turnos', value: shifts.length, icon: ClockIcon, color: 'from-blue-500 to-blue-600' },
    { label: 'Activos', value: shifts.filter(s => s.isActive).length, icon: ClockIcon, color: 'from-green-500 to-green-600' },
    { label: 'Inactivos', value: shifts.filter(s => !s.isActive).length, icon: ClockIcon, color: 'from-red-500 to-red-600' },
  ];

  const handleSubmit = async (data: CreateShiftDto) => {
    setFormLoading(true);
    let success: boolean;
    if (editingShift) {
      success = await updateShift(editingShift.id, data);
    } else {
      success = await createShift(data);
    }
    setFormLoading(false);
    if (success) {
      setIsModalOpen(false);
      setEditingShift(null);
    }
    return success;
  };

  const handleDelete = async () => {
    if (!deletingShift) return;
    setFormLoading(true);
    const success = await deleteShift(deletingShift.id);
    setFormLoading(false);
    if (success) {
      setIsDeleteModalOpen(false);
      setDeletingShift(null);
    }
  };

  const handleEdit = (shift: Shift) => {
    setEditingShift(shift);
    setIsModalOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Turnos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona los horarios de entrenamiento</p>
        </div>
        <button
          onClick={() => {
            setEditingShift(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg hover:shadow-lg transition-all shadow-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Turno
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

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o tipo de turno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-40 animate-pulse" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-5 bg-gray-200 rounded w-16 mx-auto animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-16 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    {searchTerm ? 'No se encontraron turnos' : 'No hay turnos registrados'}
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredShifts.map((shift, index) => (
                    <motion.tr
                      key={shift.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-[#7c0613] to-[#4a030b] rounded-lg flex items-center justify-center">
                            <ClockIcon className="w-5 h-5 text-white" />
                          </div>
                          <p className="font-medium text-gray-900">{shift.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${shiftTypeColors[shift.type]}`}>
                          {shiftTypeLabels[shift.type]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{shift.startTime} - {shift.endTime}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          shift.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {shift.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(shift)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingShift(shift);
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
      <ShiftFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingShift(null);
        }}
        shift={editingShift}
        onSubmit={handleSubmit}
        loading={formLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingShift(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Turno"
        message={`¿Estás seguro de eliminar el turno "${deletingShift?.name}"? Esta acción no se puede deshacer.`}
        loading={formLoading}
      />
    </motion.div>
  );
}