// store/categoriesStore.ts - Asegurar que use CreateCategoryDto
import { create } from 'zustand';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '@/lib/api/categories';
import categoriesApi from '@/lib/api/categories';
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
      set({ categories: Array.isArray(data) ? data : [], loading: false });
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      set({ error: error.message, categories: [], loading: false });
      toast.error('Error al cargar categorías');
    }
  },

  createCategory: async (data) => {
    set({ loading: true });
    try {
      const newCategory = await categoriesApi.create(data);
      set((state) => ({
        categories: [newCategory, ...state.categories],
        loading: false,
      }));
      toast.success('Categoría creada exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast.error(error?.message || 'Error al crear categoría');
      set({ loading: false });
      return false;
    }
  },

  updateCategory: async (id, data) => {
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
      toast.error(error?.message || 'Error al actualizar categoría');
      set({ loading: false });
      return false;
    }
  },

  deleteCategory: async (id) => {
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
      toast.error(error?.message || 'Error al eliminar categoría');
      set({ loading: false });
      return false;
    }
  },
}));