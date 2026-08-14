import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useCompletarCarrera } from '../../features/carreras/hooks/useCarreras';
import { useUnidades } from '../../features/unidades/hooks/useUnidades';
import { Carrera } from '../../features/carreras/services/carreras.service';
import { unidadSearchText } from '../../core/search/matchers';

interface AsignarUnidadModalProps {
  isOpen: boolean;
  onClose: () => void;
  carrera: Carrera | null;
}

export const AsignarUnidadModal: React.FC<AsignarUnidadModalProps> = ({ isOpen, onClose, carrera }) => {
  const completarMutation = useCompletarCarrera();
  const unidadesQuery = useUnidades();
  const [unidadId, setUnidadId] = useState<number | ''>('');

  const unidades = unidadesQuery.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unidadId || !carrera) return;

    completarMutation.mutate(
      { id: carrera.id, unidadId: Number(unidadId) },
      {
        onSuccess: () => {
          setUnidadId('');
          onClose();
        }
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar Unidad">
      {carrera && (
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4 text-sm text-gray-700">
          <p><strong>Cliente:</strong> {carrera.cliente.nombre}</p>
          <p><strong>Recoger en:</strong> {carrera.cliente.direccion || 'Sin dirección registrada'}</p>
          {carrera.notas && <p><strong>Notas:</strong> {carrera.notas}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Select
          label="Unidad a despachar *"
          options={unidades.map(u => {
            const isInactivo = u.estado === 'inactivo';
            const extra = isInactivo ? ' (INACTIVO)' : '';
            return {
              value: u.id,
              label: `[${u.placa}] ${u.modelo?.marca?.nombre || ''} ${u.modelo?.nombre || ''} - Chofer: ${u.choferNombre}${extra}`,
              searchText: unidadSearchText(u),
              disabled: isInactivo,
            };
          })}
          value={unidadId}
          onChange={(val) => setUnidadId(Number(val))}
          placeholder="Buscar por nº, placa, chofer, teléfono, modelo..."
          searchable
        />

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={completarMutation.isPending} disabled={!unidadId}>
            Asignar Unidad
          </Button>
        </div>
      </form>
    </Modal>
  );
};
