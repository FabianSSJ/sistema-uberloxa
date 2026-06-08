import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useUnidades, useCreateUnidad, useUpdateUnidad } from '../../features/unidades/hooks/useUnidades';
import { useMarcas } from '../../features/marcas/hooks/useMarcas';
import { useModelos } from '../../features/modelos/hooks/useModelos';

interface UnidadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: number | null;
}

export const UnidadFormModal: React.FC<UnidadFormModalProps> = ({ isOpen, onClose, editingId }) => {
  const { data: unidades = [] } = useUnidades();
  const { data: marcas = [] } = useMarcas();
  const { data: modelos = [] } = useModelos();
  
  const createMutation = useCreateUnidad();
  const updateMutation = useUpdateUnidad();

  const [formData, setFormData] = useState({
    placa: '',
    marcaId: undefined as number | undefined,
    modeloId: undefined as number | undefined,
    color: '',
    anio: new Date().getFullYear(),
    choferNombre: '',
    choferTelefono: '',
  });

  useEffect(() => {
    if (editingId && isOpen) {
      const unidad = unidades.find(u => u.id === editingId);
      if (unidad) {
        setFormData({
          placa: unidad.placa,
          marcaId: unidad.modelo?.marcaId,
          modeloId: unidad.modeloId,
          color: unidad.color,
          anio: unidad.anio,
          choferNombre: unidad.choferNombre,
          choferTelefono: unidad.choferTelefono || '',
        });
      }
    } else {
      setFormData({
        placa: '',
        marcaId: undefined,
        modeloId: undefined,
        color: '',
        anio: new Date().getFullYear(),
        choferNombre: '',
        choferTelefono: '',
      });
    }
  }, [editingId, isOpen, unidades]);

  // Modelos filtrados por la marca seleccionada
  const modelosFiltrados = modelos.filter(m => m.marcaId === formData.marcaId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.modeloId) {
      alert('Debe seleccionar un modelo');
      return;
    }

    const payload = {
      placa: formData.placa,
      modeloId: formData.modeloId,
      color: formData.color,
      anio: Number(formData.anio),
      choferNombre: formData.choferNombre,
      choferTelefono: formData.choferTelefono || undefined,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar la unidad');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? 'Editar Unidad' : 'Nueva Unidad'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Datos del Chofer</h4>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input 
                label="Nombre Chofer *" 
                value={formData.choferNombre}
                onChange={(e) => setFormData({ ...formData, choferNombre: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="flex-1">
              <Input 
                label="Teléfono Chofer" 
                value={formData.choferTelefono}
                onChange={(e) => setFormData({ ...formData, choferTelefono: e.target.value })}
                placeholder="Opcional"
              />
              {(formData.choferTelefono?.length || 0) > 10 && (
                <span className="text-xs text-amber-600 mt-1 inline-block font-medium">Nota: El número tiene más de 10 dígitos.</span>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-2 pt-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Datos del Vehículo</h4>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input 
                label="Placa *" 
                value={formData.placa}
                onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                placeholder="Ej: LBA-1234"
                required
              />
            </div>
            <div className="flex-1">
              <Input 
                label="Año *" 
                type="number"
                value={formData.anio.toString()}
                onChange={(e) => setFormData({ ...formData, anio: parseInt(e.target.value) || new Date().getFullYear() })}
                required
              />
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Select 
                label="Marca *"
                options={marcas.map(m => ({ value: m.id, label: m.nombre }))}
                value={formData.marcaId}
                onChange={(val) => setFormData({ ...formData, marcaId: Number(val), modeloId: undefined })}
                placeholder="Seleccione..."
                searchable
              />
            </div>
            <div className="flex-1">
              <Select 
                label="Modelo *"
                options={modelosFiltrados.map(m => ({ value: m.id, label: m.nombre }))}
                value={formData.modeloId}
                onChange={(val) => setFormData({ ...formData, modeloId: Number(val) })}
                placeholder={formData.marcaId ? "Seleccione modelo..." : "Primero elija marca"}
                searchable
              />
            </div>
          </div>

          <Input 
            label="Color *" 
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="Ej: Amarillo"
            required
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
            {editingId ? 'Guardar Cambios' : 'Crear Unidad'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
