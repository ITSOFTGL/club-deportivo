'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useBranchesStore } from '@/store/branchesStore';
import { BranchFormModal } from '@/components/branches/BranchFormModal';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { Branch, CreateBranchDto } from '@/lib/api/branches';

export default function BranchesPage() {
  const {
    branches,
    loading,
    searchTerm,
    setSearchTerm,
    fetchBranches,
    createBranch,
    updateBranch,
    deleteBranch,
  } = useBranchesStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const filteredBranches = branches.filter((branch: Branch) => {
    const search = searchTerm.toLowerCase();
    return (
      branch.name?.toLowerCase().includes(search) ||
      branch.location?.toLowerCase().includes(search) ||
      branch.phone?.includes(search) ||
      branch.email?.toLowerCase().includes(search) ||
      branch.manager?.toLowerCase().includes(search)
    );
  });

  const stats = [
    { label: 'Total Sucursales', value: branches.length, icon: BuildingOfficeIcon, color: 'from-blue-500 to-blue-600' },
    { label: 'Activas', value: branches.filter((b: Branch) => b.status === 'ACTIVE' || !b.status).length, icon: BuildingOfficeIcon, color: 'from-green-500 to-green-600' },
    { label: 'Inactivas', value: branches.filter((b: Branch) => b.status === 'INACTIVE').length, icon: BuildingOfficeIcon, color: 'from-red-500 to-red-600' },
  ];

  const handleSubmit = async (data: CreateBranchDto) => {
    setFormLoading(true);
    let success: boolean;
    if (editingBranch) {
      success = await updateBranch(editingBranch.id, data);
    } else {
      success = await createBranch(data);
    }
    setFormLoading(false);
    if (success) {
      setIsModalOpen(false);
      setEditingBranch(null);
    }
    return success;
  };

  const handleDelete = async () => {
    if (!deletingBranch) return;
    setFormLoading(true);
    const success = await deleteBranch(deletingBranch.id);
    setFormLoading(false);
    if (success) {
      setIsDeleteModalOpen(false);
      setDeletingBranch(null);
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (branch: Branch) => {
    setDeletingBranch(branch);
    setIsDeleteModalOpen(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sucursales</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona las sedes del club deportivo</p>
        </div>
        <button
          onClick={() => {
            setEditingBranch(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg hover:shadow-lg transition-all duration-200 shadow-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nueva Sucursal
        </button>
      </div>

      {/* Stats Cards */}
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

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, ubicación, teléfono, email o encargado..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sucursal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-40"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div></td>
                    <td className="px-6 py-4 text-center"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto animate-pulse"></div></td>
                  </tr>
                ))
              ) : filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    {searchTerm ? 'No se encontraron sucursales con esa búsqueda' : 'No hay sucursales registradas'}
                   </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredBranches.map((branch: Branch, index: number) => (
                    <motion.tr
                      key={branch.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-[#7c0613] to-[#4a030b] rounded-lg flex items-center justify-center shadow-md">
                            <BuildingOfficeIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{branch.name}</p>
                            {branch.manager && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-0.5">
                                <UserIcon className="w-3 h-3 mr-1" />
                                {branch.manager}
                              </p>
                            )}
                            {branch.schedule && (
                              <p className="text-xs text-gray-400 flex items-center mt-0.5">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                {branch.schedule}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                          {branch.location}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                          <PhoneIcon className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                          {branch.phone}
                        </p>
                        {branch.email && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                            <EnvelopeIcon className="w-3 h-3 mr-1" />
                            {branch.email}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          branch.status === 'ACTIVE' || !branch.status
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {branch.status === 'ACTIVE' || !branch.status ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(branch)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(branch)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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

      {/* Modal de Crear/Editar */}
      <BranchFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBranch(null);
        }}
        branch={editingBranch}
        onSubmit={handleSubmit}
        loading={formLoading}
      />

      {/* Modal de Confirmación de Eliminación */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingBranch(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Sucursal"
        message={`¿Estás seguro de eliminar "${deletingBranch?.name}"? Esta acción no se puede deshacer.`}
        loading={formLoading}
      />
    </motion.div>
  );
}