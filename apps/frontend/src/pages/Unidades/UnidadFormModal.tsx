import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useUnidades, useCreateUnidad, useUpdateUnidad } from '../../features/unidades/hooks/useUnidades';

interface UnidadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: number | null;
}

export const UnidadFormModal: React.FC<UnidadFormModalProps> = ({ isOpen, onClose, editingId }) => {
  const { data: unidades = [] } = useUnidades();
  
  const createMutation = useCreateUnidad();
  const updateMutation = useUpdateUnidad();

  const [formData, setFormData] = useState({
    numeroUnidad: '',
    choferNombre: '',
    placa: '',
    vehiculo: '',
    choferTelefono: '',
  });

  useEffect(() => {
    if (editingId && isOpen) {
      const unidad = unidades.find(u => u.id === editingId);
      if (unidad) {
        setFormData({
          numeroUnidad: unidad.numeroUnidad || '',
          choferNombre: unidad.choferNombre || '',
          placa: unidad.placa || '',
          vehiculo: unidad.vehiculo || '',
          choferTelefono: unidad.choferTelefono || '',
        });
      }
    } else {
      setFormData({
        numeroUnidad: '',
        choferNombre: '',
        placa: '',
        vehiculo: '',
        choferTelefono: '',
      });
    }
  }, [editingId, isOpen, unidades]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar numeroUnidad que sea numerico
    if (!/^[0-9]+$/.test(formData.numeroUnidad)) {
      alert("El número de unidad debe ser estrictamente numérico (ej. 01, 12, etc.)");
      return;
    }

    const payload = {
      numeroUnidad: formData.numeroUnidad,
      choferNombre: formData.choferNombre,
      placa: formData.placa,
      vehiculo: formData.vehiculo,
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
        
        <div className="flex gap-4">
          <div className="flex-1">
            <Input 
              label="Número de Unidad *" 
              value={formData.numeroUnidad}
              onChange={(e) => setFormData({ ...formData, numeroUnidad: e.target.value })}
              placeholder="Ej: 01"
              required
              autoFocus
            />
          </div>
          <div className="flex-[2]">
            <Input 
              label="Chofer (Nombres y Apellidos) *" 
              value={formData.choferNombre}
              onChange={(e) => setFormData({ ...formData, choferNombre: e.target.value })}
              placeholder="Ej: José Lenin Jiménez Calva"
              required
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-[1]">
            <Input 
              label="Placa *" 
              value={formData.placa}
              onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
              placeholder="Ej: LBD 3995"
              required
            />
          </div>
          <div className="flex-[2]">
            <Input 
              label="Vehículo (Marca, Modelo, Color) *" 
              value={formData.vehiculo}
              onChange={(e) => setFormData({ ...formData, vehiculo: e.target.value })}
              placeholder="Ej: Kia sóluto plomo"
              required
            />
          </div>
        </div>

        <div className="border-t border-gray-100 mt-2 pt-4">
          <Input 
            label="Teléfono del Chofer" 
            value={formData.choferTelefono}
            onChange={(e) => setFormData({ ...formData, choferTelefono: e.target.value })}
            placeholder="Opcional"
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
