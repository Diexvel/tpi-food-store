import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, UtensilsCrossed, Shield, LogOut } from 'lucide-react';
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
    <header className="sticky top-0 z-40 bg-[#F6F1EA]/90 backdrop-blur-md border-b border-[#EAE1D3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo estilo AMBER / INTERFACE */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-[#B84A1C] flex items-center justify-center text-white shadow-amber-pill group-hover:bg-[#A23F15] transition-all duration-200">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-[#1F1E1D] tracking-tight block leading-tight">
                  FOOD Store
                </span>
              </div>
              <span className="text-[10px] text-[#B84A1C] font-bold uppercase tracking-widest block">
                Un lugar para comer rico y economico
              </span>
            </div>
          </Link>

          {/* Links Principales */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              to="/"
              className="px-4 py-2 rounded-full text-sm font-semibold text-[#6E6862] hover:text-[#1F1E1D] hover:bg-[#EFE6DA] transition-colors"
            >
              Catálogo
            </Link>

            {usuario && (
              <Link
                to="/mis-pedidos"
                className="px-4 py-2 rounded-full text-sm font-semibold text-[#6E6862] hover:text-[#1F1E1D] hover:bg-[#EFE6DA] transition-colors"
              >
                Mis Pedidos
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin/resumen"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-[#B84A1C] bg-[#FBECE1] border border-[#F2D7C3] hover:bg-[#F8DECB] transition-colors"
              >
                <Shield className="w-4 h-4 text-[#B84A1C]" />
                Panel Admin
              </Link>
            )}
          </nav>

          {/* Acciones del Usuario & Carrito */}
          <div className="flex items-center gap-3">
            {/* Botón Carrito */}
            <Link
              to="/carrito"
              className="relative p-2.5 rounded-2xl border border-[#DECFC0] bg-[#FDFBF7] text-[#1F1E1D] hover:bg-[#F3ECE2] transition-colors flex items-center justify-center shadow-xs"
              aria-label="Ver carrito"
            >
              <ShoppingBag className="w-5 h-5 text-[#B84A1C]" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#B84A1C] text-white text-[11px] font-bold flex items-center justify-center shadow-amber-pill animate-scale-up">
                  {totalItems}
                </span>
              )}
            </Link>

            {usuario ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-[#1F1E1D]">{usuario.full_name}</span>
                  <span className="text-[10px] text-[#8C827A] capitalize font-medium">{usuario.role}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleLogout}
                  className="text-[#6E6862] hover:text-[#B84A1C] hover:border-[#F2D7C3]"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Ingresar
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Crear Cuenta
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
