import { Car, Clock, Plus, Search, Trash2, MapPin, Phone, Moon, Play, Power, PowerOff, Unlock, TrendingUp, CheckCircle2, AlertTriangle, XCircle, UserPlus, X, Send } from 'lucide-react';
import { useState, useMemo, useRef, type ReactNode, type KeyboardEvent } from 'react';

import { useClientes, useCreateCliente } from '../../features/clientes/hooks/useClientes';
import { useColaDespacho } from '../../features/unidades/hooks/useColaDespacho';
import { useCambiarEstadoUnidad } from '../../features/unidades/hooks/useUnidades';
import { ESTADO_UNIDAD_STYLES } from '../../features/unidades/components/EstadoUnidadBadge';
import { UnidadDetalleModal } from '../../features/unidades/components/UnidadDetalleModal';
import { CarreraDetalleModal } from '../../features/carreras/components/CarreraDetalleModal';
import { useCreateCarrera, useCompletarCarrera, useCancelarCarrera, usePerderCarrera, useDeleteCarrera } from '../../features/carreras/hooks/useCarreras';
import type { CreateCarreraDto } from '../../features/carreras/services/carreras.service';
import { CarreraFormModal } from './CarreraFormModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CodigoBadge, formatCodigo } from '../../components/ui/CodigoBadge';
import { Switch } from '../../components/ui/Switch';
import { ESTADO_CARRERA_STYLES } from '../../features/carreras/components/EstadoCarreraBadge';
import { notify } from '../../components/ui/toast';
import { rankBy, scoreUnidad, scoreCliente } from '../../core/search/matchers';
import { colorOperador, colorUnidad } from '../../core/operadores/colores';
import { hora } from '../../core/tiempo';
import { useAuth } from '../../features/auth/context/AuthContext';

