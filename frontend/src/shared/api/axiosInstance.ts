import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const status = error.response?.status;
    const detail = error.response?.data?.detail;

    // Ante 401 fuera de /auth/token y /auth/me, o ante 400 con detail "Cuenta de usuario desactivada"
    const isAuthToken = url.includes('/auth/token');
    const isAuthMe = url.includes('/auth/me');
    const isDesactivada = status === 400 && typeof detail === 'string' && detail.toLowerCase().includes('desactivada');

    if ((status === 401 && !isAuthToken && !isAuthMe) || isDesactivada) {
      useAuthStore.getState().limpiarSesion();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
