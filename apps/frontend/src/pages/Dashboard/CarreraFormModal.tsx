import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { formatCodigo } from '../../components/ui/CodigoBadge';
import { useClientes } from '../../features/clientes/hooks/useClientes';
import { useUnidades } from '../../features/unidades/hooks/useUnidades';
import { useCreateCarrera } from '../../features/carreras/hooks/useCarreras';
import { CreateCarreraDto } from '../../features/carreras/services/carreras.service';

interface CarreraFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CarreraFormModal: React.FC<CarreraFormModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: clientes = [] } = useClientes();
  const { data: unidades = [] } = useUnidades();
  const createMutation = useCreateCarrera();

  const [formData, setFormData] = useState<CreateCarreraDto>({
    clienteId: 0,
    unidadId: undefined,
    notas: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clienteId) return;

    const payload: CreateCarreraDto = {
      clienteId: Number(formData.clienteId),
      unidadId: formData.unidadId ? Number(formData.unidadId) : undefined,
      notas: formData.notas || undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        onClose();
        setFormData({ clienteId: 0, unidadId: undefined, notas: '' });
      },
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Nueva Carrera"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          label="Cliente *"
          options={clientes.map(c => ({
            value: c.id,
            label: `Cód. ${formatCodigo(c.codigo)} - ${c.nombre} - ${c.sector?.nombre || 'Sin Sector'} (${c.telefono || 'Sin Teléfono'})`
          }))}
          value={formData.clienteId || ''}
          onChange={(val) => setFormData({ ...formData, clienteId: val ? Number(val) : 0 })}
          placeholder="Seleccione un cliente..."
          searchable
        />

        <Select
          label="Asignar Unidad (Opcional)"
          options={unidades.map(u => ({
            value: u.id,
            label: `Nº ${u.numeroUnidad || 'S/N'} - ${u.choferNombre} (${u.placa})`
          }))}
          value={formData.unidadId || ''}
          onChange={(val) => setFormData({ ...formData, unidadId: val ? Number(val) : undefined })}
          placeholder="Seleccione una unidad..."
          searchable
        />

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-semibold text-gray-700">Notas / Detalles de la Carrera</label>
          <textarea
            className="px-3 py-2.5 bg-white border border-gray-300 rounded-md text-[15px] text-gray-800 transition-colors duration-200 outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 w-full resize-none h-20"
            value={formData.notas}
            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
            placeholder="Detalles sobre el punto de recogida, indicaciones, etc."
          />
        </div>

        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            fullWidth
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={createMutation.isPending}
            disabled={!formData.clienteId}
          >
            Registrar Carrera
          </Button>
        </div>
      </form>
    </Modal>
  );
};
