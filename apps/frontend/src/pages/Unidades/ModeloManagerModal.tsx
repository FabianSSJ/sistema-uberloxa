import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useModelos, useCreateModelo, useUpdateModelo, useDeleteModelo } from '../../features/modelos/hooks/useModelos';
import { useMarcas } from '../../features/marcas/hooks/useMarcas';
import { notify } from '../../components/ui/toast';
import { Edit2, Trash2, Plus } from 'lucide-react';

interface ModeloManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModeloManagerModal: React.FC<ModeloManagerModalProps> = ({ isOpen, onClose }) => {
  const { data: modelos = [], isLoading: loadingModelos } = useModelos();
  const { data: marcas = [], isLoading: loadingMarcas } = useMarcas();
  
  const createMutation = useCreateModelo();
  const updateMutation = useUpdateModelo();
  const deleteMutation = useDeleteModelo();

  const [nombre, setNombre] = useState('');
  const [marcaId, setMarcaId] = useState<number | undefined>();
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !marcaId) return;

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: { nombre, marcaId } });
      } else {
        await createMutation.mutateAsync({ nombre, marcaId });
      }
      setNombre('');
      setEditingId(null);
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Error al guardar el modelo');
    }
  };

  const handleEdit = (id: number, currentNombre: string, currentMarcaId: number) => {
    setEditingId(id);
    setNombre(currentNombre);
    setMarcaId(currentMarcaId);
  };

  const [modeloToDelete, setModeloToDelete] = useState<{ id: number; nombre: string } | null>(null);

  const handleDelete = (id: number, nombre: string) => {
    setModeloToDelete({ id, nombre });
  };

  const confirmDelete = async () => {
    if (!modeloToDelete) return;
    try {
      await deleteMutation.mutateAsync(modeloToDelete.id);
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Error al eliminar el modelo (puede estar en uso)');
    }
    setModeloToDelete(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestión de Modelos">
      <div className="flex flex-col gap-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-35">
              <Select
                label="Marca"
                options={marcas.map(m => ({ value: m.id, label: m.nombre }))}
                value={marcaId}
                onChange={(val) => setMarcaId(Number(val))}
                placeholder="Seleccione..."
                searchable
              />
            </div>
            <div className="flex-1 min-w-35">
              <Input
                label={editingId ? 'Editar Modelo' : 'Nuevo Modelo'}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Tucson"
              />
            </div>
            <Button 
              type="submit" 
              isLoading={createMutation.isPending || updateMutation.isPending}
              disabled={!nombre.trim() || !marcaId}
            >
              {editingId ? 'Guardar' : <Plus size={20} />}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setNombre(''); }}>
                Cancelar
              </Button>
            )}
          </div>
        </form>

        <div className="border border-gray-200 rounded-md overflow-hidden max-h-60 overflow-y-auto">
          {loadingModelos || loadingMarcas ? (
            <div className="p-4 text-center text-gray-500">Cargando modelos...</div>
          ) : modelos.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No hay modelos registrados.</div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold sticky top-0 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Marca</th>
                  <th className="px-4 py-2">Modelo</th>
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {modelos.map(modelo => (
                  <tr key={modelo.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500">#{modelo.id}</td>
                    <td className="px-4 py-2 text-gray-600">{modelo.marca?.nombre}</td>
                    <td className="px-4 py-2 font-medium text-gray-800">{modelo.nombre}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => handleEdit(modelo.id, modelo.nombre, modelo.marcaId)} className="p-1 text-blue-600 hover:bg-blue-100 rounded mr-1">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(modelo.id, modelo.nombre)} className="p-1 text-red-600 hover:bg-red-100 rounded">
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

      <ConfirmDialog
        isOpen={modeloToDelete !== null}
        onClose={() => setModeloToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar Modelo"
        message={
          <span>
            ¿Eliminar el modelo <span className="font-bold">"{modeloToDelete?.nombre}"</span>?
          </span>
        }
        confirmText="Sí, Eliminar"
      />
    </Modal>
  );
};
