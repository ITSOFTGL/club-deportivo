// lib/api/users.ts
import api from '../axios';

export interface User {
  id: string;
  email: string;
  name: string;
  lastName?: string;
  documentId?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  gender?: 'MASCULINO' | 'FEMENINO' | 'OTRO';
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'COLLECTOR' | 'PARENT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  lastName?: string;
  documentId?: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  gender?: 'MASCULINO' | 'FEMENINO' | 'OTRO';
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'COLLECTOR' | 'PARENT';
}

export interface UpdateUserDto extends Partial<CreateUserDto> {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface ChangeRoleDto {
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'COLLECTOR' | 'PARENT';
}

export interface ChangeStatusDto {
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface ResetPasswordDto {
  newPassword: string;
}

const BASE = '/usuarios';

const usersApi = {
  getAll: (): Promise<User[]> => api.get(BASE),
  getById: (id: string): Promise<User> => api.get(`${BASE}/${id}`),
  create: (data: CreateUserDto): Promise<User> => api.post(BASE, data),
  update: (id: string, data: UpdateUserDto): Promise<User> =>
    api.patch(`${BASE}/${id}`, data),
  delete: (id: string): Promise<void> => api.delete(`${BASE}/${id}`),
  changeRole: (id: string, data: ChangeRoleDto): Promise<User> =>
    api.patch(`${BASE}/${id}/role`, data),
  changeStatus: (id: string, data: ChangeStatusDto): Promise<User> =>
    api.patch(`${BASE}/${id}/status`, data),
  resetPassword: (id: string, data: ResetPasswordDto): Promise<void> =>
    api.patch(`${BASE}/${id}/password`, data),
};

export default usersApi;
