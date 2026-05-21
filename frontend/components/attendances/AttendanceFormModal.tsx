// components/attendances/AttendanceFormModal.tsx
'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Attendance, CreateAttendanceDto } from '@/lib/api/attendances';

interface Student {
  id: string;
  name: string;
  lastName: string;
}

interface Shift {
  id: string;
  name: string;
}

const statusOptions = [
  { value: 'PRESENT', label: 'Presente', color: 'bg-green-100 text-green-800', icon: '✅' },
  { value: 'ABSENT', label: 'Ausente', color: 'bg-red-100 text-red-800', icon: '❌' },
  { value: 'LATE', label: 'Tardanza', color: 'bg-yellow-100 text-yellow-800', icon: '⏰' },
  { value: 'PENDING', label: 'Pendiente', color: 'bg-gray-100 text-gray-800', icon: '⏳' },
];

interface AttendanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendance?: Attendance | null;
  students: Student[];
  shifts: Shift[];
  onSubmit: (data: CreateAttendanceDto) => Promise<boolean>;
  loading?: boolean;
}

export function AttendanceFormModal({
  isOpen,
  onClose,
  attendance,
  students,
  shifts,
  onSubmit,
  loading = false,
}: AttendanceFormModalProps) {
  const [formData, setFormData] = useState<CreateAttendanceDto>({
    studentId: '',
    shiftId: '',
    status: 'PENDING',
    checkInTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    observations: '',
  });

  useEffect(() => {
    if (attendance) {
      setFormData({
        studentId: attendance.studentId || '',
        shiftId: attendance.shiftId || '',
        status: attendance.status || 'PENDING',
        checkInTime: attendance.checkInTime || '',
        observations: attendance.observations || '',
      });
    } else {
      setFormData({
        studentId: '',
        shiftId: '',
        status: 'PENDING',
        checkInTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        observations: '',
      });
    }
  }, [attendance, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  const getStatusColor = (status: string) => {
    const option = statusOptions.find(s => s.value === status);
    return option?.color || 'bg-gray-100 text-gray-800';
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
                      <CheckCircleIcon className="w-5 h-5 text-white" />
                    </div>
                    <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                      {attendance ? 'Editar Asistencia' : 'Registrar Asistencia'}
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
                        Alumno *
                      </label>
                    <select
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
                      required
                    >
                      <option value="">Seleccionar alumno</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Turno *
                      </label>
                    <select
                      value={formData.shiftId}
                      onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                      required
                    >
                      <option value="">Seleccionar turno</option>
                      {shifts.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estado *
                      </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                      required
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.icon} {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Hora de Ingreso
                      </label>
                    <input
                      type="time"
                      value={formData.checkInTime}
                      onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Observaciones
                      </label>
                    <textarea
                      value={formData.observations}
                      onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                      placeholder="Notas adicionales..."
                    />
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
                      {loading ? 'Guardando...' : attendance ? 'Actualizar' : 'Registrar'}
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