import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Check, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select, normalizeString } from '../../components/ui/Select';
import { useClientes, useCreateCliente, useUpdateCliente } from '../../features/clientes/hooks/useClientes';
import { useSectores, useCreateSector } from '../../features/sectores/hooks/useSectores';
import { CreateClienteDto } from '../../features/clientes/services/clientes.service';
import { notify } from '../../components/ui/toast';

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
  const createSectorMutation = useCreateSector();

  const [isInlineSectorOpen, setIsInlineSectorOpen] = useState(false);
  const [nuevoSectorNombre, setNuevoSectorNombre] = useState('');

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

  // Código sugerido: el primer hueco libre en la secuencia
  const codigoSugerido = useMemo(() => {
    const usados = new Set((clientes ?? []).map((c) => c.codigo).filter((c): c is number => c != null));
    let candidato = 1;
    while (usados.has(candidato)) candidato++;
    return candidato;
  }, [clientes]);

  useEffect(() => {
    setCodigoError(null);
    setIsInlineSectorOpen(false);
    setNuevoSectorNombre('');
    if (isEditing && clientes) {
      const cliente = clientes.find(c => c.id === clienteId);
      if (cliente) {
        setFormData({
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

  // Coincidencia PROACTIVA en tiempo real mientras el usuario escribe una nueva ciudadela
  const coincidenciaSector = useMemo(() => {
    const clean = nuevoSectorNombre.trim().replace(/\s+/g, ' ');
    if (!clean) return null;
    const norm = normalizeString(clean);
    return sectores?.find(s => normalizeString(s.nombre) === norm) ?? null;
  }, [nuevoSectorNombre, sectores]);

  const handleCreateSector = async (nombre: string) => {
    const nombreClean = nombre.trim().replace(/\s+/g, ' ');
    if (!nombreClean) return;

    // Chequeo PROACTIVO de duplicado local (ignorando tildes, mayúsculas y espacios extra)
    const normNuevo = normalizeString(nombreClean);
    const sectorExistente = sectores?.find(s => normalizeString(s.nombre) === normNuevo);

    if (sectorExistente) {
      setFormData(prev => ({ ...prev, sectorId: sectorExistente.id }));
      setIsInlineSectorOpen(false);
      setNuevoSectorNombre('');
      notify.info(`El sector "${sectorExistente.nombre}" ya existe y fue seleccionado automáticamente.`);
      return;
    }

    try {
      const nuevoSector = await createSectorMutation.mutateAsync({ nombre: nombreClean });
      notify.success(`Sector "${nuevoSector.nombre}" creado con éxito`);
      setFormData(prev => ({ ...prev, sectorId: nuevoSector.id }));
      setIsInlineSectorOpen(false);
      setNuevoSectorNombre('');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      const errorText = Array.isArray(msg) ? msg.join(', ') : (msg || 'No se pudo crear el sector.');

      // Si el servidor detectó que ya existía, seleccionar el existente
      const colisionServidor = sectores?.find(s => normalizeString(s.nombre) === normNuevo);
      if (colisionServidor) {
        setFormData(prev => ({ ...prev, sectorId: colisionServidor.id }));
        setIsInlineSectorOpen(false);
        setNuevoSectorNombre('');
        notify.info(`El sector "${colisionServidor.nombre}" ya existe y fue seleccionado automáticamente.`);
      } else {
        notify.error(errorText);
      }
    }
  };

  // Chequeo PROACTIVO del código: contra los clientes ya cargados en memoria
  const codigoOcupadoPor = useMemo(() => {
    if (formData.codigo == null) return null;
    return clientes?.find((c) => c.codigo === formData.codigo && c.id !== clienteId) ?? null;
  }, [formData.codigo, clientes, clienteId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCodigoError(null);
    if (codigoOcupadoPor) return;

    const payload: CreateClienteDto = {
      codigo: formData.codigo ?? undefined,
      nombre: formData.nombre?.trim() || undefined,
      telefono: formData.telefono || undefined,
      telefonoAlt: formData.telefonoAlt || undefined,
      direccion: formData.direccion || undefined,
      descripcion: formData.descripcion || undefined,
      linkGoogleMaps: formData.linkGoogleMaps || undefined,
      sectorId: formData.sectorId ? Number(formData.sectorId) : undefined,
    };

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
              label="Nombre Completo"
              placeholder="Opcional — si lo dejás vacío, se arma con el teléfono"
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

        {/* Sector / Ciudadela */}
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">Sector / Ciudadela</label>
            <button
              type="button"
              onClick={() => setIsInlineSectorOpen(!isInlineSectorOpen)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Plus size={14} />
              {isInlineSectorOpen ? 'Cancelar' : 'Añadir nueva ciudadela'}
            </button>
          </div>

          {isInlineSectorOpen && (
            <div className="flex flex-col gap-2 p-3 bg-slate-50 border border-blue-200 rounded-lg animate-[fadeIn_0.15s_ease-out]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nombre de la nueva ciudadela..."
                  value={nuevoSectorNombre}
                  onChange={(e) => setNuevoSectorNombre(e.target.value)}
                  className={`flex-1 px-3 py-1.5 text-sm bg-white border rounded outline-none transition-all ${
                    coincidenciaSector
                      ? 'border-amber-400 focus:ring-2 focus:ring-amber-300'
                      : nuevoSectorNombre.trim()
                      ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-300'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateSector(nuevoSectorNombre);
                    }
                  }}
                  autoFocus
                />
                <Button
                  type="button"
                  size="sm"
                  variant={coincidenciaSector ? 'secondary' : 'primary'}
                  onClick={() => handleCreateSector(nuevoSectorNombre)}
                  isLoading={createSectorMutation.isPending}
                  disabled={!nuevoSectorNombre.trim()}
                >
                  {coincidenciaSector ? 'Seleccionar existente' : 'Guardar'}
                </Button>
              </div>

              {/* AVISO PROACTIVO EN TIEMPO REAL AL ESCRIBIR */}
              {coincidenciaSector ? (
                <div className="flex items-center justify-between gap-2 p-2 bg-amber-50 border border-amber-300 rounded-md text-amber-900 text-xs font-medium animate-[fadeIn_0.1s_ease-out]">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                    <span>
                      El sector <strong>"{coincidenciaSector.nombre}"</strong> ya existe en el sistema.
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, sectorId: coincidenciaSector.id }));
                      setIsInlineSectorOpen(false);
                      setNuevoSectorNombre('');
                      notify.info(`Sector "${coincidenciaSector.nombre}" seleccionado.`);
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs shrink-0 cursor-pointer shadow-sm transition-all"
                  >
                    Usar este
                  </button>
                </div>
              ) : nuevoSectorNombre.trim() ? (
                <div className="flex items-center gap-1.5 p-2 bg-emerald-50 border border-emerald-300 rounded-md text-emerald-800 text-xs font-medium animate-[fadeIn_0.1s_ease-out]">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>
                    <strong>"{nuevoSectorNombre.trim()}"</strong> es una nueva ciudadela disponible para guardar.
                  </span>
                </div>
              ) : null}
            </div>
          )}

          <Select
            options={sectores?.map(s => ({ value: s.id, label: s.nombre })) || []}
            value={formData.sectorId || ''}
            onChange={(val) => setFormData({ ...formData, sectorId: val ? Number(val) : undefined })}
            placeholder="Seleccione un sector o busque una ciudadela..."
            searchable
            onAddNew={handleCreateSector}
            addNewLabel="Crear sector"
            isAddingNew={createSectorMutation.isPending}
          />
        </div>

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
            disabled={!!codigoOcupadoPor}
          >
            {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
