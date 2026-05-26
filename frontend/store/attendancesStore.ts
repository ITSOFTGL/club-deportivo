import { create } from 'zustand';
import { Attendance, CreateAttendanceDto, UpdateAttendanceDto } from '@/lib/api/attendances';
import attendancesApi from '@/lib/api/attendances';
import { getLocalDateString } from '@/lib/utils/date';
import toast from 'react-hot-toast';

interface AttendancesState {
  attendances: Attendance[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedDate: string;
  selectedCategoryId: string;
  selectedShiftId: string;
  selectedTeacherId: string;
  setSearchTerm: (term: string) => void;
  setSelectedDate: (date: string) => void;
  setSelectedCategoryId: (categoryId: string) => void;
  setSelectedShiftId: (shiftId: string) => void;
  setSelectedTeacherId: (teacherId: string) => void;
  fetchAttendances: (date?: string) => Promise<void>;
  getAttendanceByDateAndStudent: (
    date: string,
    studentId: string,
  ) => Promise<Attendance | null>;
  createAttendance: (data: CreateAttendanceDto) => Promise<boolean>;
  updateAttendance: (id: string, data: UpdateAttendanceDto) => Promise<boolean>;
  deleteAttendance: (id: string) => Promise<boolean>;
}

export const useAttendancesStore = create<AttendancesState>((set, get) => ({
  attendances: [],
  loading: false,
  error: null,
  searchTerm: '',
  selectedDate: getLocalDateString(),
  selectedCategoryId: '',
  selectedShiftId: '',
  selectedTeacherId: '',

  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedCategoryId: (categoryId) => set({ selectedCategoryId: categoryId }),
  setSelectedShiftId: (shiftId) => set({ selectedShiftId: shiftId }),
  setSelectedTeacherId: (teacherId) => set({ selectedTeacherId: teacherId }),

  fetchAttendances: async (date?: string) => {
    set({ loading: true, error: null });
    try {
      const targetDate = date ?? get().selectedDate;
      const data = await attendancesApi.getByDate(targetDate);
      set({
        attendances: Array.isArray(data) ? data : [],
        loading: false,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error al cargar asistencias';
      set({ error: message, attendances: [], loading: false });
      toast.error('Error al cargar asistencias');
    }
  },

  getAttendanceByDateAndStudent: async (date: string, studentId: string) => {
    try {
      const data = await attendancesApi.getByDateAndStudent(date, studentId);
      return data ?? null;
    } catch {
      return null;
    }
  },

  createAttendance: async (data) => {
    try {
      const newAttendance = await attendancesApi.create(data);
      set((state) => ({
        attendances: [newAttendance, ...state.attendances],
      }));
      return true;
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || 'Error al registrar asistencia');
      return false;
    }
  },

  updateAttendance: async (id, data) => {
    try {
      const updatedAttendance = await attendancesApi.update(id, data);
      set((state) => ({
        attendances: state.attendances.map((a) =>
          a.id === id ? updatedAttendance : a,
        ),
      }));
      return true;
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || 'Error al actualizar asistencia');
      return false;
    }
  },

  deleteAttendance: async (id) => {
    try {
      await attendancesApi.delete(id);
      set((state) => ({
        attendances: state.attendances.filter((a) => a.id !== id),
      }));
      toast.success('Asistencia eliminada');
      return true;
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || 'Error al eliminar asistencia');
      return false;
    }
  },
}));
