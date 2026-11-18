import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: 'admin' | 'user' | string;
  disabled: boolean;
  created_at: string;
}

interface AuthState {
  usuario: User | null;
  cargando: boolean;
  setUsuario: (usuario: User | null) => void;
  limpiarSesion: () => void;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      cargando: true,
      setUsuario: (usuario) => set({ usuario, cargando: false }),
      limpiarSesion: () => set({ usuario: null, cargando: false }),
      checkSession: async () => {
        set({ cargando: true });
        try {
          const response = await axios.get<User>(`${API_URL}/auth/me`, {
            withCredentials: true,
          });
          set({ usuario: response.data, cargando: false });
        } catch {
          set({ usuario: null, cargando: false });
        }
      },
      logout: async () => {
        try {
          await axios.post(
            `${API_URL}/auth/logout`,
            {},
            {
              withCredentials: true,
            }
          );
        } catch {
          // Si falla el endpoint, igual limpiamos el estado local
        } finally {
          set({ usuario: null, cargando: false });
        }
      },
    }),
    {
      name: 'foodstore-auth',
      partialize: (state) => ({ usuario: state.usuario }),
    }
  )
);
