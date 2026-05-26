// app/dashboard/students/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserGroupIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useStudentsStore } from '@/store/studentsStore';
import { useBranchesStore } from '@/store/branchesStore';
import { useCategoriesStore } from '@/store/categoriesStore';
import { useUsersStore } from '@/store/usersStore';
import { StudentFormModal } from '@/components/students/StudentFormModal';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';

interface Parent {
  id: string;
  name: string;
  lastName: string;
  email: string;
}

export default function StudentsPage() {
  const { students, loading, searchTerm, setSearchTerm, fetchStudents, createStudent, updateStudent, deleteStudent } = useStudentsStore();
  const { branches, fetchBranches } = useBranchesStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const { users, fetchUsers } = useUsersStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [deletingStudent, setDeletingStudent] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchBranches();
    fetchCategories();
    fetchUsers();
  }, []);

  const parents: Parent[] = users
    .filter(u => u.role === 'PARENT')
    .map(u => ({
      id: u.id,
      name: u.name,
      lastName: u.lastName || '',
      email: u.email,
    }));

  const filteredStudents = students.filter((student) => {
    const search = searchTerm.toLowerCase();
    return (
      student.name?.toLowerCase().includes(search) ||
      student.lastName?.toLowerCase().includes(search) ||
      student.documentId?.includes(search)
    );
  });

  const handleSubmit = async (data: any) => {
    setFormLoading(true);
    let success: boolean;
    if (editingStudent) {
      success = await updateStudent(editingStudent.id, data);
    } else {
      success = await createStudent(data);
    }
    setFormLoading(false);
    if (success) {
      setIsModalOpen(false);
      setEditingStudent(null);
    }
    return success;
  };

  const handleDelete = async () => {
    if (!deletingStudent) return;
    setFormLoading(true);
    const success = await deleteStudent(deletingStudent.id);
    setFormLoading(false);
    if (success) {
      setIsDeleteModalOpen(false);
      setDeletingStudent(null);
    }
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES');
  };

  const getParentName = (parentId: string) => {
    const parent = parents.find(p => p.id === parentId);
    return parent ? `${parent.name} ${parent.lastName}` : 'No asignado';
  };

  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || 'No asignada';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'No asignada';
  };

  const activeCount = students.filter(s => s.status === 'ACTIVE').length;
  const inactiveCount = students.filter(s => s.status === 'INACTIVE').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alumnos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona los alumnos del club</p>
        </div>
        <button
          onClick={() => {
            setEditingStudent(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg hover:shadow-lg transition-all shadow-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Alumno
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Total Alumnos</p>
              <p className="text-2xl font-bold mt-1">{students.length}</p>
            </div>
            <UserGroupIcon className="w-10 h-10 text-white/30" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Activos</p>
              <p className="text-2xl font-bold mt-1">{activeCount}</p>
            </div>
            <UserGroupIcon className="w-10 h-10 text-white/30" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Inactivos</p>
              <p className="text-2xl font-bold mt-1">{inactiveCount}</p>
            </div>
            <UserGroupIcon className="w-10 h-10 text-white/30" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Categorías</p>
              <p className="text-2xl font-bold mt-1">{categories.length}</p>
            </div>
            <AcademicCapIcon className="w-10 h-10 text-white/30" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o documento..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Nac.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apoderado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sucursal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mensualidad</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
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
                    <td className="px-6 py-4 text-center"><div className="h-5 bg-gray-200 rounded w-16 mx-auto animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-16 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    {searchTerm ? 'No se encontraron alumnos' : 'No hay alumnos registrados'}
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredStudents.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-[#7c0613] to-[#4a030b] rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {student.name?.charAt(0)}{student.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.name} {student.lastName}</p>
                            {student.documentId && (
                              <p className="text-xs text-gray-500 mt-0.5">Doc: {student.documentId}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {formatDate(student.birthDate)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 flex items-center">
                          <UserIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {getParentName(student.parentId)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 flex items-center">
                          <BuildingOfficeIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {getBranchName(student.branchId)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 flex items-center">
                          <AcademicCapIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {getCategoryName(student.categoryId)}
                          {(student as { discountPercent?: number }).discountPercent
                            ? ` (-${(student as { discountPercent?: number }).discountPercent}%)`
                            : ''}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {(student as { membershipPaidUntil?: string }).membershipPaidUntil ? (
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${
                              (student as { membershipActive?: boolean }).membershipActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {(student as { membershipActive?: boolean }).membershipActive
                              ? 'Al día hasta '
                              : 'Venció '}
                            {formatDate(
                              (student as { membershipPaidUntil: string }).membershipPaidUntil,
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                            Sin pago registrado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {student.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                        </span>
                       </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(student)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingStudent(student);
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

      {/* Modals */}
      <StudentFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStudent(null);
        }}
        student={editingStudent}
        branches={branches}
        categories={categories}
        parents={parents}
        onSubmit={handleSubmit}
        loading={formLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingStudent(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Alumno"
        message={`¿Estás seguro de eliminar a "${deletingStudent?.name} ${deletingStudent?.lastName}"? Esta acción no se puede deshacer.`}
        loading={formLoading}
      />
    </motion.div>
  );
}