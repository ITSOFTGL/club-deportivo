// store/studentsStore.ts
import { create } from 'zustand';
import { Student, CreateStudentDto, UpdateStudentDto } from '@/lib/api/students';
import studentsApi from '@/lib/api/students';
import toast from 'react-hot-toast';
import { getApiErrorMessage } from '@/lib/apiError';

interface StudentsState {
  students: Student[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchStudents: () => Promise<void>;
  createStudent: (data: CreateStudentDto) => Promise<Student | null>;
  updateStudent: (id: string, data: UpdateStudentDto) => Promise<boolean>;
  deleteStudent: (id: string) => Promise<boolean>;
}

export const useStudentsStore = create<StudentsState>((set, get) => ({
  students: [],
  loading: false,
  error: null,
  searchTerm: '',

  setSearchTerm: (term) => set({ searchTerm: term }),

  fetchStudents: async () => {
    set({ loading: true, error: null });
    try {
      const data = await studentsApi.getAll();
      set({ students: Array.isArray(data) ? data : [], loading: false });
    } catch (error: any) {
      console.error('Error fetching students:', error);
      set({ error: error.message, students: [], loading: false });
      toast.error(getApiErrorMessage(error, 'Error al cargar alumnos'));
    }
  },

  createStudent: async (data) => {
    set({ loading: true });
    try {
      const newStudent = await studentsApi.create(data);
      set((state) => ({
        students: [newStudent, ...state.students],
        loading: false,
      }));
      toast.success('Alumno creado exitosamente');
      return newStudent;
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast.error(getApiErrorMessage(error, 'Error al crear alumno'));
      set({ loading: false });
      return null;
    }
  },

  updateStudent: async (id, data) => {
    set({ loading: true });
    try {
      const updatedStudent = await studentsApi.update(id, data);
      set((state) => ({
        students: state.students.map((s) => (s.id === id ? updatedStudent : s)),
        loading: false,
      }));
      toast.success('Alumno actualizado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error updating student:', error);
      toast.error(getApiErrorMessage(error, 'Error al actualizar alumno'));
      set({ loading: false });
      return false;
    }
  },

  deleteStudent: async (id) => {
    set({ loading: true });
    try {
      await studentsApi.delete(id);
      set((state) => ({
        students: state.students.filter((s) => s.id !== id),
        loading: false,
      }));
      toast.success('Alumno eliminado exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast.error(getApiErrorMessage(error, 'Error al eliminar alumno'));
      set({ loading: false });
      return false;
    }
  },
}));