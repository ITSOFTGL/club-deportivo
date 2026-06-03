// components/guardians/GuardianFormModal.tsx
'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { PasswordField } from '@/components/ui/PasswordField';
import { requirePassword } from '@/lib/utils/password';
import toast from 'react-hot-toast';
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
  const [formData, setFormData] = useState({
    studentId: '',
    secondStudentId: '',
    name: '',
    lastName: '',
    documentId: '',
    phone: '',
    email: '',
    relationship: 'PADRE' as CreateGuardianDto['relationship'],
    isPrimary: true,
    createUserAccount: false,
    password: '',
  });

  useEffect(() => {
    if (guardian) {
      setFormData({
        studentId: guardian.studentId || '',
        secondStudentId: '',
        name: guardian.name || '',
        lastName: guardian.lastName || '',
        documentId: guardian.documentId || '',
        phone: guardian.phone || '',
        email: guardian.email || '',
        relationship: guardian.relationship || 'PADRE',
        isPrimary: guardian.isPrimary ?? false,
        createUserAccount: false,
        password: '',
      });
    } else {
      setFormData({
        studentId: '',
        secondStudentId: '',
        name: '',
        lastName: '',
        documentId: '',
        phone: '',
        email: '',
        relationship: 'PADRE',
        isPrimary: true,
        createUserAccount: false,
        password: '',
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
      isPrimary: formData.isPrimary,
    };

    if (formData.secondStudentId && formData.secondStudentId !== formData.studentId) {
      dataToSend.additionalStudentIds = [formData.secondStudentId];
    }
    if (formData.email?.trim()) dataToSend.email = formData.email.trim();
    if (formData.createUserAccount) {
      if (!formData.email?.trim()) {
        toast.error('Ingrese el correo para crear la cuenta de acceso');
        return;
      }
      const err = requirePassword(formData.password);
      if (err) {
        toast.error(err);
        return;
      }
      dataToSend.createUserAccount = true;
      dataToSend.email = formData.email.trim();
      dataToSend.password = formData.password;
    }

    const success = await onSubmit(dataToSend);
    if (success) onClose();
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#7c0613] to-[#4a030b] rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="w-5 h-5 text-white" />
                    </div>
                    <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                      {guardian ? 'Editar Apoderado' : 'Registrar Apoderado'}
                    </Dialog.Title>
                  </div>
                  <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {!guardian && (
                  <p className="text-sm text-gray-600 mb-4 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Vincule al apoderado con su hijo(a). Puede crear cuenta de acceso aquí mismo sin ir a Usuarios.
                  </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Alumno *</label>
                      <select
                        value={formData.studentId}
                        onChange={(e) => updateField('studentId', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
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
                      <label className="block text-sm font-medium mb-1">Segundo hijo (opcional)</label>
                      <select
                        value={formData.secondStudentId}
                        onChange={(e) => updateField('secondStudentId', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                      >
                        <option value="">Solo un hijo</option>
                        {students
                          .filter((s) => s.id !== formData.studentId)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.lastName}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nombre *</label>
                      <input type="text" value={formData.name} onChange={(e) => updateField('name', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Apellido *</label>
                      <input type="text" value={formData.lastName} onChange={(e) => updateField('lastName', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Documento *</label>
                      <input type="text" value={formData.documentId} onChange={(e) => updateField('documentId', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Teléfono *</label>
                      <input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Correo</label>
                      <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]" placeholder="Para cuenta de acceso" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Relación *</label>
                      <select value={formData.relationship} onChange={(e) => updateField('relationship', e.target.value)} className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]" required>
                        {relationships.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {!guardian && (
                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900/40 space-y-3">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={formData.createUserAccount}
                          onChange={(e) => updateField('createUserAccount', e.target.checked)}
                          className="rounded border-gray-300 text-[#7c0613] focus:ring-[#7c0613]"
                        />
                        Crear cuenta de acceso (rol Padre)
                      </label>
                      <p className="text-xs text-gray-500">
                        Recomendado para que el apoderado inicie sesión y vea hijos, pagos y eventos.
                        Si ya existe un usuario Padre con el mismo correo o documento, se vinculará
                        automáticamente.
                      </p>
                      {formData.createUserAccount && (
                        <PasswordField
                          value={formData.password}
                          onChange={(password) => updateField('password', password)}
                          label="Contraseña de acceso"
                          required
                          showHints
                        />
                      )}
                      {formData.createUserAccount && (
                        <p className="text-xs text-amber-700">
                          Obligatorio: correo arriba y contraseña (mín. 6 caracteres, una letra y un
                          número — ej: Padre123).
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
                    <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg disabled:opacity-50">
                      {loading ? 'Guardando...' : guardian ? 'Actualizar' : 'Guardar apoderado'}
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
