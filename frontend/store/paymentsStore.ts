import { create } from 'zustand';
import paymentsApi, { CreatePaymentDto, Payment } from '@/lib/api/payments';
import toast from 'react-hot-toast';

interface PaymentsState {
  payments: Payment[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchPayments: () => Promise<void>;
  registerPayment: (data: CreatePaymentDto) => Promise<boolean>;
}

export const usePaymentsStore = create<PaymentsState>((set, get) => ({
  payments: [],
  loading: false,
  searchTerm: '',

  setSearchTerm: (term) => set({ searchTerm: term }),

  fetchPayments: async () => {
    set({ loading: true });
    try {
      const data = await paymentsApi.getAll();
      set({ payments: Array.isArray(data) ? data : [], loading: false });
    } catch {
      toast.error('Error al cargar pagos');
      set({ payments: [], loading: false });
    }
  },

  registerPayment: async (data) => {
    set({ loading: true });
    try {
      await paymentsApi.create(data);
      await get().fetchPayments();
      toast.success('Pago registrado');
      return true;
    } catch (error: any) {
      toast.error(error?.message || 'Error al registrar pago');
      set({ loading: false });
      return false;
    }
  },
}));
