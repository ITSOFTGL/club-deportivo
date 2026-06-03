// app/dashboard/categories/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useCategoriesStore } from '@/store/categoriesStore';
import { useBranchesStore } from '@/store/branchesStore';
import { useShiftsStore } from '@/store/shiftsStore';
import { CategoryFormModal } from '@/components/categories/CategoryFormModal';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import {
  Category,
  CreateCategoryDto,
  formatCategoryDisplayName,
  formatCategoryLabel,
} from '@/lib/api/categories';
import { Branch } from '@/lib/api/branches';
import { useSession } from 'next-auth/react';
import { canDeleteRecords } from '@/lib/permissions';

export default function CategoriesPage() {
  const { data: session } = useSession();
  const allowDelete = canDeleteRecords(session?.user?.role);
  const {
    categories,
    loading,
    searchTerm,
    setSearchTerm,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    deactivateCategory,
  } = useCategoriesStore();

  const { branches, fetchBranches } = useBranchesStore();
  const { shifts, fetchShifts } = useShiftsStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchBranches();
    fetchShifts();
  }, []);

  const filteredCategories = categories.filter((category: Category) => {
    const search = searchTerm.toLowerCase();
    return (
      category.name?.toLowerCase().includes(search) ||
      category.description?.toLowerCase().includes(search) ||
      category.branch?.name?.toLowerCase().includes(search)
    );
  });

  const stats = [
    { label: 'Total Categorías', value: categories.length, icon: AcademicCapIcon, color: 'from-blue-500 to-blue-600' },
    { label: 'Activas', value: categories.filter((c: Category) => c.isActive !== false).length, icon: AcademicCapIcon, color: 'from-green-500 to-green-600' },
    { label: 'Turnos Asignados', value: categories.reduce((acc, c) => acc + (c.shifts?.length || 0), 0), icon: ClockIcon, color: 'from-purple-500 to-purple-600' },
  ];

  const handleSubmit = async (data: CreateCategoryDto) => {
    setFormLoading(true);
    let success: boolean;
    if (editingCategory) {
      success = await updateCategory(editingCategory.id, data);
    } else {
      success = await createCategory(data);
    }
    setFormLoading(false);
    if (success) {
      setIsModalOpen(false);
      setEditingCategory(null);
    }
    return success;
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setFormLoading(true);
    const success = await deleteCategory(deletingCategory.id);
    setFormLoading(false);
    if (success) {
      setIsDeleteModalOpen(false);
      setDeletingCategory(null);
    }
  };

  const handleDeactivateFromDelete = async () => {
    if (!deletingCategory) return;
    setFormLoading(true);
    const success = await deactivateCategory(deletingCategory.id);
    setFormLoading(false);
    if (success) {
      setIsDeleteModalOpen(false);
      setDeletingCategory(null);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteModalOpen(true);
  };

  const getBranchName = (branchId: string) => {
    const branch = branches.find((b: Branch) => b.id === branchId);
    return branch?.name || 'No asignada';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(price);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categorías</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona las categorías deportivas del club</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg hover:shadow-lg transition-all shadow-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nueva Categoría
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
            placeholder="Buscar por nombre, descripción o sucursal..."
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turnos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rango de Edad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sucursal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-28 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-16 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <AcademicCapIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    {searchTerm ? 'No se encontraron categorías' : 'No hay categorías registradas'}
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredCategories.map((category: Category, index: number) => (
                    <motion.tr
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`hover:bg-gray-50 transition-colors ${
                        category.isActive === false ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-[#7c0613] to-[#4a030b] rounded-lg flex items-center justify-center">
                            <AcademicCapIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatCategoryDisplayName(category)}
                            </p>
                            {category.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {category.shifts && category.shifts.length > 0 ? (
                          <div className="space-y-1">
                            {category.shifts.map((cs) => (
                              <div key={cs.shiftId} className="text-xs">
                                <span className="font-medium text-gray-700">
                                  {cs.shift?.name || 'Turno'}:
                                </span>
                                <span className="text-gray-500 ml-1">
                                  {cs.capacity} cupos
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">Sin turnos asignados</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {category.minAge || category.maxAge ? (
                          <p className="text-sm text-gray-600 flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1 text-gray-400" />
                            {category.minAge && category.maxAge 
                              ? `${category.minAge} - ${category.maxAge} años`
                              : category.minAge 
                                ? `+${category.minAge} años`
                                : category.maxAge 
                                  ? `Hasta ${category.maxAge} años`
                                  : 'No especificado'}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400">No especificado</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 flex items-center">
                          <CurrencyDollarIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {formatPrice(category.monthlyPrice || 0)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 flex items-center">
                          <BuildingOfficeIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {getBranchName(category.branchId)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            category.isActive !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {category.isActive !== false ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        {allowDelete && (
                        <button
                          onClick={() => handleDeleteClick(category)}
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

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        branches={branches}
        shifts={shifts}
        onSubmit={handleSubmit}
        loading={formLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingCategory(null);
        }}
        onConfirm={handleDelete}
        onAlternative={handleDeactivateFromDelete}
        alternativeLabel="Desactivar categoría"
        title="Eliminar Categoría"
        message={`¿Eliminar "${deletingCategory ? formatCategoryLabel(deletingCategory) : ''}"? Solo use eliminar si la categoría no tiene alumnos ni inscripciones.`}
        hint="Si tiene alumnos registrados, no se podrá eliminar. En ese caso desactívela: conserva el historial y deja de ofrecerla para nuevos alumnos."
        loading={formLoading}
      />
    </motion.div>
  );
}