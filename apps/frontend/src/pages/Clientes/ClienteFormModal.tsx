import React, { useState, useEffect } from 'react';
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
    nombre: '',
    telefono: '',
    telefonoAlt: '',
    direccion: '',
    descripcion: '',
    linkGoogleMaps: '',
    sectorId: undefined,
  });

  const isEditing = clienteId !== null;

  useEffect(() => {
    if (isEditing && clientes) {
      const cliente = clientes.find(c => c.id === clienteId);
      if (cliente) {
        setFormData({
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
        nombre: '',
        telefono: '',
        telefonoAlt: '',
        direccion: '',
        descripcion: '',
        linkGoogleMaps: '',
        sectorId: undefined,
      });
    }
  }, [clienteId, isEditing, clientes, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Preparar payload, limpiando strings vacíos
    const payload: CreateClienteDto = {
      nombre: formData.nombre,
      telefono: formData.telefono || undefined,
      telefonoAlt: formData.telefonoAlt || undefined,
      direccion: formData.direccion || undefined,
      descripcion: formData.descripcion || undefined,
      linkGoogleMaps: formData.linkGoogleMaps || undefined,
      sectorId: formData.sectorId ? Number(formData.sectorId) : undefined,
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: clienteId!, data: payload },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
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
        
        <Input 
          label="Nombre Completo *" 
          value={formData.nombre || ''} 
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
          autoFocus
        />

        <div className="flex gap-4">
          <div className="flex-1">
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
          <div className="flex-1">
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
            className="px-3 py-2.5 bg-white border border-gray-300 rounded-md text-[15px] text-gray-800 transition-colors duration-200 outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 w-full resize-none h-20"
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
            disabled={!formData.nombre.trim()}
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
