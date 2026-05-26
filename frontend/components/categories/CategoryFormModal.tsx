// components/categories/CategoryFormModal.tsx
'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  AcademicCapIcon, 
  CurrencyDollarIcon, 
  UsersIcon,
  ClockIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Category, CreateCategoryDto, ShiftCapacity } from '@/lib/api/categories';
import { Shift } from '@/lib/api/shifts';

interface Branch {
  id: string;
  name: string;
}

const categoryTypes = [
  { value: 'SPORT', label: 'Deporte' },
  { value: 'FITNESS', label: 'Fitness' },
  { value: 'POOL', label: 'Piscina' },
  { value: 'TENNIS', label: 'Tenis' },
  { value: 'FOOTBALL', label: 'Fútbol' },
  { value: 'BASKETBALL', label: 'Básquetbol' },
  { value: 'SWIMMING', label: 'Natación' },
  { value: 'YOGA', label: 'Yoga' },
  { value: 'CROSSFIT', label: 'Crossfit' },
];

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category | null;
  branches?: Branch[];
  shifts?: Shift[];
  onSubmit: (data: CreateCategoryDto) => Promise<boolean>;
  loading?: boolean;
}

export function CategoryFormModal({
  isOpen,
  onClose,
  category,
  branches = [],
  shifts = [],
  onSubmit,
  loading = false,
}: CategoryFormModalProps) {
  const [formData, setFormData] = useState<CreateCategoryDto>({
    name: '',
    description: '',
    type: 'SPORT',
    monthlyPrice: 0,
    maxCapacity: 20,
    minAge: undefined,
    maxAge: undefined,
    requiresEquipment: false,
    branchId: '',
    shifts: [],
  });

  const [selectedShifts, setSelectedShifts] = useState<ShiftCapacity[]>([]);

  useEffect(() => {
    if (category) {
      const categoryShifts = category.shifts?.map(cs => ({
        shiftId: cs.shiftId,
        capacity: cs.capacity
      })) || [];
      
      setSelectedShifts(categoryShifts);
      
      setFormData({
        name: category.name || '',
        description: category.description || '',
        type: category.type || 'SPORT',
        monthlyPrice: category.monthlyPrice || 0,
        maxCapacity: category.maxCapacity || 20,
        minAge: category.minAge,
        maxAge: category.maxAge,
        requiresEquipment: category.requiresEquipment || false,
        branchId: category.branchId || '',
        shifts: categoryShifts,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'SPORT',
        monthlyPrice: 0,
        maxCapacity: 20,
        minAge: undefined,
        maxAge: undefined,
        requiresEquipment: false,
        branchId: '',
        shifts: [],
      });
      setSelectedShifts([]);
    }
  }, [category, isOpen]);

  const handleShiftToggle = (shiftId: string) => {
    setSelectedShifts(prev => {
      const exists = prev.find(s => s.shiftId === shiftId);
      if (exists) {
        const newShifts = prev.filter(s => s.shiftId !== shiftId);
        setFormData(prevData => ({ ...prevData, shifts: newShifts }));
        return newShifts;
      } else {
        const newShifts = [...prev, { shiftId, capacity: 20 }];
        setFormData(prevData => ({ ...prevData, shifts: newShifts }));
        return newShifts;
      }
    });
  };

  const handleShiftCapacityChange = (shiftId: string, capacity: number) => {
    const updatedShifts = selectedShifts.map(s =>
      s.shiftId === shiftId ? { ...s, capacity } : s
    );
    setSelectedShifts(updatedShifts);
    setFormData(prev => ({ ...prev, shifts: updatedShifts }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('El nombre de la categoría es requerido');
      return;
    }
    
    if (!formData.branchId) {
      toast.error('Debe seleccionar una sucursal');
      return;
    }

    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#7c0613] to-[#4a030b] rounded-lg flex items-center justify-center">
                      <AcademicCapIcon className="w-5 h-5 text-white" />
                    </div>
                    <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                      {category ? 'Editar Categoría' : 'Nueva Categoría'}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre de la Categoría *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
                      required
                      placeholder="Ej: Sub 6, Sub 7, Juvenil"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
                      rows={2}
                      placeholder="Descripción de la categoría"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo de Categoría
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
                      >
                        {categoryTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Precio Mensual (Bs.) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.monthlyPrice}
                          onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Capacidad Máxima
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UsersIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          min="1"
                          value={formData.maxCapacity || ''}
                          onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sucursal *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          value={formData.branchId}
                          onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
                          required
                        >
                          <option value="">Seleccionar sucursal</option>
                          {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Edad Mínima
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.minAge || ''}
                        onChange={(e) => setFormData({ ...formData, minAge: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
                        placeholder="Años"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Edad Máxima
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.maxAge || ''}
                        onChange={(e) => setFormData({ ...formData, maxAge: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
                        placeholder="Años"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requiresEquipment"
                      checked={formData.requiresEquipment}
                      onChange={(e) => setFormData({ ...formData, requiresEquipment: e.target.checked })}
                      className="w-4 h-4 text-[#7c0613] focus:ring-[#7c0613] border-gray-300 rounded"
                    />
                    <label htmlFor="requiresEquipment" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Requiere equipo especial
                    </label>
                  </div>

                  {/* Sección de Turnos */}
                  {shifts.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ClockIcon className="w-5 h-5 text-[#7c0613]" />
                        <label className="text-sm font-semibold text-gray-900 dark:text-white">
                          Turnos y Cupos
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Seleccione los turnos disponibles para esta categoría
                      </p>
                      <div className="space-y-3">
                        {shifts.map((shift) => {
                          const selectedShift = selectedShifts.find(s => s.shiftId === shift.id);
                          const isSelected = !!selectedShift;
                          
                          return (
                            <div key={shift.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <input
                                type="checkbox"
                                id={`shift-${shift.id}`}
                                checked={isSelected}
                                onChange={() => handleShiftToggle(shift.id)}
                                className="w-4 h-4 text-[#7c0613] focus:ring-[#7c0613] border-gray-300 rounded"
                              />
                              <label htmlFor={`shift-${shift.id}`} className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-medium">{shift.name}</span>
                                <span className="text-xs text-gray-500 ml-2">
                                  {shift.startTime} - {shift.endTime}
                                </span>
                              </label>
                              {isSelected && (
                                <div className="w-32">
                                  <input
                                    type="number"
                                    min="1"
                                    max={formData.maxCapacity || 100}
                                    value={selectedShift?.capacity || 20}
                                    onChange={(e) => handleShiftCapacityChange(shift.id, parseInt(e.target.value) || 0)}
                                    className="w-full px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
                                    placeholder="Cupos"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {loading ? 'Guardando...' : category ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}