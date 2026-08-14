import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useUnidades } from '../../features/unidades/hooks/useUnidades';
import { useCompletarCarrera } from '../../features/carreras/hooks/useCarreras';

interface CompletarCarreraModalProps {
  isOpen: boolean;
  onClose: () => void;
  carreraId: number;
  initialUnidadId?: number;
}

export const CompletarCarreraModal: React.FC<CompletarCarreraModalProps> = ({
  isOpen,
  onClose,
  carreraId,
  initialUnidadId,
}) => {
  const { data: unidades = [] } = useUnidades();
  const completarMutation = useCompletarCarrera();

  const [unidadId, setUnidadId] = useState<number | undefined>(initialUnidadId);

  useEffect(() => {
    setUnidadId(initialUnidadId);
  }, [initialUnidadId, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unidadId) return;

    completarMutation.mutate(
      { id: carreraId, unidadId },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Terminar Carrera"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-gray-600 mb-2">
          Para terminar esta carrera, por favor confirma la unidad que realizó el servicio.
        </p>

        <Select
          label="Unidad que realizó la carrera *"
          options={unidades.map(u => {
            const isInactivo = u.estado === 'inactivo';
            const extra = isInactivo ? ' (INACTIVO)' : '';
            return {
              value: u.id,
              label: `Nº ${u.numeroUnidad || 'S/N'} · Placa: ${u.placa} · Chofer: ${u.choferNombre}${extra}`,
              disabled: isInactivo,
            };
          })}
          value={unidadId || ''}
          onChange={(val) => setUnidadId(val ? Number(val) : undefined)}
          placeholder="Seleccione la unidad..."
          searchable
        />

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
            isLoading={completarMutation.isPending}
            disabled={!unidadId}
          >
            Terminar Carrera
          </Button>
        </div>
      </form>
    </Modal>
  );
};
