import React from 'react';
import { UsuariosTab } from './tabs/UsuariosTab';

export const GestorUsuariosPage = () => {
  return (
    <div className="animate-[fadeIn_0.5s_ease-in]">
      <h2 className="text-[1.75rem] mb-7.5 text-gray-800 font-bold">Gestor de Usuarios</h2>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <UsuariosTab />
      </div>
    </div>
  );
};
