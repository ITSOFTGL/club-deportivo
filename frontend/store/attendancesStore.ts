// store/attendancesStore.ts
import { create } from 'zustand';
import { Attendance, CreateAttendanceDto, UpdateAttendanceDto } from '@/lib/api/attendances';
import attendancesApi from '@/lib/api/attendances';
import toast from 'react-hot-toast';

interface AttendancesState {
  attendances: Attendance[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedDate: string;
  selectedShiftId: string;
  setSearchTerm: (term: string) => void;
  setSelectedDate: (date: string) => void;
  setSelectedShiftId: (shiftId: string) => void;
  fetchAttendances: () => Promise<void>;
  createAttendance: (data: CreateAttendanceDto) => Promise<boolean>;
  updateAttendance: (id: string, data: UpdateAttendanceDto) => Promise<boolean>;
  deleteAttendance: (id: string) => Promise<boolean>;
}

export const useAttendancesStore = create<AttendancesState>((set, get) => ({
  attendances: [],
  loading: false,
  error: null,
  searchTerm: '',
  selectedDate: new Date().toISOString().split('T')[0],
  selectedShiftId: '',

  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedShiftId: (shiftId) => set({ selectedShiftId: shiftId }),

  fetchAttendances: async () => {
    set({ loading: true, error: null });
    try {
      const data = await attendancesApi.getAll();
      set({ attendances: Array.isArray(data) ? data : [], loading: false });
    } catch (error: any) {
      console.error('Error fetching attendances:', error);
      set({ error: error.message, attendances: [], loading: false });
      toast.error('Error al cargar asistencias');
    }
  },

  createAttendance: async (data) => {
    set({ loading: true });
    try {
      const newAttendance = await attendancesApi.create(data);
      set((state) => ({
        attendances: [newAttendance, ...state.attendances],
        loading: false,
      }));
      toast.success('Asistencia registrada exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error creating attendance:', error);
      toast.error(error?.message || 'Error al registrar asistencia');
      set({ loading: false });
      return false;
    }
  },

  updateAttendance: async (id, data) => {
    set({ loading: true });
    try {
      const updatedAttendance = await attendancesApi.update(id, data);
      set((state) => ({
        attendances: state.attendances.map((a) => (a.id === id ? updatedAttendance : a)),
        loading: false,
      }));
      toast.success('Asistencia actualizada exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      toast.error(error?.message || 'Error al actualizar asistencia');
      set({ loading: false });
      return false;
    }
  },

  deleteAttendance: async (id) => {
    set({ loading: true });
    try {
      await attendancesApi.delete(id);
      set((state) => ({
        attendances: state.attendances.filter((a) => a.id !== id),
        loading: false,
      }));
      toast.success('Asistencia eliminada exitosamente');
      return true;
    } catch (error: any) {
      console.error('Error deleting attendance:', error);
      toast.error(error?.message || 'Error al eliminar asistencia');
      set({ loading: false });
      return false;
    }
  },
}));