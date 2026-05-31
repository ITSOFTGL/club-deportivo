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

const usersApi = {
  // Obtener todos los usuarios
  getAll: (): Promise<User[]> => api.get('/users'),
  
  // Obtener un usuario por ID
  getById: (id: string): Promise<User> => api.get(`/users/${id}`),
  
  // Crear usuario
  create: (data: CreateUserDto): Promise<User> => api.post('/users', data),
  
  // Actualizar usuario
  update: (id: string, data: UpdateUserDto): Promise<User> => api.patch(`/users/${id}`, data),
  
  // Eliminar usuario (soft delete)
  delete: (id: string): Promise<void> => api.delete(`/users/${id}`),
  
  // Cambiar rol
  changeRole: (id: string, data: ChangeRoleDto): Promise<User> => api.patch(`/users/${id}/role`, data),
  
  // Cambiar estado
  changeStatus: (id: string, data: ChangeStatusDto): Promise<User> => api.patch(`/users/${id}/status`, data),
  
  // Restablecer contraseña
  resetPassword: (id: string, data: ResetPasswordDto): Promise<void> => api.patch(`/users/${id}/password`, data),
};

export default usersApi;