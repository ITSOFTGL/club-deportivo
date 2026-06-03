// lib/api/students.ts
import api from '../axios';

export interface Student {
  id: string;
  name: string;
  lastName: string;
  birthDate: string;
  documentId?: string;
  gender?: 'MASCULINO' | 'FEMENINO' | 'OTRO';
  weight?: number;
  height?: number;
  shoeSize?: number;
  shirtSize?: string;
  pantsSize?: string;
  medicalNotes?: string;
  bloodType?: 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE' | 'AB_POSITIVE' | 'AB_NEGATIVE';
  emergencyContact?: string;
  emergencyPhone?: string;
  school?: string;
  grade?: string;
  hasAcefi?: boolean;
  hasAcf?: boolean;
  acefiDate?: string;
  acfDate?: string;
  status: 'ACTIVE' | 'INACTIVE';
  discountPercent?: number;
  monthlyFeeOverride?: number | null;
  profilePhotoUrl?: string | null;
  categoryMonthlyPrice?: number;
  effectiveMonthlyFee?: number;
  membershipPaidUntil?: string | null;
  membershipActive?: boolean;
  membershipStatus?: string;
  membershipLabel?: string;
  membershipDaysRemaining?: number | null;
  parentId?: string;
  enrollmentDate?: string;
  branchId: string;
  categoryId: string;
  parent?: { name: string; lastName: string; email: string; phone?: string };
  guardians?: Array<{
    name: string;
    lastName: string;
    phone: string;
    isPrimary: boolean;
  }>;
  branch?: { name: string };
  category?: { name: string; monthlyPrice?: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStudentDto {
  name: string;
  lastName: string;
  birthDate: string;
  documentId?: string;
  gender?: 'MASCULINO' | 'FEMENINO' | 'OTRO';
  weight?: number;
  height?: number;
  shoeSize?: number;
  shirtSize?: string;
  pantsSize?: string;
  medicalNotes?: string;
  bloodType?: 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE' | 'AB_POSITIVE' | 'AB_NEGATIVE';
  emergencyContact?: string;
  emergencyPhone?: string;
  school?: string;
  grade?: string;
  hasAcefi?: boolean;
  hasAcf?: boolean;
  acefiDate?: string;
  acfDate?: string;
  parentId?: string;
  enrollmentDate?: string;
  branchId: string;
  categoryId: string;
  discountPercent?: number;
  monthlyFeeOverride?: number;
}

export interface UpdateStudentDto extends Partial<CreateStudentDto> {
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface BirthdayStudent {
  id: string;
  name: string;
  lastName: string;
  age: number;
  profilePhotoUrl?: string | null;
  parentPhone?: string | null;
  parentName?: string | null;
  category?: string;
  branch?: string;
}

const studentsApi = {
  getAll: (): Promise<Student[]> => api.get('/students'),
  getMembershipAlerts: (): Promise<Student[]> => api.get('/students/membership-alerts'),
  getBirthdaysToday: (): Promise<BirthdayStudent[]> =>
    api.get('/students/birthdays/today'),
  getById: (id: string): Promise<Student> => api.get(`/students/${id}`),
  create: (data: CreateStudentDto): Promise<Student> => api.post('/students', data),
  update: (id: string, data: UpdateStudentDto): Promise<Student> =>
    api.patch(`/students/${id}`, data),
  uploadPhoto: (id: string, file: File): Promise<Student> => {
    const form = new FormData();
    form.append('photo', file);
    return api.post(`/students/${id}/photo`, form);
  },
  delete: (id: string): Promise<void> => api.delete(`/students/${id}`),
};

export default studentsApi;