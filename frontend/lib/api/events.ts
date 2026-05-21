// lib/api/events.ts
import api from '../axios';

export interface Event {
  id: string;
  title: string;
  description?: string;
  type: 'CHAMPIONSHIP' | 'FRIENDLY' | 'CAMP' | 'CLINIC';
  categoryId?: string;
  branchId?: string;
  startDate: string;
  endDate: string;
  registrationStart: string;
  registrationEnd: string;
  cost: number;
  earlyBirdCost?: number;
  earlyBirdDate?: string;
  location: string;
  venueName?: string;
  maxParticipants: number;
  currentParticipants: number;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  bannerImage?: string;
  category?: { name: string };
  branch?: { name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEventDto {
  title: string;
  description?: string;
  type: 'CHAMPIONSHIP' | 'FRIENDLY' | 'CAMP' | 'CLINIC';
  categoryId?: string;
  branchId?: string;
  startDate: string;
  endDate: string;
  registrationStart: string;
  registrationEnd: string;
  cost: number;
  earlyBirdCost?: number;
  earlyBirdDate?: string;
  location: string;
  venueName?: string;
  maxParticipants: number;
}

export interface UpdateEventDto extends Partial<CreateEventDto> {
  status?: 'DRAFT' | 'OPEN' | 'CLOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

const eventsApi = {
  getAll: (): Promise<Event[]> => api.get('/events'),
  getById: (id: string): Promise<Event> => api.get(`/events/${id}`),
  create: (data: CreateEventDto): Promise<Event> => api.post('/events', data),
  update: (id: string, data: UpdateEventDto): Promise<Event> => api.patch(`/events/${id}`, data),
  delete: (id: string): Promise<void> => api.delete(`/events/${id}`),
};

export default eventsApi;