// store/guardiansStore.ts
import { create } from 'zustand';
import { Guardian, CreateGuardianDto, UpdateGuardianDto } from '@/lib/api/guardians';
import guardiansApi from '@/lib/api/guardians';
import toast from 'react-hot-toast';

interface GuardiansState {
  guardians: Guardian[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchGuardians: () => Promise<void>;
  createGuardian: (data: CreateGuardianDto) => Promise<boolean>;
  updateGuardian: (id: string, data: UpdateGuardianDto) => Promise<boolean>;
  deleteGuardian: (id: string) => Promise<boolean>;
}

export const useGuardiansStore = create<GuardiansState>((set, get) => ({
  guardians: [],
  loading: false,
  error: null,
  searchTerm: '',

  setSearchTerm: (term) => set({ searchTerm: term }),

  fetchGuardians: async () => {
    set({ loading: true, error: null });
    try {
      const data = await guardiansApi.getAll();
      set({ guardians: Array.isArray(data) ? data : [], loading: false });
    } catch (error: any) {
      console.error('Error fetching guardians:', error);
      set({ error: error.message, guardians: [], loading: false });
      toast.error('Error al cargar apoderados');
    }
  },

  createGuardian: async (data) => {
    set({ loading: true });
    try {
      const newGuardian = await guardiansApi.create(data);
      set((state) => ({
        guardians: [newGuardian, ...state.guardians],
        loading: false,
      }));
      toast.success('Apoderado creado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error creating guardian:', error);
      toast.error(error?.message || 'Error al crear apoderado');
      set({ loading: false });
      return false;
    }
  },

  updateGuardian: async (id, data) => {
    set({ loading: true });
    try {
      const updatedGuardian = await guardiansApi.update(id, data);
      set((state) => ({
        guardians: state.guardians.map((g) => (g.id === id ? updatedGuardian : g)),
        loading: false,
      }));
      toast.success('Apoderado actualizado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error updating guardian:', error);
      toast.error(error?.message || 'Error al actualizar apoderado');
      set({ loading: false });
      return false;
    }
  },

  deleteGuardian: async (id) => {
    set({ loading: true });
    try {
      await guardiansApi.delete(id);
      set((state) => ({
        guardians: state.guardians.filter((g) => g.id !== id),
        loading: false,
      }));
      toast.success('Apoderado eliminado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error deleting guardian:', error);
      toast.error(error?.message || 'Error al eliminar apoderado');
      set({ loading: false });
      return false;
    }
  },
}));