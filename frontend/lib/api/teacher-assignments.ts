// lib/api/teacher-assignments.ts
import api from '../axios';

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  categoryShiftId: string;
  isLeadTeacher: boolean;
  role: string;
  isActive: boolean;
  assignedAt: string;
  assignedBy: string;
  teacher?: {
    id: string;
    name: string;
    lastName: string;
    email: string;
  };
  categoryShift?: {
    id: string;
    name: string;
    daysOfWeek?: string;
    startTime?: string;
    endTime?: string;
    category?: { id: string; name: string };
    shift?: { id: string; name: string; startTime?: string; endTime?: string };
    branch?: { id: string; name: string };
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTeacherAssignmentDto {
  teacherId: string;
  categoryShiftId: string;
  isLeadTeacher?: boolean;
  role?: string;
}

export interface UpdateTeacherAssignmentDto extends Partial<CreateTeacherAssignmentDto> {
  isActive?: boolean;
}

const teacherAssignmentsApi = {
  getAll: (): Promise<TeacherAssignment[]> => api.get('/teacher-assignments'),
  getById: (id: string): Promise<TeacherAssignment> => api.get(`/teacher-assignments/${id}`),
  create: (data: CreateTeacherAssignmentDto): Promise<TeacherAssignment> => api.post('/teacher-assignments', data),
  update: (id: string, data: UpdateTeacherAssignmentDto): Promise<TeacherAssignment> => api.patch(`/teacher-assignments/${id}`, data),
  delete: (id: string): Promise<void> => api.delete(`/teacher-assignments/${id}`),
};

export default teacherAssignmentsApi;