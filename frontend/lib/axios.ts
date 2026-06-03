// lib/axios.ts
import axios from 'axios';
import { getSession } from 'next-auth/react';
import { rewriteUsersApiPath } from './rewriteUsersApiPath';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - reescribe /users → /usuarios y añade token
api.interceptors.request.use(async (config) => {
  if (config.url) {
    config.url = rewriteUsersApiPath(config.url);
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
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
    const status = error.response?.status;
    const data = error.response?.data;
    // Solo redirigir si el 401 viene del API Nest (JWT inválido/expirado).
    // Algunos proxies devuelven 401 en rutas bloqueadas (ej. /users) sin cuerpo Nest.
    const isNestAuthError =
      status === 401 &&
      data &&
      typeof data === 'object' &&
      ('statusCode' in data || 'message' in data);

    if (isNestAuthError && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

export default api;