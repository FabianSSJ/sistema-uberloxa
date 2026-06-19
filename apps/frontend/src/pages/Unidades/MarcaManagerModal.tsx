import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useMarcas, useCreateMarca, useUpdateMarca, useDeleteMarca } from '../../features/marcas/hooks/useMarcas';
import { notify } from '../../components/ui/toast';
import { Edit2, Trash2, Plus } from 'lucide-react';

interface MarcaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MarcaManagerModal: React.FC<MarcaManagerModalProps> = ({ isOpen, onClose }) => {
  const { data: marcas = [], isLoading } = useMarcas();
  const createMutation = useCreateMarca();
  const updateMutation = useUpdateMarca();
  const deleteMutation = useDeleteMarca();

  const [nombre, setNombre] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: { nombre } });
      } else {
        await createMutation.mutateAsync({ nombre });
      }
      setNombre('');
      setEditingId(null);
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Error al guardar la marca');
    }
  };

  const handleEdit = (id: number, currentNombre: string) => {
    setEditingId(id);
    setNombre(currentNombre);
  };

  const handleDelete = async (id: number, nombre: string) => {
    if (window.confirm(`¿Eliminar marca ${nombre}?`)) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error: any) {
        notify.error(error.response?.data?.message || 'Error al eliminar la marca (puede estar en uso)');
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestión de Marcas">
      <div className="flex flex-col gap-6">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1">
            <Input 
              label={editingId ? 'Editar Marca' : 'Nueva Marca'}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Toyota"
              autoFocus
            />
          </div>
          <Button 
            type="submit" 
            isLoading={createMutation.isPending || updateMutation.isPending}
            disabled={!nombre.trim()}
          >
            {editingId ? 'Guardar' : <Plus size={20} />}
          </Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setNombre(''); }}>
              Cancelar
            </Button>
          )}
        </form>

        <div className="border border-gray-200 rounded-md overflow-hidden max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Cargando marcas...</div>
          ) : marcas.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No hay marcas registradas.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold sticky top-0 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {marcas.map(marca => (
                  <tr key={marca.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500">#{marca.id}</td>
                    <td className="px-4 py-2 font-medium text-gray-800">{marca.nombre}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => handleEdit(marca.id, marca.nombre)} className="p-1 text-blue-600 hover:bg-blue-100 rounded mr-1">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(marca.id, marca.nombre)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
};
