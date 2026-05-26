// store/eventsStore.ts
import { create } from 'zustand';
import { Event, CreateEventDto, UpdateEventDto } from '@/lib/api/events';
import eventsApi from '@/lib/api/events';
import toast from 'react-hot-toast';

function sanitizeEventPayload<T extends CreateEventDto | UpdateEventDto>(data: T): T {
  const cleaned = { ...data } as Record<string, unknown>;
  for (const key of ['categoryId', 'branchId', 'description', 'venueName', 'earlyBirdDate'] as const) {
    if (cleaned[key] === '') cleaned[key] = undefined;
  }
  if (cleaned.earlyBirdCost === 0 || cleaned.earlyBirdCost === '') {
    cleaned.earlyBirdCost = undefined;
  }
  return cleaned as T;
}

interface EventsState {
  events: Event[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchEvents: () => Promise<void>;
  createEvent: (data: CreateEventDto) => Promise<boolean>;
  updateEvent: (id: string, data: UpdateEventDto) => Promise<boolean>;
  deleteEvent: (id: string) => Promise<boolean>;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  loading: false,
  error: null,
  searchTerm: '',

  setSearchTerm: (term) => set({ searchTerm: term }),

  fetchEvents: async () => {
    set({ loading: true, error: null });
    try {
      const data = await eventsApi.getAll();
      set({ events: Array.isArray(data) ? data : [], loading: false });
    } catch (error: any) {
      console.error('Error fetching events:', error);
      set({ error: error.message, events: [], loading: false });
      toast.error('Error al cargar eventos');
    }
  },

  createEvent: async (data) => {
    set({ loading: true });
    try {
      await eventsApi.create(sanitizeEventPayload(data));
      await get().fetchEvents();
      set({ loading: false });
      toast.success('Evento creado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error creating event:', error);
      const msg = Array.isArray(error?.message)
        ? error.message.join(', ')
        : error?.message || 'Error al crear evento';
      toast.error(msg);
      set({ loading: false });
      return false;
    }
  },

  updateEvent: async (id, data) => {
    set({ loading: true });
    try {
      const updatedEvent = await eventsApi.update(id, sanitizeEventPayload(data));
      set((state) => ({
        events: state.events.map((e) => (e.id === id ? updatedEvent : e)),
        loading: false,
      }));
      toast.success('Evento actualizado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast.error(error?.message || 'Error al actualizar evento');
      set({ loading: false });
      return false;
    }
  },

  deleteEvent: async (id) => {
    set({ loading: true });
    try {
      await eventsApi.delete(id);
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        loading: false,
      }));
      toast.success('Evento eliminado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast.error(error?.message || 'Error al eliminar evento');
      set({ loading: false });
      return false;
    }
  },
}));