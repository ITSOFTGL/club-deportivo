// store/productsStore.ts
import { create } from 'zustand';
import { Product, CreateProductDto, UpdateProductDto } from '@/lib/api/products';
import productsApi from '@/lib/api/products';
import toast from 'react-hot-toast';

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchProducts: () => Promise<void>;
  createProduct: (data: CreateProductDto) => Promise<boolean>;
  updateProduct: (id: string, data: UpdateProductDto) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  loading: false,
  error: null,
  searchTerm: '',

  setSearchTerm: (term) => set({ searchTerm: term }),

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const data = await productsApi.getAll();
      set({ products: Array.isArray(data) ? data : [], loading: false });
    } catch (error: any) {
      console.error('Error fetching products:', error);
      set({ error: error.message, products: [], loading: false });
      toast.error('Error al cargar productos');
    }
  },

  createProduct: async (data) => {
    set({ loading: true });
    try {
      const newProduct = await productsApi.create(data);
      set((state) => ({
        products: [newProduct, ...state.products],
        loading: false,
      }));
      toast.success('Producto creado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error?.message || 'Error al crear producto');
      set({ loading: false });
      return false;
    }
  },

  updateProduct: async (id, data) => {
    set({ loading: true });
    try {
      const updatedProduct = await productsApi.update(id, data);
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updatedProduct : p)),
        loading: false,
      }));
      toast.success('Producto actualizado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error?.message || 'Error al actualizar producto');
      set({ loading: false });
      return false;
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true });
    try {
      await productsApi.delete(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        loading: false,
      }));
      toast.success('Producto eliminado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error?.message || 'Error al eliminar producto');
      set({ loading: false });
      return false;
    }
  },
}));