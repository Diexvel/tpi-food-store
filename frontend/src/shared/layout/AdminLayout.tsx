import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Tag,
  Package,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const NAV_ITEMS = [
  { to: '/admin/resumen', label: 'Resumen', icon: TrendingUp },
  { to: '/admin/categorias', label: 'Categorías', icon: Tag },
  { to: '/admin/productos', label: 'Productos', icon: Package },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
];

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#FAF5ED] border-r border-[#EAE1D3]">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#EAE1D3]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#B84A1C] flex items-center justify-center text-white shadow-amber-pill">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-[#1F1E1D] block tracking-tight">
              AMBER <span className="text-[#B84A1C] font-light">/</span> ADMIN
            </span>
            <span className="text-[9px] text-[#B84A1C] font-bold uppercase tracking-widest">
              Control Panel
            </span>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-6 space-y-1.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[#B84A1C] text-white shadow-amber-pill'
                  : 'text-[#6E6862] hover:bg-[#EFE6DA] hover:text-[#1F1E1D]'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Usuario + botones inferiores */}
      <div className="px-4 py-5 border-t border-[#EAE1D3] space-y-2">
        {usuario && (
          <div className="px-4 py-3 rounded-2xl bg-[#FDFBF7] border border-[#EAE1D3] shadow-xs">
            <p className="text-xs font-bold text-[#1F1E1D] truncate">{usuario.full_name}</p>
            <p className="text-[10px] text-[#8C827A] truncate font-mono">@{usuario.username}</p>
          </div>
        )}
        <NavLink
          to="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold text-[#6E6862] hover:bg-[#EFE6DA] hover:text-[#1F1E1D] transition-all"
        >
          <ChevronRight className="w-4 h-4 text-[#B84A1C]" />
          Ir al Catálogo Público
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#F6F1EA] overflow-hidden text-[#1F1E1D]">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-[#1F1E1D]/40 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 z-50 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar mobile */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3.5 bg-[#FAF5ED] border-b border-[#EAE1D3]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-[#EFE6DA] text-[#6E6862] cursor-pointer"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-[#1F1E1D] text-sm">Panel de Administración</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
