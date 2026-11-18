import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from '@tanstack/react-form';
import { UserPlus, UtensilsCrossed, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authApi } from '../api/authApi';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Card } from '../../../shared/ui/Card';
import { handleApiError } from '../../../shared/api/handleApiError';

const toStr = (v: unknown): string | undefined =>
  v != null ? String(v) : undefined;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      username: '',
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
    onSubmit: async ({ value }) => {
      setErrorMsg(null);
      setSuccessMsg(null);

      if (value.password !== value.confirm_password) {
        setErrorMsg('Las contraseñas no coinciden');
        return;
      }

      setLoading(true);
      try {
        await authApi.register({
          username: value.username,
          full_name: value.full_name,
          email: value.email,
          password: value.password,
        });

        setSuccessMsg('¡Cuenta creada exitosamente! Redirigiendo al login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } catch (err) {
        setErrorMsg(handleApiError(err, 'Error al registrar la cuenta'));
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full p-8 shadow-sm border-stone-200">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-xs">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Crear Cuenta</h2>
          <p className="text-sm text-stone-500 mt-1">Regístrate para realizar pedidos en Food Store</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
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
                error={toStr(field.state.meta.errors?.[0])}
                autoComplete="username"
              />
            )}
          </form.Field>

          <form.Field
            name="full_name"
            validators={{
              onChange: ({ value }) => (!value ? 'El nombre completo es obligatorio' : undefined),
            }}
          >
            {(field) => (
              <Input
                label="Nombre y Apellido"
                type="text"
                placeholder="ej. Juan Pérez"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={toStr(field.state.meta.errors?.[0])}
                autoComplete="name"
              />
            )}
          </form.Field>

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                if (!value) return 'El correo electrónico es obligatorio';
                if (!/\S+@\S+\.\S+/.test(value)) return 'Formato de correo electrónico inválido';
                return undefined;
              },
            }}
          >
            {(field) => (
              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="juan@ejemplo.com"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={toStr(field.state.meta.errors?.[0])}
                autoComplete="email"
              />
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => {
                if (!value) return 'La contraseña es obligatoria';
                if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
                return undefined;
              },
            }}
          >
            {(field) => (
              <Input
                label="Contraseña"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={toStr(field.state.meta.errors?.[0])}
                autoComplete="new-password"
              />
            )}
          </form.Field>

          <form.Field
            name="confirm_password"
            validators={{
              onChange: ({ value }) => (!value ? 'Confirma tu contraseña' : undefined),
            }}
          >
            {(field) => (
              <Input
                label="Confirmar Contraseña"
                type="password"
                placeholder="Repite la contraseña"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                error={toStr(field.state.meta.errors?.[0])}
                autoComplete="new-password"
              />
            )}
          </form.Field>

          <Button type="submit" variant="primary" className="w-full mt-3" loading={loading}>
            <UserPlus className="w-4 h-4 mr-2" />
            Registrarme
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-stone-100 text-center text-sm text-stone-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-amber-700 hover:text-amber-800 hover:underline">
            Ingresa aquí
          </Link>
        </div>
      </Card>
    </div>
  );
};
