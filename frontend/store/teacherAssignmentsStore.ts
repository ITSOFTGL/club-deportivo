// store/teacherAssignmentsStore.ts
import { create } from 'zustand';
import { TeacherAssignment, CreateTeacherAssignmentDto, UpdateTeacherAssignmentDto } from '@/lib/api/teacher-assignments';
import teacherAssignmentsApi from '@/lib/api/teacher-assignments';
import toast from 'react-hot-toast';

interface TeacherAssignmentsState {
  assignments: TeacherAssignment[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchAssignments: () => Promise<void>;
  createAssignment: (data: CreateTeacherAssignmentDto) => Promise<boolean>;
  updateAssignment: (id: string, data: UpdateTeacherAssignmentDto) => Promise<boolean>;
  deleteAssignment: (id: string) => Promise<boolean>;
}

export const useTeacherAssignmentsStore = create<TeacherAssignmentsState>((set, get) => ({
  assignments: [],
  loading: false,
  error: null,
  searchTerm: '',

  setSearchTerm: (term) => set({ searchTerm: term }),

  fetchAssignments: async () => {
    set({ loading: true, error: null });
    try {
      const data = await teacherAssignmentsApi.getAll();
      set({ assignments: Array.isArray(data) ? data : [], loading: false });
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      set({ error: error.message, assignments: [], loading: false });
      toast.error('Error al cargar asignaciones');
    }
  },

  createAssignment: async (data) => {
    set({ loading: true });
    try {
      const newAssignment = await teacherAssignmentsApi.create(data);
      set((state) => ({
        assignments: [newAssignment, ...state.assignments],
        loading: false,
      }));
      toast.success('Asignación creada exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast.error(error?.message || 'Error al crear asignación');
      set({ loading: false });
      return false;
    }
  },

  updateAssignment: async (id, data) => {
    set({ loading: true });
    try {
      const updatedAssignment = await teacherAssignmentsApi.update(id, data);
      set((state) => ({
        assignments: state.assignments.map((a) => (a.id === id ? updatedAssignment : a)),
        loading: false,
      }));
      toast.success('Asignación actualizada exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      toast.error(error?.message || 'Error al actualizar asignación');
      set({ loading: false });
      return false;
    }
  },

  deleteAssignment: async (id) => {
    set({ loading: true });
    try {
      await teacherAssignmentsApi.delete(id);
      set((state) => ({
        assignments: state.assignments.filter((a) => a.id !== id),
        loading: false,
      }));
      toast.success('Asignación eliminada exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      toast.error(error?.message || 'Error al eliminar asignación');
      set({ loading: false });
      return false;
    }
  },
}));