// lib/axios.ts
import axios from 'axios';
import { getSession } from 'next-auth/react';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - añade token automáticamente
api.interceptors.request.use(async (config) => {
  try {
    const session = await getSession();
    if (session?.user?.accessToken) {
      config.headers.Authorization = `Bearer ${session.user.accessToken}`;
    }
  } catch (error) {
    console.error('Error getting session:', error);
  }
  return config;
});

// Response interceptor - maneja la respuesta
api.interceptors.response.use(
  (response) => {
    // Devolvemos response.data directamente para facilitar el uso
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;