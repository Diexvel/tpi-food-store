import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';
import { Button } from '../../../shared/ui/Button';
import { Card } from '../../../shared/ui/Card';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full p-8 text-center border-stone-200">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 mb-2">Acceso No Autorizado</h2>
        <p className="text-sm text-stone-500 mb-6">
          No tienes los permisos necesarios para acceder a este recurso. Esta sección está reservada para administradores del sistema.
        </p>
        <Link to="/">
          <Button variant="primary" className="w-full">
            <Home className="w-4 h-4 mr-2" />
            Volver al Inicio
          </Button>
        </Link>
      </Card>
    </div>
  );
};
