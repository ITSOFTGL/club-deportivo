// app/dashboard/events/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useEventsStore } from '@/store/eventsStore';
import { useCategoriesStore } from '@/store/categoriesStore';
import { useBranchesStore } from '@/store/branchesStore';
import { EventFormModal } from '@/components/events/EventFormModal';
import { DeleteConfirmModal } from '@/components/ui/DeleteConfirmModal';
import { CreateEventDto } from '@/lib/api/events';

const eventTypeLabels: Record<string, string> = {
  CHAMPIONSHIP: 'Campeonato',
  FRIENDLY: 'Amistoso',
  CAMP: 'Campamento',
  CLINIC: 'Clínica',
};

const eventTypeColors: Record<string, string> = {
  CHAMPIONSHIP: 'bg-purple-100 text-purple-800',
  FRIENDLY: 'bg-blue-100 text-blue-800',
  CAMP: 'bg-green-100 text-green-800',
  CLINIC: 'bg-orange-100 text-orange-800',
};

const eventStatusLabels: Record<string, string> = {
  DRAFT: 'Borrador',
  OPEN: 'Abierto',
  CLOSED: 'Cerrado',
  IN_PROGRESS: 'En Progreso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

const eventStatusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  OPEN: 'bg-green-100 text-green-800',
  CLOSED: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function EventsPage() {
  const { events, loading, searchTerm, setSearchTerm, fetchEvents, createEvent, updateEvent, deleteEvent } = useEventsStore();
  const { categories, fetchCategories } = useCategoriesStore();
  const { branches, fetchBranches } = useBranchesStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deletingEvent, setDeletingEvent] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchCategories();
    fetchBranches();
  }, []);

  const filteredEvents = events.filter((event) => {
    const search = searchTerm.toLowerCase();
    return (
      event.title?.toLowerCase().includes(search) ||
      event.location?.toLowerCase().includes(search) ||
      event.type?.toLowerCase().includes(search)
    );
  });

  const stats = [
    { label: 'Total Eventos', value: events.length, icon: CalendarIcon, color: 'from-blue-500 to-blue-600' },
    { label: 'Abiertos', value: events.filter(e => e.status === 'OPEN').length, icon: CalendarIcon, color: 'from-green-500 to-green-600' },
    { label: 'En Progreso', value: events.filter(e => e.status === 'IN_PROGRESS').length, icon: CalendarIcon, color: 'from-yellow-500 to-yellow-600' },
  ];

  const handleSubmit = async (data: CreateEventDto) => {
    setFormLoading(true);
    let success: boolean;
    if (editingEvent) {
      success = await updateEvent(editingEvent.id, data);
    } else {
      success = await createEvent(data);
    }
    setFormLoading(false);
    if (success) {
      setIsModalOpen(false);
      setEditingEvent(null);
    }
    return success;
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;
    setFormLoading(true);
    const success = await deleteEvent(deletingEvent.id);
    setFormLoading(false);
    if (success) {
      setIsDeleteModalOpen(false);
      setDeletingEvent(null);
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Eventos</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona campeonatos, partidos y actividades del club</p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#7c0613] to-[#4a030b] text-white rounded-lg hover:shadow-lg transition-all shadow-md"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo Evento
        </button>
      </div>

      {/* Stats */}
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

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por título, ubicación o tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-[#7c0613] focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-40 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16 animate-pulse" /></td>
                    <td className="px-6 py-4 text-center"><div className="h-5 bg-gray-200 rounded w-16 mx-auto animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-16 ml-auto animate-pulse" /></td>
                  </tr>
                ))
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    {searchTerm ? 'No se encontraron eventos' : 'No hay eventos registrados'}
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredEvents.map((event, index) => (
                    <motion.tr
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-[#7c0613] to-[#4a030b] rounded-lg flex items-center justify-center">
                            <CalendarIcon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{event.title}</p>
                            {event.description && (
                              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{event.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${eventTypeColors[event.type]}`}>
                          {eventTypeLabels[event.type]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-600">{formatDate(event.startDate)}</p>
                          <p className="text-xs text-gray-400">hasta {formatDate(event.endDate)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {event.location}
                        </p>
                        {event.venueName && (
                          <p className="text-xs text-gray-500 mt-0.5">{event.venueName}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 flex items-center">
                          <CurrencyDollarIcon className="w-4 h-4 mr-1 text-gray-400" />
                          Bs. {event.cost.toLocaleString()}
                        </p>
                        {event.earlyBirdCost && (
                          <p className="text-xs text-green-600">Early: Bs. {event.earlyBirdCost}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${eventStatusColors[event.status]}`}>
                          {eventStatusLabels[event.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingEvent(event);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Modal */}
      <EventFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        categories={categories}
        branches={branches}
        onSubmit={handleSubmit}
        loading={formLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingEvent(null);
        }}
        onConfirm={handleDelete}
        title="Eliminar Evento"
        message={`¿Estás seguro de eliminar el evento "${deletingEvent?.title}"? Esta acción no se puede deshacer.`}
        loading={formLoading}
      />
    </motion.div>
  );
}