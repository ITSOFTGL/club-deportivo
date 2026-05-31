// store/usersStore.ts
import { create } from 'zustand';
import { User, CreateUserDto, UpdateUserDto } from '@/lib/api/users';
import usersApi from '@/lib/api/users';
import { getApiErrorMessage } from '@/lib/apiError';
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

export const useUsersStore = create<UsersState>((set) => ({
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
    } catch (error: unknown) {
      set({ error: getApiErrorMessage(error), users: [], loading: false });
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
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Error al crear usuario'));
      set({ loading: false });
      return false;
    }
  },

  updateUser: async (id, data) => {
    set({ loading: true });
    try {
      const cleanData: UpdateUserDto = {};
      if (data.email !== undefined) cleanData.email = data.email;
      if (data.name !== undefined) cleanData.name = data.name;
      if (data.lastName !== undefined) cleanData.lastName = data.lastName;
      if (data.role !== undefined) cleanData.role = data.role;
      if (data.documentId !== undefined) cleanData.documentId = data.documentId;
      if (data.phone !== undefined) cleanData.phone = data.phone;
      if (data.address !== undefined) cleanData.address = data.address;
      if (data.birthDate !== undefined) cleanData.birthDate = data.birthDate;
      if (data.gender !== undefined) cleanData.gender = data.gender;
      if (data.password !== undefined && data.password !== '') {
        cleanData.password = data.password;
      }

      const updatedUser = await usersApi.update(id, cleanData);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
        loading: false,
      }));
      toast.success('Usuario actualizado exitosamente');
      return true;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Error al actualizar usuario'));
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
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Error al eliminar usuario'));
      set({ loading: false });
      return false;
    }
  },

  changeRole: async (id, role) => {
    set({ loading: true });
    try {
      const updatedUser = await usersApi.changeRole(id, { role: role as CreateUserDto['role'] });
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
        loading: false,
      }));
      toast.success('Rol actualizado exitosamente');
      return true;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Error al cambiar rol'));
      set({ loading: false });
      return false;
    }
  },

  changeStatus: async (id, status) => {
    set({ loading: true });
    try {
      const updatedUser = await usersApi.changeStatus(id, {
        status: status as User['status'],
      });
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
        loading: false,
      }));
      toast.success('Estado actualizado exitosamente');
      return true;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Error al cambiar estado'));
      set({ loading: false });
      return false;
    }
  },

  resetPassword: async (id, password) => {
    set({ loading: true });
    try {
      await usersApi.resetPassword(id, { newPassword: password });
      set({ loading: false });
      toast.success('Contraseña restablecida exitosamente');
      return true;
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Error al restablecer contraseña'));
      set({ loading: false });
      return false;
    }
  },
}));
