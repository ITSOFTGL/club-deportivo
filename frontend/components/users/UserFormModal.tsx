'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UsersIcon } from '@heroicons/react/24/outline';
import { User, CreateUserDto } from '@/lib/api/users';
import { PasswordField } from '@/components/ui/PasswordField';
import { requirePassword } from '@/lib/utils/password';
import toast from 'react-hot-toast';

const roles = [
  { value: 'SUPER_ADMIN', label: 'Super Administrador', color: 'bg-purple-600' },
  { value: 'ADMIN', label: 'Administrador', color: 'bg-blue-600' },
  { value: 'TEACHER', label: 'Profesor', color: 'bg-green-600' },
  { value: 'COLLECTOR', label: 'Cobrador', color: 'bg-yellow-600' },
  { value: 'PARENT', label: 'Padre de Familia', color: 'bg-pink-600' },
];

const genders = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMENINO', label: 'Femenino' },
  { value: 'OTRO', label: 'Otro' },
];

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onSubmit: (data: any) => Promise<boolean>;
  loading?: boolean;
}

export function UserFormModal({
  isOpen,
  onClose,
  user,
  onSubmit,
  loading = false,
}: UserFormModalProps) {
  const [formData, setFormData] = useState<any>({
    email: '',
    password: '',
    name: '',
    lastName: '',
    documentId: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '',
    role: 'PARENT',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        password: '',
        name: user.name || '',
        lastName: user.lastName || '',
        documentId: user.documentId || '',
        phone: user.phone || '',
        address: user.address || '',
        birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
        gender: user.gender || '',
        role: user.role || 'PARENT',
      });
    } else {
      setFormData({
        email: '',
        password: '',
        name: '',
        lastName: '',
        documentId: '',
        phone: '',
        address: '',
        birthDate: '',
        gender: '',
        role: 'PARENT',
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Datos base obligatorios
    const dataToSend: any = {
      email: formData.email,
      name: formData.name,
      lastName: formData.lastName,
      role: formData.role,
    };
    
    // Agregar campos opcionales solo si tienen valor
    if (formData.documentId && formData.documentId.trim() !== '') {
      dataToSend.documentId = formData.documentId;
    }
    if (formData.phone && formData.phone.trim() !== '') {
      dataToSend.phone = formData.phone;
    }
    if (formData.address && formData.address.trim() !== '') {
      dataToSend.address = formData.address;
    }
    if (formData.birthDate && formData.birthDate.trim() !== '') {
      dataToSend.birthDate = formData.birthDate;
    }
    if (formData.gender && formData.gender.trim() !== '') {
      dataToSend.gender = formData.gender;
    }
    
    // Solo enviar contraseña si:
    // 1. Es un usuario NUEVO (obligatorio)
    // 2. Es un usuario EXISTENTE y se ingresó una nueva contraseña (opcional)
    if (!user) {
      const err = requirePassword(formData.password);
      if (err) {
        toast.error(err);
        return;
      }
      dataToSend.password = formData.password;
    } else if (formData.password && formData.password.trim() !== '') {
      const err = requirePassword(formData.password);
      if (err) {
        toast.error(err);
        return;
      }
      dataToSend.password = formData.password;
    }
    
    console.log('📤 Enviando usuario:', dataToSend);
    const success = await onSubmit(dataToSend);
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
                      <UsersIcon className="w-5 h-5 text-white" />
                    </div>
                    <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                      {user ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613]"
                        required
                      />
                    </div>
                    <div>
                      <PasswordField
                        value={formData.password}
                        onChange={(password) => setFormData({ ...formData, password })}
                        label={`Contraseña${!user ? '' : ' (nueva)'}`}
                        required={!user}
                        showHints={!user || formData.password.length > 0}
                        placeholder={user ? 'Dejar vacío para no cambiar' : 'Crear contraseña segura'}
                      />
                      {user && (
                        <p className="text-xs text-gray-500 mt-1">
                          Dejar vacío para mantener la contraseña actual
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Documento de Identidad
                      </label>
                      <input
                        type="text"
                        value={formData.documentId}
                        onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Género
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613]"
                      >
                        <option value="">Seleccionar</option>
                        {genders.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Rol *
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613]"
                        required
                      >
                        {roles.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
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
                      {loading ? 'Guardando...' : user ? 'Actualizar' : 'Crear'}
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