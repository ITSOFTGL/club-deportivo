// components/guardians/GuardianFormModal.tsx
'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Guardian, CreateGuardianDto } from '@/lib/api/guardians';

interface Student {
  id: string;
  name: string;
  lastName: string;
}

const relationships = [
  { value: 'PADRE', label: 'Padre' },
  { value: 'MADRE', label: 'Madre' },
  { value: 'TUTOR', label: 'Tutor' },
  { value: 'ABUELO', label: 'Abuelo(a)' },
  { value: 'OTRO', label: 'Otro' },
];

interface GuardianFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  guardian?: Guardian | null;
  students: Student[];
  onSubmit: (data: CreateGuardianDto) => Promise<boolean>;
  loading?: boolean;
}

export function GuardianFormModal({
  isOpen,
  onClose,
  guardian,
  students,
  onSubmit,
  loading = false,
}: GuardianFormModalProps) {
  const [formData, setFormData] = useState<CreateGuardianDto>({
    studentId: '',
    name: '',
    lastName: '',
    documentId: '',
    phone: '',
    email: '',
    relationship: 'PADRE',
    isPrimary: false,
  });

  useEffect(() => {
    if (guardian) {
      setFormData({
        studentId: guardian.studentId || '',
        name: guardian.name || '',
        lastName: guardian.lastName || '',
        documentId: guardian.documentId || '',
        phone: guardian.phone || '',
        email: guardian.email || '',
        relationship: guardian.relationship || 'PADRE',
        isPrimary: guardian.isPrimary || false,
      });
    } else {
      setFormData({
        studentId: '',
        name: '',
        lastName: '',
        documentId: '',
        phone: '',
        email: '',
        relationship: 'PADRE',
        isPrimary: false,
      });
    }
  }, [guardian, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSend: CreateGuardianDto = {
      studentId: formData.studentId,
      name: formData.name,
      lastName: formData.lastName,
      documentId: formData.documentId,
      phone: formData.phone,
      relationship: formData.relationship,
    };
    
    if (formData.email && formData.email.trim()) dataToSend.email = formData.email;
    if (formData.isPrimary) dataToSend.isPrimary = formData.isPrimary;
    
    console.log('📤 Enviando apoderado:', dataToSend);
    const success = await onSubmit(dataToSend);
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
                      <UserGroupIcon className="w-5 h-5 text-white" />
                    </div>
                    <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                      {guardian ? 'Editar Apoderado' : 'Nuevo Apoderado'}
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
                      onChange={(e) => updateField('studentId', e.target.value)}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        required
                        placeholder="Nombre del apoderado"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        required
                        placeholder="Apellido del apoderado"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Documento de Identidad *
                      </label>
                      <input
                        type="text"
                        value={formData.documentId}
                        onChange={(e) => updateField('documentId', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        required
                        placeholder="CI, Pasaporte, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Teléfono *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        required
                        placeholder="Número de teléfono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Relación *
                      </label>
                      <select
                        value={formData.relationship}
                        onChange={(e) => updateField('relationship', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        required
                      >
                        {relationships.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPrimary"
                      checked={formData.isPrimary}
                      onChange={(e) => updateField('isPrimary', e.target.checked)}
                      className="w-4 h-4 text-[#7c0613] focus:ring-[#7c0613] border-gray-300 rounded"
                    />
                    <label htmlFor="isPrimary" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Apoderado principal
                    </label>
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
                      {loading ? 'Guardando...' : guardian ? 'Actualizar' : 'Crear'}
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