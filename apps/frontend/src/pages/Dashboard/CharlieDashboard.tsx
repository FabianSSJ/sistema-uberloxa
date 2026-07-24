import { Car, Clock, Plus, Search, Trash2, MapPin, Phone, Moon, Play, Power, PowerOff, Unlock, TrendingUp, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useState, useMemo, type ReactNode } from 'react';

import { useClientes } from '../../features/clientes/hooks/useClientes';
import { useColaDespacho } from '../../features/unidades/hooks/useColaDespacho';
import { useCambiarEstadoUnidad } from '../../features/unidades/hooks/useUnidades';
import { ESTADO_UNIDAD_STYLES } from '../../features/unidades/components/EstadoUnidadBadge';
import { UnidadDetalleModal } from '../../features/unidades/components/UnidadDetalleModal';
import { usePanelCarreras, useCreateCarrera, useCancelarCarrera, usePerderCarrera, useDeleteCarrera } from '../../features/carreras/hooks/useCarreras';
import { CarreraFormModal } from './CarreraFormModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CodigoBadge, formatCodigo } from '../../components/ui/CodigoBadge';
import { EstadoCarreraBadge } from '../../features/carreras/components/EstadoCarreraBadge';
import { rankBy, scoreUnidad, scoreCliente } from '../../core/search/matchers';
import { colorOperador, colorUnidad } from '../../core/operadores/colores';
import { hora } from '../../core/tiempo';
import { useAuth } from '../../features/auth/context/AuthContext';

