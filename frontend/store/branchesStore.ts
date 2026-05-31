// store/branchesStore.ts
import { create } from 'zustand';
import { Branch, CreateBranchDto, UpdateBranchDto } from '@/lib/api/branches';
import branchesApi from '@/lib/api/branches';
import { getApiErrorMessage } from '@/lib/apiError';
import toast from 'react-hot-toast';

interface BranchesState {
  branches: Branch[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchBranches: () => Promise<void>;
  createBranch: (data: CreateBranchDto) => Promise<boolean>;
  updateBranch: (id: string, data: UpdateBranchDto) => Promise<boolean>;
  deleteBranch: (id: string) => Promise<boolean>;
}

export const useBranchesStore = create<BranchesState>((set, get) => ({
  branches: [],
  loading: false,
  error: null,
  searchTerm: '',

  setSearchTerm: (term) => set({ searchTerm: term }),

  fetchBranches: async () => {
    set({ loading: true, error: null });
    try {
      const data = await branchesApi.getAll();
      set({ branches: Array.isArray(data) ? data : [], loading: false });
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      set({ error: error.message, branches: [], loading: false });
      toast.error('Error al cargar sucursales');
    }
  },

  createBranch: async (data) => {
    set({ loading: true });
    try {
      const newBranch = await branchesApi.create(data);
      set((state) => ({
        branches: [newBranch, ...state.branches],
        loading: false,
      }));
      toast.success('Sucursal creada exitosamente');
      return true;
    } catch (error: unknown) {
      console.error('Error creating branch:', error);
      toast.error(getApiErrorMessage(error, 'Error al crear sucursal'));
      set({ loading: false });
      return false;
    }
  },

  updateBranch: async (id, data) => {
    set({ loading: true });
    try {
      const updatedBranch = await branchesApi.update(id, data);
      set((state) => ({
        branches: state.branches.map((b) => (b.id === id ? updatedBranch : b)),
        loading: false,
      }));
      toast.success('Sucursal actualizada exitosamente');
      return true;
    } catch (error: unknown) {
      console.error('Error updating branch:', error);
      const msg = (error as { message?: string | string[] })?.message;
      toast.error(
        Array.isArray(msg) ? msg.join(', ') : msg || 'Error al actualizar sucursal',
      );
      set({ loading: false });
      return false;
    }
  },

  deleteBranch: async (id) => {
    set({ loading: true });
    try {
      await branchesApi.delete(id);
      set((state) => ({
        branches: state.branches.filter((b) => b.id !== id),
        loading: false,
      }));
      toast.success('Sucursal eliminada exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error deleting branch:', error);
      toast.error(error?.message || 'Error al eliminar sucursal');
      set({ loading: false });
      return false;
    }
  },
}));