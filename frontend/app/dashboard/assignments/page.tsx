// app/dashboard/assignments/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserGroupIcon,
  UserIcon,
  AcademicCapIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useTeacherAssignmentsStore } from '@/store/teacherAssignmentsStore';
import { useUsersStore } from '@/store/usersStore';
import categoryShiftsApi, {
  CategoryShift,
  formatCategoryShiftLabel,
} from '@/lib/api/category-shifts';
import { TeacherAssignmentFormModal } from '@/components/teacher-assignments/TeacherAssignmentFormModal';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { CreateTeacherAssignmentDto } from '@/lib/api/teacher-assignments';

// Definir tipos locales
interface Teacher {
  id: string;
  name: string;
  lastName: string;
  email: string;
}

export default function AssignmentsPage() {
  const { assignments, loading, searchTerm, setSearchTerm, fetchAssignments, createAssignment, updateAssignment, deleteAssignment } = useTeacherAssignmentsStore();
  const { users, fetchUsers } = useUsersStore();
  const [categoryShifts, setCategoryShifts] = useState<CategoryShift[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [deletingAssignment, setDeletingAssignment] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchAssignments();
    fetchUsers();
    categoryShiftsApi.getAll().then((data) => {
      setCategoryShifts(Array.isArray(data) ? data : []);
    }).catch(() => setCategoryShifts([]));
  }, []);

  const teachers: Teacher[] = users
    .filter(u => u.role === 'TEACHER')
    .map(u => ({
      id: u.id,
      name: u.name,
      lastName: u.lastName || '',
      email: u.email,
    }));

  const filteredAssignments = assignments.filter((assignment) => {
    const search = searchTerm.toLowerCase();
    const teacherName = `${assignment.teacher?.name || ''} ${assignment.teacher?.lastName || ''}`.toLowerCase();
    const categoryShiftName = assignment.categoryShift?.name?.toLowerCase() || '';
    return teacherName.includes(search) || categoryShiftName.includes(search);
  });

  const stats = [
    { label: 'Total Asignaciones', value: assignments.length, icon: UserGroupIcon, color: 'from-blue-500 to-blue-600' },
    { label: 'Activas', value: assignments.filter(a => a.isActive).length, icon: UserGroupIcon, color: 'from-green-500 to-green-600' },
    { label: 'Inactivas', value: assignments.filter(a => !a.isActive).length, icon: UserGroupIcon, color: 'from-red-500 to-red-600' },
  ];

  const handleSubmit = async (data: CreateTeacherAssignmentDto) => {
    setFormLoading(true);
    let success: boolean;
    if (editingAssignment) {
      success = await updateAssignment(editingAssignment.id, data);
    } else {
      success = await createAssignment(data);
    }
    setFormLoading(false);
    if (success) {
      setIsModalOpen(false);
      setEditingAssignment(null);
    }
    return success;
  };

  const handleDelete = async () => {
    if (!deletingAssignment) return;
    setFormLoading(true);
    const success = await deleteAssignment(deletingAssignment.id);
    setFormLoading(false);
    if (success) {
      setIsDeleteModalOpen(false);
      setDeletingAssignment(null);
    }
  };

  const handleEdit = (assignment: any) => {
    setEditingAssignment(assignment);
    setIsModalOpen(true);
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      HEAD_COACH: 'Entrenador Principal',
      ASSISTANT_COACH: 'Entrenador Asistente',
      ASSISTANT: 'Asistente',
    };
    return roles[role] || role;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Asignaciones</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Asigna profesores a categorías y turnos</p>
        </div>
        <button
          onClick={() => {
            setEditingAssignment(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg hover:shadow-lg transition-all shadow-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nueva Asignación
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
            placeholder="Buscar por profesor o categoría..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profesor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo (sucursal + horario)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-40 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-5 bg-gray-200 rounded w-8 mx-auto animate-pulse" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-5 bg-gray-200 rounded w-16 mx-auto animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-16 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    {searchTerm ? 'No se encontraron asignaciones' : 'No hay asignaciones registradas'}
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredAssignments.map((assignment, index) => (
                    <motion.tr
                      key={assignment.id}
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
                          <div>
                            <p className="font-medium text-gray-900">
                              {assignment.teacher?.name} {assignment.teacher?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{assignment.teacher?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <AcademicCapIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {assignment.categoryShift
                              ? formatCategoryShiftLabel(
                                  assignment.categoryShift as CategoryShift,
                                )
                              : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          {getRoleLabel(assignment.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {assignment.isLeadTeacher && (
                          <StarIcon className="w-5 h-5 text-yellow-500 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          assignment.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {assignment.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(assignment)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingAssignment(assignment);
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
      <TeacherAssignmentFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAssignment(null);
        }}
        assignment={editingAssignment}
        teachers={teachers}
        categoryShifts={categoryShifts}
        onSubmit={handleSubmit}
        loading={formLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingAssignment(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Asignación"
        message={`¿Estás seguro de eliminar esta asignación? Esta acción no se puede deshacer.`}
        loading={formLoading}
      />
    </motion.div>
  );
}