// app/dashboard/guardians/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { TeacherGuardiansView } from '@/components/guardians/TeacherGuardiansView';
import { canDeleteRecords } from '@/lib/permissions';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  IdentificationIcon,
  UserIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { useGuardiansStore } from '@/store/guardiansStore';
import { useStudentsStore } from '@/store/studentsStore';
import { GuardianFormModal } from '@/components/guardians/GuardianFormModal';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { Guardian, CreateGuardianDto } from '@/lib/api/guardians';

const relationshipLabels: Record<string, string> = {
  PADRE: 'Padre',
  MADRE: 'Madre',
  TUTOR: 'Tutor',
  ABUELO: 'Abuelo(a)',
  OTRO: 'Otro',
};

const relationshipColors: Record<string, string> = {
  PADRE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  MADRE: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  TUTOR: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ABUELO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  OTRO: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export default function GuardiansPage() {
  const { data: session } = useSession();
  const isTeacher = session?.user?.role === 'TEACHER';

  if (isTeacher) {
    return <TeacherGuardiansView />;
  }

  return <GuardiansAdminView />;
}

function GuardiansAdminView() {
  const { data: session } = useSession();
  const allowDelete = canDeleteRecords(session?.user?.role);
  const { guardians, loading, searchTerm, setSearchTerm, fetchGuardians, createGuardian, updateGuardian, deleteGuardian } = useGuardiansStore();
  const { students, fetchStudents } = useStudentsStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [deletingGuardian, setDeletingGuardian] = useState<Guardian | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchGuardians();
    fetchStudents();
  }, []);

  const filteredGuardians = guardians.filter((guardian) => {
    const search = searchTerm.toLowerCase();
    return (
      guardian.name?.toLowerCase().includes(search) ||
      guardian.lastName?.toLowerCase().includes(search) ||
      guardian.documentId?.includes(search) ||
      guardian.phone?.includes(search) ||
      guardian.email?.toLowerCase().includes(search)
    );
  });

  const stats = [
    { label: 'Total Apoderados', value: guardians.length, icon: UserGroupIcon, color: 'from-blue-500 to-blue-600' },
    { label: 'Activos', value: guardians.filter(g => g.isActive).length, icon: UserGroupIcon, color: 'from-green-500 to-green-600' },
    { label: 'Inactivos', value: guardians.filter(g => !g.isActive).length, icon: UserGroupIcon, color: 'from-red-500 to-red-600' },
  ];

  const handleSubmit = async (data: CreateGuardianDto) => {
    setFormLoading(true);
    let success: boolean;
    if (editingGuardian) {
      success = await updateGuardian(editingGuardian.id, data);
    } else {
      success = await createGuardian(data);
    }
    setFormLoading(false);
    if (success) {
      setIsModalOpen(false);
      setEditingGuardian(null);
    }
    return success;
  };

  const handleDelete = async () => {
    if (!deletingGuardian) return;
    setFormLoading(true);
    const success = await deleteGuardian(deletingGuardian.id);
    setFormLoading(false);
    if (success) {
      setIsDeleteModalOpen(false);
      setDeletingGuardian(null);
    }
  };

  const handleEdit = (guardian: Guardian) => {
    setEditingGuardian(guardian);
    setIsModalOpen(true);
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.name} ${student.lastName}` : 'No asignado';
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Apoderados</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona los apoderados de los alumnos</p>
        </div>
        <button
          onClick={() => {
            setEditingGuardian(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg hover:shadow-lg transition-all shadow-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Apoderado
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
            placeholder="Buscar por nombre, apellido, documento, teléfono o email..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apoderado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relación</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-40 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-5 bg-gray-200 rounded w-8 mx-auto animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-16 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : filteredGuardians.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    {searchTerm ? 'No se encontraron apoderados' : 'No hay apoderados registrados'}
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredGuardians.map((guardian, index) => (
                    <motion.tr
                      key={guardian.id}
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
                            <p className="font-medium text-gray-900">{guardian.name} {guardian.lastName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-600 flex items-center">
                            <PhoneIcon className="w-4 h-4 mr-1 text-gray-400" />
                            {guardian.phone}
                          </p>
                          {guardian.email && (
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <EnvelopeIcon className="w-3 h-3 mr-1" />
                              {guardian.email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 flex items-center">
                          <IdentificationIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {guardian.documentId}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">
                          {getStudentName(guardian.studentId)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${relationshipColors[guardian.relationship]}`}>
                          {relationshipLabels[guardian.relationship]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {guardian.isPrimary && (
                          <StarIcon className="w-5 h-5 text-yellow-500 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(guardian)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        {allowDelete && (
                        <button
                          onClick={() => {
                            setDeletingGuardian(guardian);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        )}
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
      <GuardianFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGuardian(null);
        }}
        guardian={editingGuardian}
        students={students.map(s => ({ id: s.id, name: s.name, lastName: s.lastName }))}
        onSubmit={handleSubmit}
        loading={formLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingGuardian(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Apoderado"
        message={`¿Estás seguro de eliminar a "${deletingGuardian?.name} ${deletingGuardian?.lastName}"? Esta acción no se puede deshacer.`}
        loading={formLoading}
      />
    </motion.div>
  );
}