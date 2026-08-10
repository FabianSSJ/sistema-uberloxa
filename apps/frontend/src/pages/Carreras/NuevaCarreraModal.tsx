import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Switch } from '../../components/ui/Switch';
import { useCreateCarrera } from '../../features/carreras/hooks/useCarreras';
import { useClientes } from '../../features/clientes/hooks/useClientes';
import { useUnidades } from '../../features/unidades/hooks/useUnidades';
import { clienteSearchText, unidadSearchText } from '../../core/search/matchers';

interface NuevaCarreraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NuevaCarreraModal: React.FC<NuevaCarreraModalProps> = ({ isOpen, onClose }) => {
  const createCarreraMutation = useCreateCarrera();
  const clientesQuery = useClientes();
  const unidadesQuery = useUnidades();
  
  const [clienteId, setClienteId] = useState<number | ''>('');
  const [unidadId, setUnidadId] = useState<number | ''>('');
  const [esEncomienda, setEsEncomienda] = useState(false);
  const [notas, setNotas] = useState('');

  const clientesActivos = clientesQuery.data?.filter(c => c.activo) || [];
  const unidades = unidadesQuery.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) return;

    createCarreraMutation.mutate(
      { 
        clienteId: Number(clienteId), 
        unidadId: unidadId ? Number(unidadId) : undefined,
        esEncomienda,
        notas 
      },
      {
        onSuccess: () => {
          setClienteId('');
          setUnidadId('');
          setEsEncomienda(false);
          setNotas('');
          onClose();
        }
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Despachar Nueva Carrera">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100 mb-2">
          <p className="text-sm text-blue-800">
            <strong>Atención:</strong> Solo se pueden despachar carreras a clientes registrados. Si el cliente es nuevo, regístrelo primero en la pestaña Clientes.
          </p>
        </div>

        <Select
          label="Cliente *"
          options={clientesActivos.map(c => ({
            value: c.id,
            label: `${c.nombre} ${c.telefono ? `(${c.telefono})` : ''} - ${c.sector?.nombre || 'Sin sector'}`,
            searchText: clienteSearchText(c)
          }))}
          value={clienteId}
          onChange={(val) => setClienteId(Number(val))}
          placeholder="Buscar por código, nombre, teléfono, dirección, sector..."
          searchable
        />

        <Select
          label="Unidad a despachar (Opcional)"
          options={[
            { value: '', label: 'Ninguna (Dejar Sin Asignar)' },
            ...unidades.map(u => {
              const isOcupado = u.estado === 'ocupado';
              const isInactivo = u.estado === 'inactivo';
              const extra = isOcupado ? ' (OCUPADO)' : isInactivo ? ' (INACTIVO)' : '';
              return {
                value: u.id,
                label: `[${u.placa}] ${u.modelo?.marca?.nombre || ''} ${u.modelo?.nombre || ''} - Chofer: ${u.choferNombre}${extra}`,
                searchText: unidadSearchText(u),
                disabled: isOcupado || isInactivo,
              };
            })
          ]}
          value={unidadId}
          onChange={(val) => setUnidadId(val === '' ? '' : Number(val))}
          placeholder="Buscar por nº, placa, chofer, teléfono, modelo..."
          searchable
        />

        <Switch
          checked={esEncomienda}
          onChange={setEsEncomienda}
          label="Encomienda"
          className="justify-between w-full px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200"
        />

        <Input
          label="Notas para el Taxista"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Ej: Esperar en la esquina, llevar cambio de $20, etc."
        />

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={createCarreraMutation.isPending} disabled={!clienteId}>
            Crear Carrera
          </Button>
        </div>
      </form>
    </Modal>
  );
};
