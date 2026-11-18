// Tipos para el módulo de usuarios (admin)
export interface Usuario {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: 'admin' | 'user';
  disabled: boolean;
  created_at: string;
}

export interface UsuariosPaginados {
  total: number;
  items: Usuario[];
}
