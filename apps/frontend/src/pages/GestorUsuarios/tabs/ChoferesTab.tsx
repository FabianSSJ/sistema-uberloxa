import React, { useState } from 'react';
import { useChoferes, useCreateChofer, useUpdateChofer, useDeleteChofer } from '../../../features/choferes/hooks/useChoferes';
import { Button } from '../../../components/ui/Button';
import { Edit2, Trash2, Plus } from 'lucide-react';

export const ChoferesTab = () => {
  const { data: choferes = [], isLoading } = useChoferes();
  const createMutation = useCreateChofer();
  const updateMutation = useUpdateChofer();
  const deleteMutation = useDeleteChofer();

  const handleCreate = () => {
    const nombre = prompt('Nombre del chofer:');
    if (!nombre) return;
    const telefono = prompt('Teléfono (opcional):');
    
    createMutation.mutate({ nombre, telefono: telefono || undefined });
  };

  const handleEdit = (chofer: any) => {
    const nombre = prompt('Nombre del chofer:', chofer.nombre);
    if (!nombre) return;
    const telefono = prompt('Teléfono:', chofer.telefono || '');
    
    updateMutation.mutate({ id: chofer.id, data: { nombre, telefono } });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Eliminar chofer? Las unidades asociadas se quedarán sin chofer asignado.')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Gestión de Choferes</h3>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus size={16} /> Nuevo Chofer
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {choferes.map((c) => (
              <tr key={c.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.telefono || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(c)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
