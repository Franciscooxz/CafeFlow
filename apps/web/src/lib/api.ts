import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

// Todas las llamadas van al mismo origen (/api/v1/*).
// Next.js las proxea al backend via rewrites en next.config.mjs.
// Las cookies httpOnly (access_token, refresh_token) se envían automáticamente.
const API_URL = '/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor: agregar X-Tenant-ID desde localStorage (no es secreto)
api.interceptors.request.use((config) => {
  const tenantId =
    typeof window !== 'undefined'
      ? localStorage.getItem('cafeflow_tenant_id')
      : null;

  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }

  return config;
});

// Interceptor: refresh token automático en 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve();
  });
  failedQueue = [];
};

// Un 401 de estos endpoints no se resuelve renovando la sesión. En /auth/refresh
// además se bloquearía: quedaría en failedQueue esperando su propia respuesta.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/logout'];

function redirectToLogin() {
  useAuthStore.getState().logout();
  const segment = window.location.pathname.split('/')[1];
  const locale = /^(es|en|pt)$/.test(segment) ? segment : 'es';
  window.location.href = `/${locale}/login`;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = AUTH_ENDPOINTS.some((p) => originalRequest?.url?.startsWith(p));

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // El refresh_token cookie se envía automáticamente (httpOnly, same-origin).
        // El backend setea el nuevo access_token cookie en la respuesta.
        await api.post('/auth/refresh');

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
