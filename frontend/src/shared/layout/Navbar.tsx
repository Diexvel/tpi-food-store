import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User as UserIcon, LogOut, Shield, UtensilsCrossed } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuthStore();
  const totalItems = useCartStore((state) => state.totalItems());

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = usuario?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-xs group-hover:bg-amber-700 transition-colors">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-stone-900 tracking-tight block leading-tight">Food Store</span>
              <span className="text-[10px] text-amber-700 font-semibold uppercase tracking-wider block">Sabores Gourmet</span>
            </div>
          </Link>

          {/* Links Principales */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              to="/"
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              Catálogo
            </Link>

            {usuario && (
              <Link
                to="/mis-pedidos"
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                Mis Pedidos
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin/resumen"
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-sm font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <Shield className="w-4 h-4 text-amber-600" />
                Panel Admin
              </Link>
            )}
          </nav>

          {/* Acciones del Usuario & Carrito */}
          <div className="flex items-center gap-3">
            {/* Botón Carrito */}
            <Link
              to="/carrito"
              className="relative p-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors flex items-center justify-center"
              aria-label="Ver carrito"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shadow-xs animate-scale-up">
                  {totalItems}
                </span>
              )}
            </Link>

            {usuario ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-stone-900">{usuario.full_name}</span>
                  <span className="text-[10px] text-stone-500 capitalize">{usuario.role}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-stone-600 hover:text-rose-600 hover:border-rose-300"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    <UserIcon className="w-4 h-4" />
                    Ingresar
                  </Button>
                </Link>
                <Link to="/register" className="hidden sm:inline-block">
                  <Button variant="primary" size="sm">
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
