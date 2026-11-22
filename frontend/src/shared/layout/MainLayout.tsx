import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F1EA] text-[#1F1E1D]">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Outlet />
      </main>
      <footer className="bg-[#FAF4EB] border-t border-[#EAE1D3] py-8 mt-16 text-center text-xs text-[#8C827A]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} AMBER / Food Store. Todos los derechos reservados.</p>
          <p className="text-[#A49C94] uppercase tracking-wider text-[11px] font-semibold">
            Trabajo Práctico Integrador — Programación 4
          </p>
        </div>
      </footer>
    </div>
  );
};
