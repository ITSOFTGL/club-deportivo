'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UsersIcon,
  EnvelopeIcon,
  PhoneIcon,
  KeyIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import { useUsersStore } from '@/store/usersStore';
import { UserFormModal } from '@/components/users/UserFormModal';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { User, CreateUserDto } from '@/lib/api/users';
import toast from 'react-hot-toast';
import { requirePassword } from '@/lib/utils/password';

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  TEACHER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  COLLECTOR: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  PARENT: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  TEACHER: 'Profesor',
  COLLECTOR: 'Cobrador',
  PARENT: 'Padre',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  INACTIVE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  PENDING: 'Pendiente',
};

export default function UsersPage() {
  const { data: session } = useSession();
  const canManage = ['SUPER_ADMIN', 'ADMIN'].includes(
    session?.user?.role ?? '',
  );

  const {
    users,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    changeRole,
    changeStatus,
    resetPassword,
  } = useUsersStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);

  useEffect(() => {
    if (canManage) fetchUsers();
  }, [canManage]);

  const filteredUsers = users.filter((user: User) => {
    const search = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.documentId?.includes(search) ||
      user.phone?.includes(search)
    );
  });

  const stats = [
    { label: 'Total Usuarios', value: users.length, icon: UsersIcon, color: 'from-blue-500 to-blue-600' },
    { label: 'Activos', value: users.filter((u: User) => u.status === 'ACTIVE').length, icon: UsersIcon, color: 'from-green-500 to-green-600' },
    { label: 'Inactivos', value: users.filter((u: User) => u.status === 'INACTIVE').length, icon: UsersIcon, color: 'from-red-500 to-red-600' },
  ];

  const handleSubmit = async (data: CreateUserDto) => {
    setFormLoading(true);
    let success: boolean;
    if (editingUser) {
      success = await updateUser(editingUser.id, data);
    } else {
      success = await createUser(data);
    }
    setFormLoading(false);
    if (success) {
      setIsModalOpen(false);
      setEditingUser(null);
    }
    return success;
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setFormLoading(true);
    const success = await deleteUser(deletingUser.id);
    setFormLoading(false);
    if (success) {
      setIsDeleteModalOpen(false);
      setDeletingUser(null);
    }
  };

  const handleResetPassword = async (userId: string) => {
    const newPassword = prompt(
      'Nueva contraseña:\n(mín. 8 caracteres, 1 mayúscula, 2 números, 1 especial)',
    );
    if (!newPassword) return;
    const err = requirePassword(newPassword);
    if (err) {
      toast.error(err);
      return;
    }
    setResettingPassword(userId);
    const success = await resetPassword(userId, newPassword);
    setResettingPassword(null);
    if (success) toast.success('Contraseña actualizada');
  };

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const rolesList = ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'COLLECTOR', 'PARENT'];
    const newRole = prompt(`Cambiar rol (actual: ${roleLabels[currentRole]})\nOpciones: ${rolesList.join(', ')}`);
    if (newRole && rolesList.includes(newRole)) {
      await changeRole(userId, newRole);
    }
  };

  const handleChangeStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await changeStatus(userId, newStatus);
  };

  if (!canManage) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-900">
        <p className="font-medium">Sin permiso para gestionar usuarios</p>
        <p className="text-sm mt-1">
          Solo Super Admin y Administrador pueden ver y crear usuarios del sistema.
        </p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona los usuarios del sistema</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg hover:shadow-lg transition-all shadow-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Usuario
        </button>
      </div>

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

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, documento o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
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
                    <td className="px-6 py-4 text-center"><div className="h-5 bg-gray-200 rounded w-16 mx-auto animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-32 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <UsersIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredUsers.map((user: User, index: number) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-[#7c0613] to-[#4a030b] rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {user.name?.charAt(0)}{user.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name} {user.lastName || ''}</p>
                            {user.documentId && (
                              <p className="text-xs text-gray-500 mt-0.5">Doc: {user.documentId}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 flex items-center">
                          <EnvelopeIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {user.email}
                        </p>
                        {user.phone && (
                          <p className="text-xs text-gray-500 flex items-center mt-1">
                            <PhoneIcon className="w-3 h-3 mr-1" />
                            {user.phone}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role]}`}>
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleChangeStatus(user.id, user.status)}
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity ${statusColors[user.status]}`}
                        >
                          {statusLabels[user.status]}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleChangeRole(user.id, user.role)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Cambiar rol"
                        >
                          <ShieldCheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          disabled={resettingPassword === user.id}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Restablecer contraseña"
                        >
                          <KeyIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingUser(user);
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

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        onSubmit={handleSubmit}
        loading={formLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingUser(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Usuario"
        message={`¿Estás seguro de eliminar a "${deletingUser?.name}"? Esta acción no se puede deshacer.`}
        loading={formLoading}
      />
    </motion.div>
  );
}