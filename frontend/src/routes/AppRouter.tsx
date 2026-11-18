import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../shared/layout/MainLayout';
import { AdminLayout } from '../shared/layout/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Public & Client Pages
import { CatalogoPage } from '../features/productos/pages/CatalogoPage';
import { CarritoPage } from '../features/pedidos/pages/CarritoPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { UnauthorizedPage } from '../features/auth/pages/UnauthorizedPage';
import { CheckoutPage } from '../features/pedidos/pages/CheckoutPage';
import { MisPedidosPage } from '../features/pedidos/pages/MisPedidosPage';

// Admin Pages
import { AdminResumenPage } from '../features/pedidos/pages/AdminResumenPage';
import { AdminCategoriasPage } from '../features/categorias/pages/AdminCategoriasPage';
import { AdminProductosPage } from '../features/productos/pages/AdminProductosPage';
import { AdminPedidosPage } from '../features/pedidos/pages/AdminPedidosPage';
import { AdminUsuariosPage } from '../features/usuarios/pages/AdminUsuariosPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public & Client routes under MainLayout ── */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<CatalogoPage />} />
          <Route path="/carrito" element={<CarritoPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected: authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/mis-pedidos" element={<MisPedidosPage />} />
          </Route>
        </Route>

        {/* ── Admin routes under AdminLayout ── */}
        <Route element={<ProtectedRoute requiredRole="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/resumen" replace />} />
            <Route path="/admin/resumen" element={<AdminResumenPage />} />
            <Route path="/admin/categorias" element={<AdminCategoriasPage />} />
            <Route path="/admin/productos" element={<AdminProductosPage />} />
            <Route path="/admin/pedidos" element={<AdminPedidosPage />} />
            <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
