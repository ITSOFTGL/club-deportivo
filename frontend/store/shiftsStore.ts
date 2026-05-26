// store/shiftsStore.ts
import { create } from 'zustand';
import shiftsApi, { Shift, CreateShiftDto, UpdateShiftDto } from '@/lib/api/shifts';
import toast from 'react-hot-toast';

interface ShiftsState {
  shifts: Shift[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchShifts: () => Promise<void>;
  createShift: (data: CreateShiftDto) => Promise<boolean>;
  updateShift: (id: string, data: UpdateShiftDto) => Promise<boolean>;
  deleteShift: (id: string) => Promise<boolean>;
}

export const useShiftsStore = create<ShiftsState>((set, get) => ({
  shifts: [],
  loading: false,
  searchTerm: '',

  setSearchTerm: (term) => set({ searchTerm: term }),

  fetchShifts: async () => {
    set({ loading: true });
    try {
      const data = await shiftsApi.getAll();
      set({ shifts: Array.isArray(data) ? data : [], loading: false });
    } catch {
      toast.error('Error al cargar turnos');
      set({ shifts: [], loading: false });
    }
  },

  createShift: async (data: CreateShiftDto) => {
    set({ loading: true });
    try {
      await shiftsApi.create(data);
      await get().fetchShifts();
      toast.success('Turno creado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error creating shift:', error);
      toast.error('Error al crear turno');
      set({ loading: false });
      return false;
    }
  },

  updateShift: async (id: string, data: UpdateShiftDto) => {
    set({ loading: true });
    try {
      const updatedShift = await shiftsApi.update(id, data);
      set((state) => ({
        shifts: state.shifts.map((s) => (s.id === id ? updatedShift : s)),
        loading: false,
      }));
      toast.success('Turno actualizado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error updating shift:', error);
      toast.error('Error al actualizar turno');
      set({ loading: false });
      return false;
    }
  },

  deleteShift: async (id: string) => {
    set({ loading: true });
    try {
      await shiftsApi.delete(id);
      set((state) => ({
        shifts: state.shifts.filter((s) => s.id !== id),
        loading: false,
      }));
      toast.success('Turno eliminado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error deleting shift:', error);
      toast.error('Error al eliminar turno');
      set({ loading: false });
      return false;
    }
  },
}));