export const CharlieDashboard = () => {
  const { user } = useAuth();
  const { data: clientes = [] } = useClientes();
  // carreras viene del mismo poll combinado que unidades (ver useColaDespacho) — antes esta
  // pantalla pedía /carreras/panel y /unidades cada una por su cuenta cada 1s, el doble de
  // requests por pestaña abierta de los necesarios.
  const { unidades: todasUnidades, carreras: allRidesData, carrerasHoy } = useColaDespacho();

  // El server ya resuelve "hoy + en proceso con ventana de gracia" — acá solo se filtra
  // por dueño (el Charlie ve las suyas; las de creador null quedan visibles para todos).
  // Orden de la cola: las PENDIENTES (sin resolver todavía) van SIEMPRE primero, sin importar
  // cuándo se crearon — son las que necesitan acción ya. Las resueltas (completada/cancelada/
  // perdida) van después, en su orden natural por hora de creación (la API ya devuelve id
  // desc = más nueva primero, así que separar preservando el orden relativo alcanza).
  const carrerasDelDia = useMemo(() => {
    const pendientes = allRidesData.filter((r: any) => r.estado === 'pendiente');
    const resueltas = allRidesData.filter((r: any) => r.estado !== 'pendiente');
    return [...pendientes, ...resueltas];
  }, [allRidesData]);

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
  const createClienteMutation = useCreateCliente();
  const completarMutation = useCompletarCarrera();
  const cancelarMutation = useCancelarCarrera();
  const perderMutation = usePerderCarrera();
  const deleteCarreraMutation = useDeleteCarrera();
  const cambiarEstadoMutation = useCambiarEstadoUnidad();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<number | undefined>(undefined);
  const [searchChofer, setSearchChofer] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [modoRapido, setModoRapido] = useState(false);
  const [rapidoNombre, setRapidoNombre] = useState('');
  const [rapidoTelefono, setRapidoTelefono] = useState('');
  const [careerToDelete, setCareerToDelete] = useState<number | null>(null);
  const [detalleUnidad, setDetalleUnidad] = useState<any>(null);
  const [detalleCarrera, setDetalleCarrera] = useState<any>(null);
  const [numUnidadRapido, setNumUnidadRapido] = useState('');
  const [rapidoEncomienda, setRapidoEncomienda] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const unitInputRef = useRef<HTMLInputElement>(null);

  // Único punto de creación de carrera de todo el dashboard: SIEMPRE manda el toggle de
  // Encomienda vigente y SIEMPRE lo resetea al terminar. Existe para que sea estructuralmente
  // imposible que un nuevo botón/handler se olvide de alguno de los dos pasos, como pasó acá
  // (varios lugares creaban la carrera sin pasar esEncomienda).
  const crearCarrera = (
    payload: Omit<CreateCarreraDto, 'esEncomienda'>,
    options?: { onSuccess?: () => void },
  ) => {
    createCarreraMutation.mutate(
      { ...payload, esEncomienda: rapidoEncomienda },
      { onSuccess: () => { setRapidoEncomienda(false); options?.onSuccess?.(); } },
    );
  };

  const despacharConUnidad = (clienteId: number, numUnidadStr: string) => {
    const numClean = numUnidadStr.trim();
    if (!numClean) {
      crearPendiente(clienteId);
      return;
    }
    const unidadTarget = todasUnidades.find((u: any) => {
      const num = (u.numeroUnidad || '').toString().trim();
      return num === numClean || parseInt(num, 10) === parseInt(numClean, 10);
    });

    if (!unidadTarget) {
      notify.error(`No se encontró la Unidad Nº "${numClean}". Verificá el número.`);
      return;
    }

    if (unidadTarget.estado === 'inactivo') {
      notify.error(`La unidad Nº ${unidadTarget.numeroUnidad || 'S/N'} está inactiva — activala antes de asignarle una carrera.`);
      return;
    }

    crearCarrera(
      { clienteId, unidadId: unidadTarget.id, notas: 'Despacho Rápido' },
      {
        onSuccess: () => {
          setSearchCliente('');
          setNumUnidadRapido('');
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      }
    );
  };

  const [draggedItem, setDraggedItem] = useState<{type: 'CHOFER' | 'CLIENTE', id: number} | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{type: 'CHOFER' | 'CLIENTE' | 'CARRERA', id: number} | null>(null);

  // TODAS las unidades ordenadas: primero las ACTIVAS, despues por MAS carreras de hoy y,
  // en caso de empate, por quien se activo primero (activadoEn) — no por numero de unidad.
  // activadoEn sobrevive los ciclos de descanso (ver unidades.service.ts#cambiarEstado):
  // solo se resetea cuando la unidad pasa por 'inactivo' y vuelve a activarse.
  const unidadesOrdenadas = useMemo(() => {
    return [...todasUnidades].sort((a: any, b: any) => {
      const activaA = a.estado !== 'inactivo' ? 1 : 0;
      const activaB = b.estado !== 'inactivo' ? 1 : 0;
      if (activaA !== activaB) return activaB - activaA;
      const carrerasA = carrerasHoy.get(a.id) || 0;
      const carrerasB = carrerasHoy.get(b.id) || 0;
      if (carrerasA !== carrerasB) return carrerasB - carrerasA;
      const activadoA = a.activadoEn ? new Date(a.activadoEn).getTime() : Infinity;
      const activadoB = b.activadoEn ? new Date(b.activadoEn).getTime() : Infinity;
      return activadoA - activadoB;
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

  // Registrar la carrera SIN unidad todavía: nace 'pendiente' (sin estado/unidadId en el DTO,
  // el backend ya default-ea a eso) y queda esperando en el tope de la cola hasta que se le
  // arrastre una unidad o se la marque cancelada/perdida.
  const crearPendiente = (clienteId: number) => {
    crearCarrera({ clienteId }, { onSuccess: () => setSearchCliente('') });
  };

  // Enter en el buscador = registrar la carrera inmediatamente con UN SOLO ENTER (sin requerir un segundo Enter).
  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredClientes.length > 0) {
      e.preventDefault();
      crearPendiente(filteredClientes[0].id);
    }
  };

  // Cliente que llama y NO está en la base (no hay tiempo de buscarlo/cargarlo entero):
  // se crea con lo mínimo (nombre y/o teléfono, ninguno de los dos obligatorio por sí solo)
  // y, como nace SIN código, cae directo en la bandeja de "Nuevos" para completarlo después.
  // En el mismo paso se registra la carrera pendiente, igual que al elegir un cliente existente.
  const crearClienteRapidoYCarrera = () => {
    const nombre = rapidoNombre.trim();
    const telefono = rapidoTelefono.trim();
    if (!nombre && !telefono) return;

    createClienteMutation.mutate(
      // Si falta el nombre, el backend arma uno provisorio a partir del teléfono
      // (misma regla que el alta desde la sección Clientes) — no la duplicamos acá.
      { nombre: nombre || undefined, telefono: telefono || undefined },
      {
        onSuccess: (cliente) => {
          crearCarrera({ clienteId: cliente.id });
          setRapidoNombre('');
          setRapidoTelefono('');
          setModoRapido(false); // vuelve solo a buscar/agregar/eliminar: no se queda ocupando espacio
        },
      }
    );
  };

  const handleRapidoKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') crearClienteRapidoYCarrera();
  };

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

        {/* Panel 1: Choferes / Unidades */}
        <div className="flex-1 bg-white rounded-2xl shadow-md border border-gray-200/60 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-3 text-white flex items-center gap-3 shadow-sm">
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
          <div className="px-4 pt-3 bg-slate-50/50">
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
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[0.625rem] font-semibold text-gray-500">
              {(['disponible', 'descanso', 'inactivo'] as const).map((e) => (
                <span key={e} className="inline-flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${ESTADO_UNIDAD_STYLES[e].dot}`} />
                  {ESTADO_UNIDAD_STYLES[e].label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2 content-start bg-slate-50/50">
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
                    // Una unidad inactiva no puede tomar carreras
                    if (estado === 'inactivo') {
                      e.preventDefault();
                      notify.error(`La unidad Nº ${u.numeroUnidad || 'S/N'} está inactiva — activala antes de asignarle una carrera.`);
                      return;
                    }
                    setDraggedItem({ type: 'CHOFER', id: u.id });
                    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'CHOFER', id: u.id }));
                  }}
                  onDragEnd={() => { setDraggedItem(null); setDragOverItem(null); }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedItem && draggedItem.type === 'CLIENTE' && estado !== 'inactivo') setDragOverItem({ type: 'CHOFER', id: u.id });
                  }}
                  onDragLeave={() => setDragOverItem(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedItem && draggedItem.type === 'CLIENTE') {
                      if (estado === 'inactivo') {
                        notify.error(`La unidad Nº ${u.numeroUnidad || 'S/N'} está inactiva — activala antes de asignarle una carrera.`);
                      } else {
                        crearCarrera({ clienteId: draggedItem.id, unidadId: u.id, notas: 'Asignación Rápida' });
                      }
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
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-3 text-white flex justify-between items-center shadow-sm">
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
                onClick={() => { setSelectedClienteId(undefined); setIsModalOpen(true); }}
                className="bg-white text-green-600 p-1.5 rounded-lg hover:bg-green-50 hover:scale-105 transition-all shadow-sm cursor-pointer"
                title="Nueva Carrera"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Buscador de clientes (para despachar) | modo Crear rápido para el que llama y no está en la base */}
          <div className="px-4 pt-3 bg-slate-50/50">
            {!modoRapido ? (
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar cliente por código, nombre, teléfono, dirección..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all shadow-sm"
                    value={searchCliente}
                    onChange={e => setSearchCliente(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setModoRapido(true)}
                  title="Cliente nuevo que llama y no está registrado: crearlo con lo mínimo"
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-green-200 bg-white text-green-700 text-sm font-bold hover:bg-green-50 transition-colors shadow-sm"
                >
                  <UserPlus size={16} />
                  <span className="hidden sm:inline">Crear rápido</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Nombre (opcional)"
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all shadow-sm"
                  value={rapidoNombre}
                  onChange={e => setRapidoNombre(e.target.value)}
                  onKeyDown={handleRapidoKeyDown}
                />
                <input
                  type="tel"
                  placeholder="Teléfono (opcional)"
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all shadow-sm"
                  value={rapidoTelefono}
                  onChange={e => setRapidoTelefono(e.target.value)}
                  onKeyDown={handleRapidoKeyDown}
                />
                <button
                  type="button"
                  onClick={crearClienteRapidoYCarrera}
                  disabled={!rapidoNombre.trim() && !rapidoTelefono.trim()}
                  title="Registrar carrera pendiente con este cliente nuevo"
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <UserPlus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => { setModoRapido(false); setRapidoNombre(''); setRapidoTelefono(''); }}
                  title="Volver a buscar"
                  className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors shadow-sm"
                >
                <X size={16} />
                </button>
              </div>
            )}
            {!modoRapido && searchCliente.trim() && (
              <p className="text-[0.6875rem] text-gray-500 mt-1 px-1">Enter o click registra la carrera pendiente (sin unidad); arrastrá una unidad encima para asignarla directo.</p>
            )}
          </div>

          {/* Contenido: buscando → cliente para despachar con mini-columna de últimas unidades al lado | sin buscar → carreras del día */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 flex flex-col gap-2 bg-slate-50/50">
            {searchCliente.trim() ? (
              <div className="flex flex-col gap-2">
                {filteredClientes.map((c: any) => {
                  const isDragOver = dragOverItem?.type === 'CLIENTE' && dragOverItem.id === c.id;
                  return (
                    <div
                      key={c.id}
                      draggable
                      onClick={() => crearPendiente(c.id)}
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
                          const unidadDrag = todasUnidades.find((u: any) => u.id === draggedItem.id);
                          if (unidadDrag?.estado === 'inactivo') {
                            notify.error(`La unidad Nº ${unidadDrag.numeroUnidad || 'S/N'} está inactiva — activala antes de asignarle una carrera.`);
                          } else {
                            crearCarrera({ clienteId: c.id, unidadId: draggedItem.id, notas: 'Asignación Rápida' });
                            setSearchCliente('');
                          }
                        }
                        setDraggedItem(null); setDragOverItem(null);
                      }}
                      title="Click para registrar la carrera pendiente (sin unidad) · arrastrá una unidad encima para asignarla directo"
                      className={`border rounded-lg shadow-sm hover:shadow transition-all duration-200 group cursor-pointer ${esBusquedaCodigo ? 'p-3 flex flex-col gap-2 bg-white border-gray-200' : 'p-2.5 flex items-center justify-between gap-2 bg-white border-gray-100'} ${isDragOver ? 'bg-green-50 ring-2 ring-green-400 border-green-300 scale-[1.01]' : ''}`}
                    >
                      {esBusquedaCodigo ? (
                        /* Vista por código: 2 columnas A UN LADITO (Izquierda: ÚLTIMAS UNIDADES | Derecha: DATOS CLIENTE) */
                        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-3" onClick={(e) => e.stopPropagation()}>
                          {/* Columna Izquierda (A un ladito): Últimas unidades despachadas */}
                          <div className="md:col-span-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col gap-2">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                              <span className="text-[0.6875rem] font-black text-gray-700 uppercase tracking-wider">Últimas Despachadas</span>
                              <span className="text-[0.5625rem] text-gray-400 font-bold">Recientes</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[220px]">
                              {carrerasDelDia.slice(0, 10).map((r: any) => {
                                const numU = r.unidad?.numeroUnidad;
                                return (
                                  <button
                                    key={r.id}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (numU) {
                                        setNumUnidadRapido(numU.toString());
                                        setTimeout(() => unitInputRef.current?.focus(), 30);
                                      }
                                    }}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-amber-100/80 active:bg-amber-200 rounded-lg border border-gray-200 shadow-2xs transition cursor-pointer"
                                    title={numU ? `Unidad Nº ${numU} · Click para elegir` : 'Sin unidad'}
                                  >
                                    <Car size={14} className={numU ? 'text-amber-600' : 'text-gray-400'} />
                                    <span className="font-black text-gray-900 text-sm font-mono">
                                      {numU ? `Nº ${numU}` : 'S/N'}
                                    </span>
                                  </button>
                                );
                              })}
                              {carrerasDelDia.length === 0 && (
                                <div className="text-[0.6875rem] text-gray-400 text-center py-4 w-full">Sin carreras previas hoy</div>
                              )}
                            </div>
                          </div>

                          {/* Columna Derecha: Datos del Cliente + Despacho */}
                          <div className="md:col-span-8 flex flex-col justify-between gap-2">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-black text-gray-900 m-0 text-xl leading-tight break-words">{c.nombre}</h3>
                                <span className="shrink-0 inline-flex flex-col items-center bg-blue-50 text-blue-700 border border-blue-200 rounded-xl px-3 py-1 shadow-sm">
                                  <span className="text-[0.5625rem] font-bold uppercase tracking-widest text-blue-400">Código</span>
                                  <span className="text-2xl font-black font-mono leading-none">{formatCodigo(c.codigo)}</span>
                                </span>
                              </div>

                              {c.direccion ? (
                                <div className="flex items-start gap-1.5 text-gray-800 bg-slate-100/80 rounded-lg px-2.5 py-1.5 border border-slate-200 shadow-sm">
                                  <MapPin size={16} className="shrink-0 text-blue-600 mt-0.5" />
                                  <span className="text-xs font-bold leading-snug break-words">{c.direccion}</span>
                                </div>
                              ) : (
                                <p className="text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-wide m-0">Sin dirección registrada</p>
                              )}

                              {(c.telefono || c.telefonoAlt) && (
                                <div className="flex items-center gap-1.5 text-gray-800">
                                  <Phone size={14} className="shrink-0 text-green-600" />
                                  <span className="text-xs font-bold tracking-wide">
                                    {[c.telefono, c.telefonoAlt].filter(Boolean).join('   ·   ')}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Campo de despacho + Encomienda switch */}
                            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <label className="text-[0.6875rem] font-bold uppercase tracking-wider text-gray-500">
                                  Despachar a Unidad
                                </label>
                                <Switch checked={rapidoEncomienda} onChange={setRapidoEncomienda} label="Encomienda" size="sm" />
                              </div>
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  despacharConUnidad(c.id, numUnidadRapido);
                                }}
                                className="w-full"
                              >
                                <div className="relative w-full">
                                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" size={18} />
                                  <input
                                    ref={unitInputRef}
                                    type="text"
                                    placeholder="Nº de Unidad y Enter..."
                                    value={numUnidadRapido}
                                    onChange={(e) => setNumUnidadRapido(e.target.value)}
                                    className="w-full pl-9 pr-4 py-1.5 bg-amber-50/60 border-2 border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-base font-black text-gray-900 rounded-xl outline-none transition shadow-sm placeholder:text-gray-400 placeholder:font-normal"
                                  />
                                </div>
                              </form>
                              <div className="flex items-center justify-between text-[0.6875rem] text-gray-400 font-medium px-1">
                                <span>Enter para despachar</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    crearCarrera(
                                      { clienteId: c.id, estado: 'perdida', notas: 'Sin unidad disponible' },
                                      { onSuccess: () => { setSearchCliente(''); setNumUnidadRapido(''); } }
                                    );
                                  }}
                                  className="text-orange-600 hover:text-orange-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <AlertTriangle size={11} />
                                  <span>Carrera Perdida</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Vista compacta: búsqueda por nombre → lista con botón de Carrera Perdida únicamente */
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
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <CodigoBadge codigo={c.codigo} className="pointer-events-none shrink-0" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                crearCarrera(
                                  { clienteId: c.id, estado: 'perdida', notas: 'Sin unidad disponible' },
                                  { onSuccess: () => setSearchCliente('') }
                                );
                              }}
                              title="Registrar como carrera perdida (sin unidad)"
                              className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-md transition flex items-center gap-1 shadow-sm"
                            >
                              <AlertTriangle size={13} />
                              <span>Perdida</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                {filteredClientes.length === 0 && (
                  <div className="text-center text-gray-400 my-4 font-medium px-4">No hay clientes encontrados</div>
                )}
              </div>
            ) : (
              <>
                {carrerasDelDia.map((r: any) => {
                  const op = colorOperador(r.creadoPor);
                  const esPendiente = r.estado === 'pendiente';
                  const estadoCls = ESTADO_CARRERA_STYLES[r.estado as keyof typeof ESTADO_CARRERA_STYLES] || 'bg-gray-200 text-gray-800 border-gray-300';
                  const isDragOverCarrera = esPendiente && dragOverItem?.type === 'CARRERA' && dragOverItem.id === r.id;
                  return (
                    <div
                      key={r.id}
                      style={op.borderLeft}
                      onClick={() => setDetalleCarrera(r)}
                      title="Click para ver detalle del cliente y la carrera"
                      onDragOver={esPendiente ? (e) => {
                        e.preventDefault();
                        if (draggedItem?.type === 'CHOFER') setDragOverItem({ type: 'CARRERA', id: r.id });
                      } : undefined}
                      onDragLeave={esPendiente ? () => setDragOverItem(null) : undefined}
                      onDrop={esPendiente ? (e) => {
                        e.preventDefault();
                        if (draggedItem?.type === 'CHOFER') {
                          const unidadDrag = todasUnidades.find((u: any) => u.id === draggedItem.id);
                          if (unidadDrag?.estado === 'inactivo') {
                            notify.error(`La unidad Nº ${unidadDrag.numeroUnidad || 'S/N'} está inactiva — activala antes de asignarle una carrera.`);
                          } else {
                            completarMutation.mutate({ id: r.id, unidadId: draggedItem.id });
                          }
                        }
                        setDraggedItem(null); setDragOverItem(null);
                      } : undefined}
                      className={`border-l-4 border rounded-lg pl-3 pr-2.5 py-2.5 flex items-center gap-2.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                        r.esEncomienda
                          ? 'bg-amber-50/90 border-amber-300'
                          : isDragOverCarrera
                            ? 'bg-amber-50 ring-2 ring-amber-400 border-amber-300 scale-[1.01]'
                            : esPendiente
                              ? 'bg-white border-y-amber-200 border-r-amber-200'
                              : 'bg-white border-y-gray-100 border-r-gray-100'
                      }`}
                    >
                      <span className={`shrink-0 w-2 h-2 rounded-full ${esPendiente ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'}`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <CodigoBadge codigo={r.cliente?.codigo} className="shrink-0" />
                          <p style={op.textColor} className="font-bold text-sm leading-tight truncate m-0">
                            {r.cliente?.nombre || 'Cliente'}
                          </p>
                          {r.esEncomienda && (
                            <span className="px-1.5 py-0.5 text-[0.625rem] font-black bg-amber-200 text-amber-900 rounded border border-amber-400 shrink-0 uppercase tracking-tight">
                              ENC
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 leading-tight truncate m-0 flex items-center gap-1 mt-1">
                          <Car size={11} className="shrink-0" />
                          {r.unidad
                            ? `${r.unidad.numeroUnidad || 'S/N'} · ${r.unidad.choferNombre}`
                            : esPendiente ? 'Esperando unidad — arrastrá una acá' : 'Sin unidad'}
                        </p>
                      </div>

                      <span className={`shrink-0 text-[0.6875rem] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${estadoCls}`}>
                        {String(r.estado || '').toUpperCase()}
                      </span>

                      <span className="shrink-0 text-xs font-black text-gray-400 tabular-nums">{formatTime(r.createdAt)}</span>

                      <div className="flex items-center gap-1 shrink-0">
                        {r.estado !== 'cancelada' && btnEstado(<XCircle size={12} />, 'Marcar cancelada', 'bg-red-500', () => cancelarMutation.mutate(r.id))}
                        {r.estado !== 'perdida' && btnEstado(<AlertTriangle size={12} />, 'Marcar perdida', 'bg-orange-500', () => perderMutation.mutate(r.id))}
                        {(user?.rol === 'SUPERADMIN' || (esPendiente && r.creadoPorId === user?.id)) &&
                          btnEstado(<Trash2 size={12} />, 'Eliminar carrera', 'bg-gray-400', () => setCareerToDelete(r.id))}
                      </div>
                    </div>
                  );
                })}
                {carrerasDelDia.length === 0 && (
                  <div className="text-center text-gray-400 mt-10 font-medium px-4">Todavía no hay carreras registradas hoy. Buscá un cliente para asignarle una unidad o registrarla.</div>
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

      <CarreraDetalleModal
        carrera={detalleCarrera}
        onClose={() => setDetalleCarrera(null)}
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
