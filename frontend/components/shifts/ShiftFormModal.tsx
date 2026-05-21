// components/shifts/ShiftFormModal.tsx
'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Shift, CreateShiftDto } from '@/lib/api/shifts';

const shiftTypes = [
  { value: 'MORNING', label: 'Mañana', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'AFTERNOON', label: 'Tarde', color: 'bg-orange-100 text-orange-800' },
  { value: 'EVENING', label: 'Noche', color: 'bg-indigo-100 text-indigo-800' },
];

interface ShiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift?: Shift | null;
  onSubmit: (data: CreateShiftDto) => Promise<boolean>;
  loading?: boolean;
}

export function ShiftFormModal({
  isOpen,
  onClose,
  shift,
  onSubmit,
  loading = false,
}: ShiftFormModalProps) {
  const [formData, setFormData] = useState<CreateShiftDto>({
    name: '',
    type: 'MORNING',
    startTime: '08:00',
    endTime: '12:00',
  });

  useEffect(() => {
    if (shift) {
      setFormData({
        name: shift.name || '',
        type: shift.type || 'MORNING',
        startTime: shift.startTime || '08:00',
        endTime: shift.endTime || '12:00',
      });
    } else {
      setFormData({
        name: '',
        type: 'MORNING',
        startTime: '08:00',
        endTime: '12:00',
      });
    }
  }, [shift, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
                      <ClockIcon className="w-5 h-5 text-white" />
                    </div>
                    <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                      {shift ? 'Editar Turno' : 'Nuevo Turno'}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre del Turno *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
                      required
                      placeholder="Ej: Mañana, Tarde, Noche"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipo de Turno *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => updateField('type', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
                      required
                    >
                      {shiftTypes.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hora Inicio *
                      </label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => updateField('startTime', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hora Fin *
                      </label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => updateField('endTime', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
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
                      {loading ? 'Guardando...' : shift ? 'Actualizar' : 'Crear'}
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