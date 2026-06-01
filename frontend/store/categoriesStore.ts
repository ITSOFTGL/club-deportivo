// store/categoriesStore.ts
// store/categoriesStore.ts
import { create } from 'zustand';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '@/lib/api/categories';
import categoriesApi from '@/lib/api/categories';
import { getApiErrorMessage } from '@/lib/apiError';
import toast from 'react-hot-toast';

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchCategories: () => Promise<void>;
  createCategory: (data: CreateCategoryDto) => Promise<boolean>;
  updateCategory: (id: string, data: UpdateCategoryDto) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  deactivateCategory: (id: string) => Promise<boolean>;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  loading: false,
  error: null,
  searchTerm: '',

  setSearchTerm: (term) => set({ searchTerm: term }),

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const data = await categoriesApi.getAll();
      const categoriesArray = Array.isArray(data) ? data : [];
      set({ categories: categoriesArray, loading: false });
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      set({ error: error.message, categories: [], loading: false });
      toast.error(getApiErrorMessage(error, 'Error al cargar categorías'));
    }
  },

  createCategory: async (data: CreateCategoryDto) => {
    set({ loading: true });
    try {
      await categoriesApi.create(data);
      await get().fetchCategories();
      set({ loading: false });
      toast.success('Categoría creada exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error creating category:', error);
      console.error('Response:', error.response?.data);
      toast.error(getApiErrorMessage(error, 'Error al crear categoría'));
      set({ loading: false });
      return false;
    }
  },

  updateCategory: async (id: string, data: UpdateCategoryDto) => {
    set({ loading: true });
    try {
      const updatedCategory = await categoriesApi.update(id, data);
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? updatedCategory : c)),
        loading: false,
      }));
      toast.success('Categoría actualizada exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast.error(getApiErrorMessage(error, 'Error al actualizar categoría'));
      set({ loading: false });
      return false;
    }
  },

  deactivateCategory: async (id: string) => {
    set({ loading: true });
    try {
      const updated = await categoriesApi.update(id, { isActive: false });
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? updated : c)),
        loading: false,
      }));
      toast.success('Categoría desactivada. Ya no aparecerá para nuevos alumnos.');
      return true;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Error al desactivar categoría'));
      set({ loading: false });
      return false;
    }
  },

  deleteCategory: async (id: string) => {
    set({ loading: true });
    try {
      await categoriesApi.delete(id);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        loading: false,
      }));
      toast.success('Categoría eliminada exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(getApiErrorMessage(error, 'Error al eliminar categoría'));
      set({ loading: false });
      return false;
    }
  },
}));