export const CharlieDashboard = () => {
  const { user } = useAuth();
  const { data: clientes = [] } = useClientes();
  const { unidades: todasUnidades, carrerasHoy } = useColaDespacho();
  const { data: allRidesData = [] } = usePanelCarreras();

  // El server ya resuelve "hoy + en proceso con ventana de gracia" — acá solo se filtra
  // por dueño (el Charlie ve las suyas; las de creador null quedan visibles para todos).
  const carrerasDelDia = useMemo(
    () => allRidesData.filter((r: any) => !r.creadoPorId || r.creadoPorId === user?.id),
    [allRidesData, user?.id]
  );

  // Resumen rápido del día por estado, sobre las mismas carreras que ya se ven en el panel.
  const resumenDia = useMemo(() => {
    let completadas = 0, canceladas = 0, perdidas = 0;
    for (const r of carrerasDelDia as any[]) {
      if (r.estado === 'completada') completadas++;
      else if (r.estado === 'cancelada') canceladas++;
      else if (r.estado === 'perdida') perdidas++;
    }
    return { total: carrerasDelDia.length, completadas, canceladas, perdidas };
  }, [carrerasDelDia]);

  const createCarreraMutation = useCreateCarrera();
  const cancelarMutation = useCancelarCarrera();
  const perderMutation = usePerderCarrera();
  const deleteCarreraMutation = useDeleteCarrera();
  const cambiarEstadoMutation = useCambiarEstadoUnidad();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchChofer, setSearchChofer] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [careerToDelete, setCareerToDelete] = useState<number | null>(null);
  const [detalleUnidad, setDetalleUnidad] = useState<any>(null);

  const [draggedItem, setDraggedItem] = useState<{type: 'CHOFER' | 'CLIENTE', id: number} | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{type: 'CHOFER' | 'CLIENTE', id: number} | null>(null);

  // TODAS las unidades ordenadas: primero las ACTIVAS con MÁS carreras de hoy, después el resto.
  const unidadesOrdenadas = useMemo(() => {
    return [...todasUnidades].sort((a: any, b: any) => {
      const activaA = a.estado !== 'inactivo' ? 1 : 0;
      const activaB = b.estado !== 'inactivo' ? 1 : 0;
      if (activaA !== activaB) return activaB - activaA;
      return (carrerasHoy.get(b.id) || 0) - (carrerasHoy.get(a.id) || 0);
    });
  }, [todasUnidades, carrerasHoy]);

  const filteredUnidades = useMemo(
    () => (searchChofer.trim() ? unidadesOrdenadas.filter((u) => scoreUnidad(u, searchChofer) > 0) : unidadesOrdenadas),
    [unidadesOrdenadas, searchChofer]
  );

  // PERFORMANCE: sin búsqueda NO renderizamos los ~4670 clientes (mataba el mount del dashboard).
  // Se busca; con búsqueda mostramos el top 50 por relevancia (rankBy ya los ordena).
  const filteredClientes = useMemo(
    () => (searchCliente.trim() ? rankBy(clientes, searchCliente, scoreCliente).slice(0, 50) : []),
    [clientes, searchCliente]
  );
  // Búsqueda por código = query 100% numérica → resultado único → mostramos la card GRANDE.
  const esBusquedaCodigo = /^\d+$/.test(searchCliente.trim());

  const formatTime = (isoString: string) => { try { return hora(isoString); } catch { return ''; } };

  const cambiarEstado = (id: number, estado: string) => cambiarEstadoMutation.mutate({ id, estado: estado as any });

  // Botón de icono de estado dentro de la card (stopPropagation: no abre el modal ni arrastra).
  // El title da el nombre de la acción, ya que el icono va sin texto para ahorrar espacio.
  const btnEstado = (icon: ReactNode, title: string, cls: string, onClick: () => void) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title}
      className={`inline-flex items-center justify-center text-white ${cls} w-6 h-6 rounded-md hover:brightness-110 transition shadow-sm flex-shrink-0`}
    >
      {icon}
    </button>
  );

  return (
    <div className="-mt-4 -mx-4 md:-mx-6 -mb-10 min-h-[calc(100vh-70px)] h-auto lg:h-[calc(100vh-70px)] bg-gray-100 p-4 animate-[fadeIn_0.5s_ease-in]">
      <div className="flex flex-col lg:flex-row gap-5 h-full w-full">

        {/* Panel 1: Choferes / Unidades (más ancho: es el foco del despacho) */}
        <div className="flex-[1.5] bg-white rounded-2xl shadow-md border border-gray-200/60 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white flex items-center gap-3 shadow-sm">
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm shrink-0">
                <Car size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-bold m-0 tracking-wide shrink-0">Unidades</h2>
            </div>
            {/* Resumen del día ocupando el espacio libre del header (4 pills a lo ancho, flex-1
                cada una = mismo ancho, sin desperdiciar el hueco). Fondo blanco sólido por pill
                para que el color semántico contraste contra el header ámbar — mismo código
                verde/naranja/rojo/azul que en el reporte de Admin (heurística de Nielsen #4:
                consistencia). Etiqueta de texto SIEMPRE visible, no depende de :hover del title
                (en touch/tablet no existe) — heurística #6: reconocer, no recordar. "pop" al
                cambiar el valor (remount vía key) = feedback periférico. */}
            <div className="hidden md:flex flex-1 flex-wrap items-center gap-2 pl-4 ml-1 border-l border-white/25 min-w-0">
              <span key={`t-${resumenDia.total}`} className="stat-pop flex-1 inline-flex items-center justify-center gap-1.5 bg-white rounded-lg px-3 py-1.5 shadow-sm" title="Carreras de hoy">
                <TrendingUp size={14} className="text-blue-600" />
                <span className="text-[0.625rem] font-bold uppercase tracking-wide text-blue-400">Hoy</span>
                <span className="text-sm font-black tabular-nums text-blue-700">{resumenDia.total}</span>
              </span>
              <span key={`c-${resumenDia.completadas}`} className="stat-pop flex-1 inline-flex items-center justify-center gap-1.5 bg-white rounded-lg px-3 py-1.5 shadow-sm" title="Completadas hoy">
                <CheckCircle2 size={14} className="text-green-600" />
                <span className="text-[0.625rem] font-bold uppercase tracking-wide text-green-400">OK</span>
                <span className="text-sm font-black tabular-nums text-green-700">{resumenDia.completadas}</span>
              </span>
              <span key={`p-${resumenDia.perdidas}`} className="stat-pop flex-1 inline-flex items-center justify-center gap-1.5 bg-white rounded-lg px-3 py-1.5 shadow-sm" title="Perdidas hoy">
                <AlertTriangle size={14} className="text-orange-600" />
                <span className="text-[0.625rem] font-bold uppercase tracking-wide text-orange-400">Perd</span>
                <span className="text-sm font-black tabular-nums text-orange-700">{resumenDia.perdidas}</span>
              </span>
              <span key={`x-${resumenDia.canceladas}`} className="stat-pop flex-1 inline-flex items-center justify-center gap-1.5 bg-white rounded-lg px-3 py-1.5 shadow-sm" title="Canceladas hoy">
                <XCircle size={14} className="text-red-600" />
                <span className="text-[0.625rem] font-bold uppercase tracking-wide text-red-400">Canc</span>
                <span className="text-sm font-black tabular-nums text-red-700">{resumenDia.canceladas}</span>
              </span>
            </div>
            <span className="bg-amber-700/50 px-3 py-1 rounded-full text-sm font-bold shadow-inner shrink-0 ml-auto md:ml-0">
              {filteredUnidades.length}
            </span>
          </div>
          <div className="px-5 pt-5 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar unidad, chofer, placa, teléfono, vehículo..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all shadow-sm"
                value={searchChofer}
                onChange={e => setSearchChofer(e.target.value)}
              />
            </div>
            {/* Leyenda del punto de color: se explica el código una vez, no card por card. */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[0.625rem] font-semibold text-gray-500">
              {(['disponible', 'ocupado', 'descanso', 'inactivo'] as const).map((e) => (
                <span key={e} className="inline-flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${ESTADO_UNIDAD_STYLES[e].dot}`} />
                  {ESTADO_UNIDAD_STYLES[e].label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3 grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2 content-start bg-slate-50/50">
            {filteredUnidades.map((u: any) => {
              const isDragOver = dragOverItem?.type === 'CHOFER' && dragOverItem.id === u.id;
              const estado = u.estado || 'disponible';
              const hoy = carrerasHoy.get(u.id) || 0;
              const colorU = colorUnidad(u);
              return (
                <div
                  key={u.id}
                  draggable
                  onClick={() => setDetalleUnidad(u)}
                  title={`Unidad ${u.numeroUnidad || 'S/N'} · ${u.choferNombre || 'Sin chofer'} · ${ESTADO_UNIDAD_STYLES[estado as keyof typeof ESTADO_UNIDAD_STYLES]?.label ?? estado} · Click para ver detalle`}
                  onDragStart={(e) => {
                    setDraggedItem({ type: 'CHOFER', id: u.id });
                    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'CHOFER', id: u.id }));
                  }}
                  onDragEnd={() => { setDraggedItem(null); setDragOverItem(null); }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedItem && draggedItem.type === 'CLIENTE') setDragOverItem({ type: 'CHOFER', id: u.id });
                  }}
                  onDragLeave={() => setDragOverItem(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedItem && draggedItem.type === 'CLIENTE') {
                      createCarreraMutation.mutate({ clienteId: draggedItem.id, unidadId: u.id, notas: 'Asignación Rápida' });
                    }
                    setDraggedItem(null); setDragOverItem(null);
                  }}
                  className={`flex flex-col gap-0.5 p-2 rounded-lg border border-black/5 border-l-4 cursor-pointer transition shadow-sm min-h-[5rem] ${isDragOver ? 'bg-amber-100 ring-2 ring-amber-400 border-amber-300' : 'hover:brightness-105'}`}
                  style={isDragOver ? undefined : { ...colorU.card, ...colorU.borderLeft }}
                >
                  <div className="flex items-start justify-between gap-1 pointer-events-none">
                    <span className="text-xl font-black leading-none tracking-tight">{u.numeroUnidad || 'S/N'}</span>
                    <div className="flex items-center gap-0.5 shrink-0 mt-0.5" title={`${hoy} carreras hoy`}>
                      <Car size={11} className="opacity-70" />
                      <span className="text-xs font-black leading-none tabular-nums">{hoy}</span>
                      <span className={`w-2 h-2 ml-0.5 rounded-full ring-1 ring-white/70 ${ESTADO_UNIDAD_STYLES[estado as keyof typeof ESTADO_UNIDAD_STYLES]?.dot ?? 'bg-gray-400'}`} />
                    </div>
                  </div>
                  <p className="text-[0.625rem] font-bold font-mono truncate leading-tight pointer-events-none mt-0.5 opacity-80">{u.placa}</p>
                  <div className="flex flex-wrap gap-1 mt-auto pt-1">
                    {estado === 'inactivo'
                      ? btnEstado(<Power size={12} />, 'Activar', 'bg-emerald-600', () => cambiarEstado(u.id, 'disponible'))
                      : (
                        <>
                          {estado === 'descanso'
                            ? btnEstado(<Play size={12} />, 'Volver a disponible', 'bg-emerald-600', () => cambiarEstado(u.id, 'disponible'))
                            : estado === 'ocupado'
                              ? btnEstado(<Unlock size={12} />, 'Liberar', 'bg-emerald-600', () => cambiarEstado(u.id, 'disponible'))
                              : btnEstado(<Moon size={12} />, 'Poner en descanso', 'bg-sky-600', () => cambiarEstado(u.id, 'descanso'))}
                          {btnEstado(<PowerOff size={12} />, 'Sacar (inactivar)', 'bg-gray-700', () => cambiarEstado(u.id, 'inactivo'))}
                        </>
                      )}
                  </div>
                </div>
              );
            })}
            {filteredUnidades.length === 0 && <div className="col-span-full text-center text-gray-400 mt-10 font-medium">{searchChofer ? 'Sin resultados' : 'No hay unidades registradas'}</div>}
          </div>
        </div>

        {/* Panel 2: Gestión de Carreras y Clientes — buscar cliente + registrar carreras del día */}
        <div className="flex-1 bg-white rounded-2xl shadow-md border border-gray-200/60 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4 text-white flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Clock size={24} className="text-white" />
              </div>
              <h2 className="text-lg font-bold m-0 tracking-wide">Gestión de Carreras y Clientes</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-green-700/50 px-3 py-1 rounded-full text-sm font-bold shadow-inner" title="Carreras de hoy">
                {carrerasDelDia.length}
              </span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-green-600 p-1.5 rounded-lg hover:bg-green-50 hover:scale-105 transition-all shadow-sm cursor-pointer"
                title="Nueva Carrera"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Buscador de clientes (para despachar) */}
          <div className="px-5 pt-4 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar cliente por código, nombre, teléfono, dirección..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all shadow-sm"
                value={searchCliente}
                onChange={e => setSearchCliente(e.target.value)}
              />
            </div>
            {searchCliente.trim() && (
              <p className="text-[0.6875rem] text-gray-500 mt-1.5 px-1">Arrastrá una unidad sobre el cliente para asignarle la carrera.</p>
            )}
          </div>

          {/* Contenido: buscando → clientes para despachar | sin buscar → carreras del día */}
          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3 flex flex-col gap-2.5 bg-slate-50/50">
            {searchCliente.trim() ? (
              <>
                {filteredClientes.map((c: any) => {
                  const isDragOver = dragOverItem?.type === 'CLIENTE' && dragOverItem.id === c.id;
                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedItem({ type: 'CLIENTE', id: c.id });
                        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'CLIENTE', id: c.id }));
                      }}
                      onDragEnd={() => { setDraggedItem(null); setDragOverItem(null); }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedItem && draggedItem.type === 'CHOFER') setDragOverItem({ type: 'CLIENTE', id: c.id });
                      }}
                      onDragLeave={() => setDragOverItem(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedItem && draggedItem.type === 'CHOFER') {
                          createCarreraMutation.mutate({ clienteId: c.id, unidadId: draggedItem.id, notas: 'Asignación Rápida' });
                          setSearchCliente(''); // tras asignar, limpiamos la búsqueda para ver la carrera registrada
                        }
                        setDraggedItem(null); setDragOverItem(null);
                      }}
                      className={`border rounded-lg shadow-sm hover:-translate-y-0.5 hover:shadow transition-all duration-200 group cursor-grab active:cursor-grabbing ${esBusquedaCodigo ? 'p-5' : 'p-2.5 flex items-center justify-between gap-2'} ${isDragOver ? 'bg-green-50 ring-2 ring-green-400 border-green-300 scale-[1.02]' : 'bg-white border-gray-100'}`}
                    >
                      {esBusquedaCodigo ? (
                        /* Vista GRANDE: búsqueda por código → un cliente, toda la info a la vista para despachar */
                        <div className="pointer-events-none flex flex-col gap-4">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-black text-gray-900 m-0 text-3xl leading-tight break-words">{c.nombre}</h3>
                            <span className="shrink-0 inline-flex flex-col items-center bg-blue-50 text-blue-700 border border-blue-200 rounded-2xl px-5 py-2 shadow-sm">
                              <span className="text-[0.625rem] font-bold uppercase tracking-widest text-blue-400">Código</span>
                              <span className="text-4xl font-black font-mono leading-none">{formatCodigo(c.codigo)}</span>
                            </span>
                          </div>
                          {c.direccion ? (
                            <div className="flex items-start gap-3 text-gray-800 bg-slate-100/80 rounded-xl px-4 py-3.5 border border-slate-200 shadow-sm">
                              <MapPin size={26} className="shrink-0 text-blue-600 mt-0.5" />
                              <span className="text-xl font-bold leading-snug break-words">{c.direccion}</span>
                            </div>
                          ) : (
                            <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide m-0">Sin dirección registrada</p>
                          )}
                          {(c.telefono || c.telefonoAlt) && (
                            <div className="flex items-center gap-3 text-gray-800">
                              <Phone size={22} className="shrink-0 text-green-600" />
                              <span className="text-xl font-bold tracking-wide">
                                {[c.telefono, c.telefonoAlt].filter(Boolean).join('   ·   ')}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Vista compacta: búsqueda por nombre → lista de varios */
                        <>
                          <div className="flex-1 min-w-0 pointer-events-none">
                            <h3 className="font-bold text-gray-800 m-0 text-[0.875rem] leading-tight truncate">{c.nombre}</h3>
                            {c.direccion ? (
                              <div className="flex items-start gap-1.5 mt-1 text-gray-800 bg-slate-100/80 rounded px-2 py-1.5 border border-slate-200 shadow-sm">
                                <MapPin size={15} className="shrink-0 text-blue-600 mt-0.5" />
                                <span className="text-[0.8125rem] font-bold leading-snug break-words line-clamp-2">{c.direccion}</span>
                              </div>
                            ) : (
                              <p className="text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-wide m-0 mt-1">Sin dirección</p>
                            )}
                          </div>
                          <CodigoBadge codigo={c.codigo} className="pointer-events-none shrink-0" />
                        </>
                      )}
                    </div>
                  );
                })}
                {filteredClientes.length === 0 && (
                  <div className="text-center text-gray-400 mt-10 font-medium px-4">No hay clientes encontrados</div>
                )}
              </>
            ) : (
              <>
                {carrerasDelDia.map((r: any) => {
                  const op = colorOperador(r.creadoPor);
                  return (
                    <div key={r.id} style={op.borderLeft} className="bg-white border-l-4 border border-y-gray-100 border-r-gray-100 p-4 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:-translate-x-1 hover:shadow-[0_8px_15px_-3px_rgba(6,81,237,0.15)] transition-all duration-300">
                      <div className="flex justify-between items-start mb-2">
                        <h3 style={op.textColor} className="font-bold m-0 text-[1rem] truncate max-w-[70%]">#{r.numeroDiario || r.id} - {r.cliente?.nombre || 'Cliente'}</h3>
                        <span className="text-xs font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{formatTime(r.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 m-0 flex items-center gap-2 font-medium">
                        <Car size={16} style={op.textColor}/>
                        {r.unidad ? `Unidad ${r.unidad.numeroUnidad} - ${r.unidad.choferNombre}` : 'Sin unidad asignada'}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <EstadoCarreraBadge estado={r.estado} />
                          {user?.rol === 'SUPERADMIN' && (
                            <button
                              onClick={() => setCareerToDelete(r.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                              title="Eliminar Carrera Permanentemente"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        {/* Nace TERMINADA. El estado actual ya lo muestra el badge de arriba (EstadoCarreraBadge) —
                            acá solo quedan las dos acciones de reclasificación; la que coincide con el estado
                            actual se muestra como texto fijo (no es un botón). */}
                        <div className="flex gap-1.5 items-center">
                          {r.estado === 'cancelada' ? (
                            <span className="text-[0.625rem] font-bold px-2 py-1 rounded bg-red-500 text-white">CANCELADA</span>
                          ) : (
                            <button
                              onClick={() => cancelarMutation.mutate(r.id)}
                              className="text-[0.625rem] font-bold px-2 py-1 rounded transition-colors bg-red-100 text-red-700 hover:bg-red-500 hover:text-white"
                            >
                              CANCELADA
                            </button>
                          )}
                          {r.estado === 'perdida' ? (
                            <span className="text-[0.625rem] font-bold px-2 py-1 rounded bg-orange-500 text-white">PERDIDA</span>
                          ) : (
                            <button
                              onClick={() => perderMutation.mutate(r.id)}
                              className="text-[0.625rem] font-bold px-2 py-1 rounded transition-colors bg-orange-100 text-orange-700 hover:bg-orange-500 hover:text-white"
                            >
                              PERDIDA
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {carrerasDelDia.length === 0 && (
                  <div className="text-center text-gray-400 mt-10 font-medium px-4">Todavía no hay carreras hoy. Buscá un cliente y asignale una unidad. 🚕</div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {isModalOpen && (
        <CarreraFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <UnidadDetalleModal
        unidad={detalleUnidad}
        carrerasHoy={detalleUnidad ? (carrerasHoy.get(detalleUnidad.id) || 0) : 0}
        onClose={() => setDetalleUnidad(null)}
      />

      <ConfirmDialog
        isOpen={careerToDelete !== null}
        onClose={() => setCareerToDelete(null)}
        onConfirm={() => {
          if (careerToDelete !== null) {
            deleteCarreraMutation.mutate(careerToDelete);
          }
          setCareerToDelete(null);
        }}
        title="Eliminar Carrera"
        message="¿Estás seguro de eliminar esta carrera permanentemente? Esta acción no se puede deshacer."
        confirmText="Sí, Eliminar"
      />
    </div>
  );
};
