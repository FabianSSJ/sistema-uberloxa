import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { formatCodigo } from '../../components/ui/CodigoBadge';
import { clienteSearchText, unidadSearchText } from '../../core/search/matchers';
import { useClientes } from '../../features/clientes/hooks/useClientes';
import { useUnidades } from '../../features/unidades/hooks/useUnidades';
import { useCreateCarrera } from '../../features/carreras/hooks/useCarreras';
import { CreateCarreraDto } from '../../features/carreras/services/carreras.service';

interface CarreraFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClienteId?: number;
}

export const CarreraFormModal: React.FC<CarreraFormModalProps> = ({
  isOpen,
  onClose,
  initialClienteId,
}) => {
  const { data: clientes = [] } = useClientes();
  const { data: unidades = [] } = useUnidades();
  const createMutation = useCreateCarrera();

  const [formData, setFormData] = useState<CreateCarreraDto>({
    clienteId: initialClienteId || 0,
    unidadId: undefined,
    estado: 'completada',
    notas: '',
  });

  // Si cambia el cliente inicial al abrir
  React.useEffect(() => {
    if (isOpen && initialClienteId) {
      setFormData(prev => ({ ...prev, clienteId: initialClienteId }));
    }
  }, [isOpen, initialClienteId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clienteId) return;

    // Si tiene unidad, el estado por defecto es completada salvo que elija perdida/pendiente
    const finalEstado = formData.unidadId 
      ? (formData.estado || 'completada')
      : (formData.estado === 'perdida' ? 'perdida' : 'pendiente');

    const payload: CreateCarreraDto = {
      clienteId: Number(formData.clienteId),
      unidadId: formData.unidadId ? Number(formData.unidadId) : undefined,
      estado: finalEstado,
      notas: formData.notas || undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        onClose();
        setFormData({ clienteId: 0, unidadId: undefined, estado: 'completada', notas: '' });
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
            label: `Cód. ${formatCodigo(c.codigo)} - ${c.nombre} - ${c.sector?.nombre || 'Sin Sector'} (${c.telefono || 'Sin Teléfono'})`,
            searchText: clienteSearchText(c)
          }))}
          value={formData.clienteId || ''}
          onChange={(val) => setFormData({ ...formData, clienteId: val ? Number(val) : 0 })}
          placeholder="Seleccione un cliente..."
          searchable
        />

        <Select
          label="Asignar Unidad (Opcional - Dejar vacío para Sin Unidad)"
          options={[
            { value: '', label: 'Sin Unidad (Carrera Perdida)' },
            // Una unidad inactiva no puede tomar carreras: ni se ofrece como opción
            // (mejor prevenir la elección inválida que dejarla elegir y recién avisarle).
            ...unidades.filter(u => u.estado !== 'inactivo').map(u => ({
              value: u.id,
              label: `Nº ${u.numeroUnidad || 'S/N'} - ${u.choferNombre} (${u.placa})`,
              searchText: unidadSearchText(u)
            }))
          ]}
          value={formData.unidadId || ''}
          onChange={(val) => {
            const uId = val ? Number(val) : undefined;
            setFormData({ 
              ...formData, 
              unidadId: uId,
              estado: uId ? 'completada' : 'perdida'
            });
          }}
          placeholder="Seleccione una unidad o deje vacío..."
          searchable
        />

        {/* Selección de Estado de la Carrera */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-semibold text-gray-700">Estado de la Carrera</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, estado: 'completada' })}
              className={`py-2 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${formData.estado === 'completada' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
            >
              <CheckCircle2 size={14} />
              <span>Completada</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, estado: 'perdida' })}
              className={`py-2 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${formData.estado === 'perdida' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
            >
              <AlertTriangle size={14} />
              <span>Perdida (Sin unidad)</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-semibold text-gray-700">Notas / Detalles de la Carrera</label>
          <textarea
            className="px-3 py-2.5 bg-white border border-gray-300 rounded-md text-[0.9375rem] text-gray-800 transition-colors duration-200 outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 w-full resize-none h-20"
            value={formData.notas || ''}
            onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
            placeholder="Detalles sobre el motivo, punto de recogida, indicaciones, etc."
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
