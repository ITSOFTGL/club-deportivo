import api from '@/lib/axios';

export interface Payment {
  id: string;
  reservationId: string;
  amount: number;
  total: number;
  method: string;
  status: string;
  paymentDate?: string;
  expiresAt?: string;
  monthsCovered?: number;
  createdAt: string;
  students?: Array<{
    id: string;
    name: string;
    lastName: string;
    category?: { id: string; name: string; monthlyPrice?: number };
    parent?: { name: string; lastName: string; phone?: string; email?: string };
    guardians?: Array<{ name: string; lastName: string; phone: string }>;
  }>;
}

export interface PaymentHistory {
  id: string;
  studentId: string;
  month: string;
  amount: number;
  status: string;
  dueDate: string;
  paidDate?: string;
}

export interface CreatePaymentDto {
  studentId: string;
  amount: number;
  method?: 'QR' | 'CASH' | 'CARD' | 'TRANSFER';
  status?: 'PENDING' | 'PAID';
  monthsCovered?: number;
  paymentDate?: string;
  extendFromDate?: string;
  proofUrl?: string;
  notes?: string;
}

const paymentsApi = {
  getConfig: (): Promise<{ paymentQrUrl: string }> =>
    api.get('/payments/config'),
  uploadQr: (file: File): Promise<{ paymentQrUrl: string }> => {
    const form = new FormData();
    form.append('qr', file);
    return api.post('/payments/config/qr', form);
  },
  getAll: (): Promise<Payment[]> => api.get('/payments'),
  getByStudent: (studentId: string): Promise<PaymentHistory[]> =>
    api.get(`/payments/student/${studentId}`),
  create: (data: CreatePaymentDto): Promise<Payment> =>
    api.post('/payments', data),
  verify: (id: string): Promise<Payment> =>
    api.patch(`/payments/${id}/verify`),
  generateQr: (studentId: string, amount: number) =>
    api.post(`/payments/generate-qr/${studentId}`, { amount }),
};

export default paymentsApi;
