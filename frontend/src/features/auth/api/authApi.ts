import { axiosInstance } from '../../../shared/api/axiosInstance';
import { User } from '../../../store/authStore';

export interface RegisterData {
  username: string;
  full_name: string;
  email: string;
  password: string;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export const authApi = {
  login: async (credentials: LoginFormData): Promise<{ message: string }> => {
    // El endpoint OAuth2 espera formulario urlencoded
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);

    const response = await axiosInstance.post<{ message: string }>('/auth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (userData: RegisterData): Promise<User> => {
    const response = await axiosInstance.post<User>('/auth/register', userData);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await axiosInstance.get<User>('/auth/me');
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>('/auth/logout');
    return response.data;
  },
};
