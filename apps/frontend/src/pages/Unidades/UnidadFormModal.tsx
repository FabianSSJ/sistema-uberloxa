import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useUnidades, useCreateUnidad, useUpdateUnidad } from '../../features/unidades/hooks/useUnidades';
import { ColorPicker } from '../../components/ui/ColorPicker';
import { notify } from '../../components/ui/toast';

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
  const [colorIdentidad, setColorIdentidad] = useState<string | null>(null);

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
        setColorIdentidad((unidad as any).colorIdentidad ?? null);
      }
    } else {
      setFormData({
        numeroUnidad: '',
        choferNombre: '',
        placa: '',
        vehiculo: '',
        choferTelefono: '',
      });
      setColorIdentidad(null);
    }
  }, [editingId, isOpen, unidades]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Normalizamos: sacamos espacios invisibles que romperian la validacion numerica
    const numeroUnidad = formData.numeroUnidad.trim();

    if (!/^[0-9]+$/.test(numeroUnidad)) {
      notify.error("El número de unidad debe ser numérico (ej. 01, 12)");
      return;
    }

    const payload = {
      numeroUnidad,
      choferNombre: formData.choferNombre.trim(),
      placa: formData.placa.trim(),
      vehiculo: formData.vehiculo.trim(),
      choferTelefono: formData.choferTelefono.trim() || undefined,
      colorIdentidad,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error: any) {
      notify.error(error.response?.data?.message || 'Error al guardar la unidad');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? 'Editar Unidad' : 'Nueva Unidad'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <Input
            label="Número de Unidad *"
            value={formData.numeroUnidad}
            onChange={(e) => setFormData({ ...formData, numeroUnidad: e.target.value })}
            placeholder="Ej: 01"
            required
            autoFocus
          />
          <Input
            label="Chofer *"
            value={formData.choferNombre}
            onChange={(e) => setFormData({ ...formData, choferNombre: e.target.value })}
            placeholder="Nombres y apellidos, ej. José Lenin"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <Input
            label="Placa *"
            value={formData.placa}
            onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
            placeholder="Ej: LBD 3995"
            required
          />
          <Input
            label="Vehículo *"
            value={formData.vehiculo}
            onChange={(e) => setFormData({ ...formData, vehiculo: e.target.value })}
            placeholder="Marca, modelo, color"
            required
          />
        </div>

        <div className="border-t border-gray-100 mt-2 pt-4 flex flex-col gap-4">
          <Input
            label="Teléfono del Chofer"
            value={formData.choferTelefono}
            onChange={(e) => setFormData({ ...formData, choferTelefono: e.target.value })}
            placeholder="Opcional"
          />
          <ColorPicker
            label="Color de identidad de la unidad"
            value={colorIdentidad}
            onChange={setColorIdentidad}
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
