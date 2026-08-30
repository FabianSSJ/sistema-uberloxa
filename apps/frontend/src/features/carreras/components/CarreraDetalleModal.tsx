import { useEffect, useState, useMemo, useRef } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { DetailRow } from '../../../components/ui/DetailRow';
import { User, Phone, MapPin, Navigation, Car, Clock, FileText, Package, Hash, Pencil, X, Check, Search } from 'lucide-react';
import { EstadoCarreraBadge } from './EstadoCarreraBadge';
import { useReasignarUnidadCarrera } from '../hooks/useCarreras';
import { hora } from '../../../core/tiempo';

interface CarreraDetalleModalProps {
  carrera: any | null;
  clientes?: any[];
  unidades?: any[];
  onClose: () => void;
}

const renderSafeText = (val: any, fallback: React.ReactNode = '—'): React.ReactNode => {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (typeof val.nombre === 'string') return val.nombre;
    if (typeof val.label === 'string') return val.label;
    try {
      return JSON.stringify(val);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

export const CarreraDetalleModal = ({ carrera, clientes = [], unidades = [], onClose }: CarreraDetalleModalProps) => {
  const [editandoUnidad, setEditandoUnidad] = useState(false);
  const [nuevaUnidadId, setNuevaUnidadId] = useState('');
  const [busquedaUnidad, setBusquedaUnidad] = useState('');
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reasignarUnidadMutation = useReasignarUnidadCarrera();

  const safeClientes = useMemo(() => (Array.isArray(clientes) ? clientes : []), [clientes]);
  const safeUnidades = useMemo(() => (Array.isArray(unidades) ? unidades : []), [unidades]);

  // Unidades activas disponibles para reasignar
  const unidadesDisponibles = useMemo(() => {
    return safeUnidades.filter((u: any) => u && u.estado !== 'inactivo');
  }, [safeUnidades]);

  // Filtrado reactivo en tiempo real por lo que se va tipeando (número, chofer o placa)
  const unidadesFiltradas = useMemo(() => {
    if (!busquedaUnidad.trim()) return unidadesDisponibles;
    const term = busquedaUnidad.toLowerCase().trim();
    return unidadesDisponibles.filter((u: any) => {
      const num = String(u.numeroUnidad || '').toLowerCase();
      const chofer = String(u.choferNombre || '').toLowerCase();
      const placa = String(u.placa || '').toLowerCase();
      return num.includes(term) || chofer.includes(term) || placa.includes(term);
    });
  }, [unidadesDisponibles, busquedaUnidad]);

  // Al cambiar de carrera (o cerrar) se resetea el modo edición
  useEffect(() => {
    setEditandoUnidad(false);
    setNuevaUnidadId('');
    setBusquedaUnidad('');
    setDropdownAbierto(false);
    setHighlightIndex(0);
  }, [carrera?.id]);

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Return temprano DESPUÉS de todos los hooks de React
  if (!carrera) return null;

  // Buscar el cliente completo en memoria si falta algo en la carrera
  const clienteId = carrera.clienteId || carrera.cliente?.id;
  const clienteFromList = clienteId ? safeClientes.find((c: any) => c && c.id === clienteId) : null;
  const cliente = { ...(carrera.cliente || {}), ...(clienteFromList || {}) };

  // Resolver la unidad asignada (objeto o por id)
  const unidadAsignada =
    carrera.unidad && typeof carrera.unidad === 'object'
      ? carrera.unidad
      : safeUnidades.find((u: any) => u && u.id === (carrera.unidadId || carrera.unidad));

  const seleccionarUnidad = (u: any) => {
    if (!u) return;
    setNuevaUnidadId(String(u.id));
    setBusquedaUnidad(`Nº ${u.numeroUnidad || 'S/N'} — ${u.choferNombre || 'Sin chofer'}`);
    setDropdownAbierto(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDropdownAbierto(true);
      setHighlightIndex((prev) => (prev + 1) % Math.max(1, unidadesFiltradas.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDropdownAbierto(true);
      setHighlightIndex((prev) => (prev - 1 + unidadesFiltradas.length) % Math.max(1, unidadesFiltradas.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (dropdownAbierto && unidadesFiltradas[highlightIndex]) {
        seleccionarUnidad(unidadesFiltradas[highlightIndex]);
      } else if (nuevaUnidadId) {
        confirmarNuevaUnidad();
      }
    } else if (e.key === 'Escape') {
      setDropdownAbierto(false);
      if (!nuevaUnidadId) {
        setEditandoUnidad(false);
      }
    }
  };

  const confirmarNuevaUnidad = () => {
    const id = Number(nuevaUnidadId);
    if (!id || !carrera.id) return;
    reasignarUnidadMutation.mutate(
      { id: carrera.id, unidadId: id },
      {
        onSuccess: () => {
          setEditandoUnidad(false);
          setNuevaUnidadId('');
          setBusquedaUnidad('');
          setDropdownAbierto(false);
        },
      },
    );
  };

  let horaStr = '—';
  if (carrera.createdAt) {
    try {
      horaStr = hora(carrera.createdAt, true);
    } catch {
      horaStr = String(carrera.createdAt);
    }
  }

  const modalTitle =
    cliente.codigo != null ? `Cliente Cód. ${cliente.codigo}` : 'Detalle de Carrera';

  const telefonoStr = [cliente.telefono, cliente.telefonoAlt]
    .filter((t) => t && typeof t === 'string' && t.trim().length > 0)
    .join(' / ');

  return (
    <Modal isOpen={true} onClose={onClose} title={modalTitle}>
      <div className="flex flex-col">
        <DetailRow
          icon={<User size={16} />}
          label="Cliente"
          value={renderSafeText(
            cliente.nombre,
            <span className="text-gray-400 italic font-normal">Sin nombre</span>,
          )}
        />
        {cliente.codigo != null && (
          <DetailRow
            icon={<Hash size={16} />}
            label="Código"
            value={<span className="font-mono text-blue-600 font-black">Cód. {cliente.codigo}</span>}
          />
        )}
        <DetailRow
          icon={<Phone size={16} />}
          label="Teléfono"
          value={
            telefonoStr ? (
              <span>{telefonoStr}</span>
            ) : (
              <span className="text-gray-400 italic font-normal">Sin teléfono</span>
            )
          }
        />
        <DetailRow
          icon={<MapPin size={16} />}
          label="Dirección"
          value={renderSafeText(
            cliente.direccion,
            <span className="text-gray-400 italic font-normal">Sin dirección</span>,
          )}
        />
        <DetailRow
          icon={<Navigation size={16} />}
          label="Sector"
          value={renderSafeText(
            cliente.sector,
            <span className="text-gray-400 italic font-normal">Sin sector</span>,
          )}
        />
        {cliente.descripcion && (
          <DetailRow
            icon={<FileText size={16} />}
            label="Ref. Cliente"
            value={renderSafeText(cliente.descripcion)}
          />
        )}
        {editandoUnidad ? (
          <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
            <div className="text-gray-400 shrink-0"><Car size={16} /></div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 shrink-0">Unidad</span>
            <div className="flex-1 flex items-center gap-1.5 min-w-0">
              <div className="relative flex-1 min-w-0" ref={dropdownRef}>
                <div className="relative flex items-center">
                  <Search size={13} className="absolute left-2.5 text-gray-400 pointer-events-none" />
                  <input
                    ref={inputRef}
                    autoFocus
                    type="text"
                    value={busquedaUnidad}
                    onChange={(e) => {
                      setBusquedaUnidad(e.target.value);
                      setNuevaUnidadId('');
                      setDropdownAbierto(true);
                      setHighlightIndex(0);
                    }}
                    onFocus={() => setDropdownAbierto(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tipear Nº o chofer..."
                    className="w-full pl-8 pr-7 py-1 text-sm font-semibold border border-gray-300 rounded-md outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm"
                  />
                  {busquedaUnidad && (
                    <button
                      type="button"
                      onClick={() => {
                        setBusquedaUnidad('');
                        setNuevaUnidadId('');
                        setDropdownAbierto(true);
                        inputRef.current?.focus();
                      }}
                      className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {dropdownAbierto && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-52 overflow-y-auto z-50 py-1 divide-y divide-gray-50">
                    {unidadesFiltradas.length > 0 ? (
                      unidadesFiltradas.map((u: any, idx: number) => {
                        const isSelected = String(u.id) === nuevaUnidadId;
                        const isHighlighted = idx === highlightIndex;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onMouseEnter={() => setHighlightIndex(idx)}
                            onClick={() => seleccionarUnidad(u)}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 text-blue-900 font-bold'
                                : isHighlighted
                                  ? 'bg-blue-50/60 text-gray-900'
                                  : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="shrink-0 px-1.5 py-0.5 bg-slate-800 text-white rounded font-bold text-[0.6875rem]">
                                Nº {u.numeroUnidad || 'S/N'}
                              </span>
                              <span className="truncate font-semibold">{u.choferNombre || 'Sin chofer'}</span>
                            </div>
                            {u.placa && (
                              <span className="shrink-0 text-[0.625rem] font-mono text-gray-400">
                                {u.placa}
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-2 text-xs text-gray-400 italic text-center">
                        No se encontraron unidades
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={confirmarNuevaUnidad}
                disabled={!nuevaUnidadId || reasignarUnidadMutation.isPending}
                title="Confirmar cambio"
                className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Check size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditandoUnidad(false);
                  setNuevaUnidadId('');
                  setBusquedaUnidad('');
                  setDropdownAbierto(false);
                }}
                title="Cancelar"
                className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <DetailRow
            icon={<Car size={16} />}
            label="Unidad"
            value={
              <span className="inline-flex items-center justify-end gap-2">
                {unidadAsignada ? (
                  <span className="font-bold text-emerald-700">
                    Nº {unidadAsignada.numeroUnidad || 'S/N'}{' '}
                    {unidadAsignada.choferNombre ? `(${unidadAsignada.choferNombre})` : ''}
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold italic">Sin unidad (Pendiente)</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditandoUnidad(true);
                    setBusquedaUnidad('');
                    setNuevaUnidadId('');
                    setDropdownAbierto(true);
                  }}
                  title={unidadAsignada ? 'Cambiar unidad' : 'Asignar unidad'}
                  className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-[0.6875rem] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <Pencil size={11} />
                  {unidadAsignada ? 'Cambiar' : 'Asignar'}
                </button>
              </span>
            }
          />
        )}
        <DetailRow
          icon={<Clock size={16} />}
          label="Estado"
          value={
            <span className="inline-flex justify-end">
              <EstadoCarreraBadge estado={carrera.estado} />
            </span>
          }
        />
        <DetailRow icon={<Clock size={16} />} label="Hora Registro" value={horaStr} />
        {Boolean(carrera.esEncomienda) && (
          <DetailRow
            icon={<Package size={16} />}
            label="Tipo"
            value={<span className="text-amber-700 font-black">ENCOMIENDA</span>}
          />
        )}
        {carrera.notas && (
          <DetailRow
            icon={<FileText size={16} />}
            label="Notas"
            value={
              <span className="font-normal text-gray-700 whitespace-pre-line">
                {renderSafeText(carrera.notas)}
              </span>
            }
          />
        )}
      </div>
    </Modal>
  );
};
