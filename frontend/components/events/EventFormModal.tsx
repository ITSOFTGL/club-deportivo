// components/events/EventFormModal.tsx
'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Event, CreateEventDto } from '@/lib/api/events';

interface Category {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

const eventTypes = [
  { value: 'CHAMPIONSHIP', label: 'Campeonato', color: 'bg-purple-100 text-purple-800' },
  { value: 'FRIENDLY', label: 'Partido Amistoso', color: 'bg-blue-100 text-blue-800' },
  { value: 'CAMP', label: 'Campamento', color: 'bg-green-100 text-green-800' },
  { value: 'CLINIC', label: 'Clínica', color: 'bg-orange-100 text-orange-800' },
];

const eventStatuses = [
  { value: 'DRAFT', label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  { value: 'OPEN', label: 'Abierto', color: 'bg-green-100 text-green-800' },
  { value: 'CLOSED', label: 'Cerrado', color: 'bg-red-100 text-red-800' },
  { value: 'IN_PROGRESS', label: 'En Progreso', color: 'bg-blue-100 text-blue-800' },
  { value: 'COMPLETED', label: 'Completado', color: 'bg-gray-100 text-gray-800' },
  { value: 'CANCELLED', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
];

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event | null;
  categories: Category[];
  branches: Branch[];
  onSubmit: (data: CreateEventDto) => Promise<boolean>;
  loading?: boolean;
}

export function EventFormModal({
  isOpen,
  onClose,
  event,
  categories,
  branches,
  onSubmit,
  loading = false,
}: EventFormModalProps) {
  const [formData, setFormData] = useState<CreateEventDto>({
    title: '',
    description: '',
    type: 'CHAMPIONSHIP',
    categoryId: '',
    branchId: '',
    startDate: '',
    endDate: '',
    registrationStart: '',
    registrationEnd: '',
    cost: 0,
    earlyBirdCost: undefined,
    earlyBirdDate: '',
    location: '',
    venueName: '',
    maxParticipants: 100,
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        type: event.type || 'CHAMPIONSHIP',
        categoryId: event.categoryId || '',
        branchId: event.branchId || '',
        startDate: event.startDate ? event.startDate.split('T')[0] : '',
        endDate: event.endDate ? event.endDate.split('T')[0] : '',
        registrationStart: event.registrationStart ? event.registrationStart.split('T')[0] : '',
        registrationEnd: event.registrationEnd ? event.registrationEnd.split('T')[0] : '',
        cost: event.cost || 0,
        earlyBirdCost: event.earlyBirdCost,
        earlyBirdDate: event.earlyBirdDate ? event.earlyBirdDate.split('T')[0] : '',
        location: event.location || '',
        venueName: event.venueName || '',
        maxParticipants: event.maxParticipants || 100,
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setFormData({
        title: '',
        description: '',
        type: 'CHAMPIONSHIP',
        categoryId: '',
        branchId: '',
        startDate: today,
        endDate: nextWeek,
        registrationStart: today,
        registrationEnd: nextWeek,
        cost: 0,
        earlyBirdCost: undefined,
        earlyBirdDate: '',
        location: '',
        venueName: '',
        maxParticipants: 100,
      });
    }
  }, [event, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
                      <CalendarIcon className="w-5 h-5 text-white" />
                    </div>
                    <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                      {event ? 'Editar Evento' : 'Nuevo Evento'}
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
                      Título del Evento *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#7c0613]"
                      required
                      placeholder="Ej: Campeonato Sub 6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                      placeholder="Descripción del evento..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo de Evento *
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        required
                      >
                        {eventTypes.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Categoría
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                      >
                        <option value="">Todas las categorías</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sucursal
                      </label>
                      <select
                        value={formData.branchId}
                        onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                      >
                        <option value="">Todas las sucursales</option>
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Costo (Bs.) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha Inicio *
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha Fin *
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Inicio Inscripción *
                      </label>
                      <input
                        type="date"
                        value={formData.registrationStart}
                        onChange={(e) => setFormData({ ...formData, registrationStart: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fin Inscripción *
                      </label>
                      <input
                        type="date"
                        value={formData.registrationEnd}
                        onChange={(e) => setFormData({ ...formData, registrationEnd: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Precio Early Bird
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.earlyBirdCost || ''}
                        onChange={(e) => setFormData({ ...formData, earlyBirdCost: parseFloat(e.target.value) || undefined })}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        placeholder="Precio promocional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fecha Early Bird
                      </label>
                      <input
                        type="date"
                        value={formData.earlyBirdDate}
                        onChange={(e) => setFormData({ ...formData, earlyBirdDate: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ubicación *
                      </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                      required
                      placeholder="Ciudad, dirección..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Lugar/Nombre del Estadio
                      </label>
                      <input
                        type="text"
                        value={formData.venueName}
                        onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#7c0613]"
                        placeholder="Nombre del lugar"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Máx. Participantes *
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxParticipants}
                        onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
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
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg hover:shadow-lg disabled:opacity-50"
                    >
                      {loading ? 'Guardando...' : event ? 'Actualizar' : 'Crear'}
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