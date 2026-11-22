import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from '@tanstack/react-form';
import { UtensilsCrossed, LogIn, AlertCircle } from 'lucide-react';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../../../store/authStore';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Card } from '../../../shared/ui/Card';
import { handleApiError } from '../../../shared/api/handleApiError';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setUsuario = useAuthStore((state) => state.setUsuario);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      setErrorMsg(null);
      setLoading(true);
      try {
        await authApi.login(value);
        // Obtener el perfil del usuario autenticado
        const user = await authApi.getMe();
        setUsuario(user);

        // Si es admin, redirigir a admin/resumen o a home si es user
        if (user.role === 'admin') {
          navigate('/admin/resumen');
        } else {
          navigate('/');
        }
      } catch (err) {
        setErrorMsg(handleApiError(err, 'Usuario o contraseña incorrectos'));
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full p-8 sm:p-10 rounded-[32px] shadow-amber-soft border-[#EAE1D3]">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#B84A1C] rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-amber-pill">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#B84A1C] block mb-1">
            AMBER / AUTH
          </span>
          <h2 className="text-2xl font-black text-[#1F1E1D] tracking-tight">Iniciar Sesión</h2>
          <p className="text-xs text-[#6E6862] mt-1">Ingresa tus credenciales para continuar</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="username"
            validators={{
              onChange: ({ value }) => (!value ? 'El nombre de usuario es obligatorio' : undefined),
            }}
          >
            {(field) => (
              <Input
                label="Usuario"
                type="text"
                placeholder="ej. juanperez"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.errors?.[0] ? String(field.state.meta.errors[0]) : undefined}
                autoComplete="username"
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => (!value ? 'La contraseña es obligatoria' : undefined),
            }}
          >
            {(field) => (
              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={field.state.meta.errors?.[0] ? String(field.state.meta.errors[0]) : undefined}
                autoComplete="current-password"
              />
            )}
          </form.Field>

          <Button type="submit" variant="primary" className="w-full mt-2" loading={loading}>
            <LogIn className="w-4 h-4 mr-2" />
            Ingresar
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#EAE1D3] text-center text-xs text-[#6E6862]">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="font-bold text-[#B84A1C] hover:underline">
            Regístrate aquí
          </Link>
        </div>
      </Card>
    </div>
  );
};
