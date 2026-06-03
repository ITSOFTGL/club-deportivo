// components/teacher-assignments/TeacherAssignmentFormModal.tsx
'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { TeacherAssignment, CreateTeacherAssignmentDto } from '@/lib/api/teacher-assignments';
import { formatCategoryShiftLabel, type CategoryShift } from '@/lib/api/category-shifts';

interface Teacher {
  id: string;
  name: string;
  lastName: string;
  email: string;
}


interface TeacherAssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment?: TeacherAssignment | null;
  teachers: Teacher[];
  categoryShifts: CategoryShift[];
  existingAssignments?: TeacherAssignment[];
  onSubmit: (data: CreateTeacherAssignmentDto) => Promise<boolean>;
  loading?: boolean;
}

const roles = [
  { value: 'HEAD_COACH', label: 'Entrenador Principal' },
  { value: 'ASSISTANT_COACH', label: 'Entrenador Asistente' },
  { value: 'ASSISTANT', label: 'Asistente' },
];

export function TeacherAssignmentFormModal({
  isOpen,
  onClose,
  assignment,
  teachers,
  categoryShifts,
  existingAssignments = [],
  onSubmit,
  loading = false,
}: TeacherAssignmentFormModalProps) {
  const [formData, setFormData] = useState<CreateTeacherAssignmentDto>({
    teacherId: '',
    categoryShiftId: '',
    isLeadTeacher: false,
    role: 'ASSISTANT',
  });

  useEffect(() => {
    if (assignment) {
      setFormData({
        teacherId: assignment.teacherId || '',
        categoryShiftId: assignment.categoryShiftId || '',
        isLeadTeacher: assignment.isLeadTeacher || false,
        role: assignment.role || 'ASSISTANT',
      });
    } else {
      setFormData({
        teacherId: '',
        categoryShiftId: '',
        isLeadTeacher: false,
        role: 'ASSISTANT',
      });
    }
  }, [assignment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  const teacherAssignments = formData.teacherId
    ? existingAssignments.filter(
        (a) => a.teacherId === formData.teacherId && a.isActive !== false,
      )
    : [];

  const getCategoryShiftName = (id: string) => {
    const cs = categoryShifts.find(c => c.id === id);
    if (!cs) return 'Seleccionar';
    const categoryName = cs.category?.name || '';
    const shiftName = cs.shift?.name || '';
    return `${cs.name}${categoryName ? ` (${categoryName})` : ''}${shiftName ? ` - ${shiftName}` : ''}`;
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#7c0613] to-[#4a030b] rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="w-5 h-5 text-white" />
                    </div>
                    <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                      {assignment ? 'Editar Asignación' : 'Nueva Asignación'}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg px-3 py-2">
                    Un mismo profesor puede tener varias categorías en distintas sucursales y
                    horarios. Solo se bloquea si el día y la hora se solapan.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Profesor *
                    </label>
                    <select
                      value={formData.teacherId}
                      onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
                      required
                    >
                      <option value="">Seleccionar profesor</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.lastName} - {t.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {teacherAssignments.length > 0 && (
                    <div className="rounded-lg border border-gray-200 dark:border-gray-600 p-3 text-sm">
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Grupos ya asignados a este profesor
                      </p>
                      <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                        {teacherAssignments.map((a) => (
                          <li key={a.id}>
                            {formatCategoryShiftLabel(a.categoryShift as CategoryShift)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Grupo (categoría + sucursal + días y horario) *
                    </label>
                    <select
                      value={formData.categoryShiftId}
                      onChange={(e) => setFormData({ ...formData, categoryShiftId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                      required
                    >
                      <option value="">Seleccionar categoría/turno</option>
                      {categoryShifts.length === 0 ? (
                        <option value="" disabled>
                          Primero asigna turnos en Categorías
                        </option>
                      ) : (
                        categoryShifts.map((cs) => (
                          <option key={cs.id} value={cs.id}>
                            {formatCategoryShiftLabel(cs as CategoryShift)}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rol *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                      required
                    >
                      {roles.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isLeadTeacher"
                      checked={formData.isLeadTeacher}
                      onChange={(e) => setFormData({ ...formData, isLeadTeacher: e.target.checked })}
                      className="w-4 h-4 text-[#7c0613] focus:ring-[#7c0613] border-gray-300 rounded"
                    />
                    <label htmlFor="isLeadTeacher" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Profesor Principal
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg hover:shadow-lg disabled:opacity-50"
                    >
                      {loading ? 'Guardando...' : assignment ? 'Actualizar' : 'Crear'}
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