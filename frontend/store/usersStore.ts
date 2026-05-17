// store/usersStore.ts
import { create } from 'zustand';
import { User, CreateUserDto, UpdateUserDto } from '@/lib/api/users';
import usersApi from '@/lib/api/users';
import toast from 'react-hot-toast';

interface UsersState {
  users: User[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchUsers: () => Promise<void>;
  createUser: (data: CreateUserDto) => Promise<boolean>;
  updateUser: (id: string, data: UpdateUserDto) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  changeRole: (id: string, role: string) => Promise<boolean>;
  changeStatus: (id: string, status: string) => Promise<boolean>;
  resetPassword: (id: string, password: string) => Promise<boolean>;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  users: [],
  loading: false,
  error: null,
  searchTerm: '',

  setSearchTerm: (term) => set({ searchTerm: term }),

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const data = await usersApi.getAll();
      set({ users: Array.isArray(data) ? data : [], loading: false });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      set({ error: error.message, users: [], loading: false });
      toast.error('Error al cargar usuarios');
    }
  },

  createUser: async (data) => {
    set({ loading: true });
    try {
      const newUser = await usersApi.create(data);
      set((state) => ({
        users: [newUser, ...state.users],
        loading: false,
      }));
      toast.success('Usuario creado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error?.message || 'Error al crear usuario');
      set({ loading: false });
      return false;
    }
  },

  updateUser: async (id, data) => {
    set({ loading: true });
    try {
      const updatedUser = await usersApi.update(id, data);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
        loading: false,
      }));
      toast.success('Usuario actualizado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error?.message || 'Error al actualizar usuario');
      set({ loading: false });
      return false;
    }
  },

  deleteUser: async (id) => {
    set({ loading: true });
    try {
      await usersApi.delete(id);
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        loading: false,
      }));
      toast.success('Usuario eliminado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error?.message || 'Error al eliminar usuario');
      set({ loading: false });
      return false;
    }
  },

  changeRole: async (id, role) => {
    set({ loading: true });
    try {
      const updatedUser = await usersApi.changeRole(id, { role: role as any });
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
        loading: false,
      }));
      toast.success('Rol actualizado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast.error(error?.message || 'Error al cambiar rol');
      set({ loading: false });
      return false;
    }
  },

  changeStatus: async (id, status) => {
    set({ loading: true });
    try {
      const updatedUser = await usersApi.changeStatus(id, { status: status as any });
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
        loading: false,
      }));
      toast.success('Estado actualizado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error changing status:', error);
      toast.error(error?.message || 'Error al cambiar estado');
      set({ loading: false });
      return false;
    }
  },

  resetPassword: async (id, password) => {
    set({ loading: true });
    try {
      await usersApi.resetPassword(id, { password });
      set({ loading: false });
      toast.success('Contraseña restablecida exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(error?.message || 'Error al restablecer contraseña');
      set({ loading: false });
      return false;
    }
  },
}));