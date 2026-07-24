import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { useClientes, useCreateCliente, useUpdateCliente } from '../../features/clientes/hooks/useClientes';
import { useSectores } from '../../features/sectores/hooks/useSectores';
import { CreateClienteDto } from '../../features/clientes/services/clientes.service';

interface ClienteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  clienteId: number | null;
}

export const ClienteFormModal: React.FC<ClienteFormModalProps> = ({
  isOpen,
  onClose,
  clienteId
}) => {
  const { data: clientes } = useClientes();
  const { data: sectores } = useSectores();
  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();

  const [formData, setFormData] = useState<CreateClienteDto>({
    codigo: undefined,
    nombre: '',
    telefono: '',
    telefonoAlt: '',
    direccion: '',
    descripcion: '',
    linkGoogleMaps: '',
    sectorId: undefined,
  });
  const [codigoError, setCodigoError] = useState<string | null>(null);

  const isEditing = clienteId !== null;

  // Código sugerido: el primer hueco libre en la secuencia (ej: 1..999 ocupados y 1100 también
  // ocupado -> sugiere 1000, no 1101). Solo se usa como valor inicial en "Nuevo Cliente"; el
  // usuario puede pisarlo con cualquier otro número.
  const codigoSugerido = useMemo(() => {
    const usados = new Set((clientes ?? []).map((c) => c.codigo).filter((c): c is number => c != null));
    let candidato = 1;
    while (usados.has(candidato)) candidato++;
    return candidato;
  }, [clientes]);

  useEffect(() => {
    setCodigoError(null);
    if (isEditing && clientes) {
      const cliente = clientes.find(c => c.id === clienteId);
      if (cliente) {
        setFormData({
          // Si el cliente ya venía sin código (bandeja de "Nuevos Clientes"), lo prellenamos
          // igual que en alta nueva; si ya tiene uno asignado, se respeta el existente.
          codigo: cliente.codigo ?? codigoSugerido,
          nombre: cliente.nombre,
          telefono: cliente.telefono || '',
          telefonoAlt: cliente.telefonoAlt || '',
          direccion: cliente.direccion || '',
          descripcion: cliente.descripcion || '',
          linkGoogleMaps: cliente.linkGoogleMaps || '',
          sectorId: cliente.sectorId || undefined,
        });
      }
    } else {
      setFormData({
        codigo: codigoSugerido,
        nombre: '',
        telefono: '',
        telefonoAlt: '',
        direccion: '',
        descripcion: '',
        linkGoogleMaps: '',
        sectorId: undefined,
      });
    }
  }, [clienteId, isEditing, clientes, isOpen, codigoSugerido]);

  // Chequeo PROACTIVO del código: contra los clientes ya cargados en memoria (instantáneo, sin red).
  // Excluye al propio cliente al editar. La validación del backend queda como red de seguridad.
  const codigoOcupadoPor = useMemo(() => {
    if (formData.codigo == null) return null;
    return clientes?.find((c) => c.codigo === formData.codigo && c.id !== clienteId) ?? null;
  }, [formData.codigo, clientes, clienteId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCodigoError(null);
    if (codigoOcupadoPor) return; // ya avisado en el form; no enviamos

    // Preparar payload, limpiando strings vacíos
    const payload: CreateClienteDto = {
      codigo: formData.codigo ?? undefined,
      nombre: formData.nombre,
      telefono: formData.telefono || undefined,
      telefonoAlt: formData.telefonoAlt || undefined,
      direccion: formData.direccion || undefined,
      descripcion: formData.descripcion || undefined,
      linkGoogleMaps: formData.linkGoogleMaps || undefined,
      sectorId: formData.sectorId ? Number(formData.sectorId) : undefined,
    };

    // El backend valida el código único (409): mostramos su mensaje y mantenemos el modal abierto.
    const onError = (err: any) => {
      const msg = err?.response?.data?.message;
      setCodigoError(Array.isArray(msg) ? msg.join(', ') : (msg || 'No se pudo guardar el cliente.'));
    };

    if (isEditing) {
      updateMutation.mutate({ id: clienteId!, data: payload }, { onSuccess: onClose, onError });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose, onError });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          <div>
            <Input
              label="Código"
              type="number"
              value={formData.codigo ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                setFormData({ ...formData, codigo: v ? Number(v) : undefined });
                setCodigoError(null);
              }}
              placeholder="Nº cliente"
            />
            {codigoOcupadoPor ? (
              <span className="text-xs text-red-600 mt-1 inline-block font-medium">
                Código ocupado por "{codigoOcupadoPor.nombre}". Elegí otro.
              </span>
            ) : codigoError ? (
              <span className="text-xs text-red-600 mt-1 inline-block font-medium">{codigoError}</span>
            ) : formData.codigo != null ? (
              <span className="text-xs text-emerald-600 mt-1 inline-block font-medium">Código disponible ✓</span>
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Nombre Completo *"
              value={formData.nombre || ''}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              autoFocus
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <div>
            <Input
              label="Teléfono"
              placeholder="0999999999"
              value={formData.telefono || ''}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            />
            {(formData.telefono?.length || 0) > 10 && (
              <span className="text-xs text-amber-600 mt-1 inline-block font-medium">Nota: El número tiene más de 10 dígitos.</span>
            )}
          </div>
          <div>
            <Input
              label="Teléfono Alternativo"
              placeholder="Convencional o 2do cel"
              value={formData.telefonoAlt || ''}
              onChange={(e) => setFormData({ ...formData, telefonoAlt: e.target.value })}
            />
            {(formData.telefonoAlt?.length || 0) > 10 && (
              <span className="text-xs text-amber-600 mt-1 inline-block font-medium">Nota: El número tiene más de 10 dígitos.</span>
            )}
          </div>
        </div>

        <Select
          label="Sector"
          options={sectores?.map(s => ({ value: s.id, label: s.nombre })) || []}
          value={formData.sectorId || ''}
          onChange={(val) => setFormData({ ...formData, sectorId: val ? Number(val) : undefined })}
          placeholder="Seleccione un sector..."
          searchable
        />

        <Input 
          label="Dirección de la casa" 
          value={formData.direccion} 
          onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} 
          placeholder="Calles, número de casa, etc." 
        />

        <Input 
          label="Link de Google Maps" 
          value={formData.linkGoogleMaps} 
          onChange={(e) => setFormData({ ...formData, linkGoogleMaps: e.target.value })} 
          placeholder="https://maps.google.com/..." 
        />

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-semibold text-gray-700">Notas / Descripción extra</label>
          <textarea
            className="px-3 py-2.5 bg-white border border-gray-300 rounded-md text-[0.9375rem] text-gray-800 transition-colors duration-200 outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 w-full resize-none h-20"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Color de la casa, referencias, etc."
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
            isLoading={createMutation.isPending || updateMutation.isPending}
            disabled={!formData.nombre.trim() || !!codigoOcupadoPor}
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
