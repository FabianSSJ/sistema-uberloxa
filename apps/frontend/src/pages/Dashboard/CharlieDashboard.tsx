import { Car, Users, Clock, Plus, Search, Trash2, MapPin } from 'lucide-react';
import { useState, useMemo } from 'react';

import { useClientes } from '../../features/clientes/hooks/useClientes';
import { useColaDespacho } from '../../features/unidades/hooks/useColaDespacho';
import type { EstadoUnidad } from '../../features/unidades/services/unidades.service';
import { EstadoUnidadBadge, ESTADO_UNIDAD_STYLES } from '../../features/unidades/components/EstadoUnidadBadge';
import { useCarreras, useCreateCarrera, useCompletarCarrera, useCancelarCarrera, usePerderCarrera, useDeleteCarrera } from '../../features/carreras/hooks/useCarreras';
import { CarreraFormModal } from './CarreraFormModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CodigoBadge } from '../../components/ui/CodigoBadge';
import { EstadoCarreraBadge } from '../../features/carreras/components/EstadoCarreraBadge';
import { rankBy, scoreUnidad, scoreCliente } from '../../core/search/matchers';
import { colorOperador, colorUnidad } from '../../core/operadores/colores';
import { useAuth } from '../../features/auth/context/AuthContext';

export const CharlieDashboard = () => {
  const { user } = useAuth();
  const { data: clientes = [] } = useClientes();
  const { activas, carrerasHoy, proximaId } = useColaDespacho();
  const { data: allRidesData = [] } = useCarreras();
  
  // El Charlie solo ve las carreras que él mismo creó (memoizado: no recalcula en cada poll si no cambió).
  const allRides = useMemo(
    () => allRidesData.filter((r: any) => !r.creadoPorId || r.creadoPorId === user?.id),
    [allRidesData, user?.id]
  );

  const createCarreraMutation = useCreateCarrera();
  const completarMutation = useCompletarCarrera();
  const cancelarMutation = useCancelarCarrera();
  const perderMutation = usePerderCarrera();
  const deleteCarreraMutation = useDeleteCarrera();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchChofer, setSearchChofer] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [careerToDelete, setCareerToDelete] = useState<number | null>(null);
  
  const [draggedItem, setDraggedItem] = useState<{type: 'CHOFER' | 'CLIENTE', id: number} | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{type: 'CHOFER' | 'CLIENTE', id: number} | null>(null);

  // La Charlie solo ve las unidades ACTIVAS, en el orden de la cola (FIFO). Filtra preservando el orden.
  const filteredUnidades = useMemo(
    () => (searchChofer.trim() ? activas.filter((u) => scoreUnidad(u, searchChofer) > 0) : activas),
    [activas, searchChofer]
  );

  // El filtro más caro (sobre miles de clientes): memoizado para no correr en cada render/poll.
  const filteredClientes = useMemo(
    () => rankBy(clientes, searchCliente, scoreCliente),
    [clientes, searchCliente]
  );

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="-mt-5 -mx-10 -mb-15 h-[calc(100vh-180px)] bg-gray-100 p-5 animate-[fadeIn_0.5s_ease-in]">
      <div className="flex gap-6 h-full w-full">
        
        {/* Panel 1: Choferes / Unidades */}
        <div className="flex-1 bg-white rounded-2xl shadow-md border border-gray-200/60 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl">
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Car size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-bold m-0 tracking-wide">Choferes</h2>
            </div>
            <span className="bg-amber-700/50 px-3 py-1 rounded-full text-sm font-bold shadow-inner">
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
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3 flex flex-col gap-2.5 bg-slate-50/50">
            {filteredUnidades.map((u: any) => {
              const isDragOver = dragOverItem?.type === 'CHOFER' && dragOverItem.id === u.id;
              const est = ESTADO_UNIDAD_STYLES[(u.estado as EstadoUnidad) || 'disponible'];
              const esProxima = u.id === proximaId;
              const hoy = carrerasHoy.get(u.id) || 0;
              const colorU = colorUnidad(u);
              return (
                <div
                  key={u.id}
                  draggable
                  title="Arrastrá un cliente acá para asignar carrera"
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
                  className={`border-y border-r border-l-4 p-3 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:-translate-y-1 hover:shadow-[0_8px_15px_-3px_rgba(6,81,237,0.15)] transition-all duration-300 group cursor-grab active:cursor-grabbing ${isDragOver ? 'bg-amber-50 ring-2 ring-amber-400 border-amber-300 scale-[1.02]' : esProxima ? `bg-white ${colorU.key ? colorU.ring : 'ring-2 ring-emerald-400 border-emerald-200'}` : `bg-white border-y-gray-100 border-r-gray-100 ${colorU.key ? colorU.border : 'border-l-gray-200'}`}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center shrink-0 pointer-events-none">
                      <div className={`w-11 h-11 min-w-11 rounded-full flex items-center justify-center font-black text-base border group-hover:opacity-90 transition-opacity duration-300 shadow-sm ${colorU.key ? colorU.badge : est.avatar}`}>
                        {u.numeroUnidad || 'S/N'}
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Unidad</span>
                    </div>
                    <div className="pointer-events-none flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-gray-800 m-0 text-[13px] leading-tight truncate">{u.choferNombre || 'Sin Chofer'}</h3>
                        {esProxima && <span className="text-[9px] font-black uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded shrink-0">Próxima</span>}
                      </div>
                      <p className="text-gray-500 text-[11px] m-0 mt-0.5 font-medium truncate">Placa {u.placa} · {u.vehiculo || 'Vehículo N/A'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 pointer-events-none shrink-0">
                      <EstadoUnidadBadge unidad={u} />
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">{hoy} {hoy === 1 ? 'carrera' : 'carreras'} hoy</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredUnidades.length === 0 && <div className="text-center text-gray-400 mt-10 font-medium">{searchChofer ? 'Sin resultados' : 'No hay unidades activas'}</div>}
          </div>
        </div>

        {/* Panel 2: Clientes */}
        <div className="flex-1 bg-white rounded-2xl shadow-md border border-gray-200/60 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Users size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-bold m-0 tracking-wide">Clientes</h2>
            </div>
            <span className="bg-blue-700/50 px-3 py-1 rounded-full text-sm font-bold shadow-inner">
              {clientes.length}
            </span>
          </div>
          <div className="px-5 pt-5 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por código, nombre, teléfono, dirección, sector..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm"
                value={searchCliente}
                onChange={e => setSearchCliente(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3 flex flex-col gap-2.5 bg-slate-50/50">
            {filteredClientes.map((c: any, idx: number) => {
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
                    }
                    setDraggedItem(null); setDragOverItem(null);
                  }}
                  className={`border p-2.5 rounded-lg shadow-sm hover:-translate-y-0.5 hover:shadow transition-all duration-200 group flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing ${isDragOver ? 'bg-blue-50 ring-2 ring-blue-400 border-blue-300 scale-[1.02]' : 'bg-white border-gray-100'}`}
                >
                  <div className="flex-1 min-w-0 pointer-events-none">
                    <h3 className="font-bold text-gray-800 m-0 text-[14px] leading-tight truncate">{c.nombre}</h3>
                    {c.direccion ? (
                      <div className="flex items-start gap-1.5 mt-1 text-gray-800 bg-slate-100/80 rounded px-2 py-1.5 border border-slate-200 shadow-sm">
                        <MapPin size={15} className="shrink-0 text-blue-600 mt-0.5" />
                        <span className="text-[13px] font-bold leading-snug break-words line-clamp-2">{c.direccion}</span>
                      </div>
                    ) : (
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide m-0 mt-1">Sin dirección</p>
                    )}
                  </div>
                  <CodigoBadge codigo={c.codigo} className="pointer-events-none shrink-0" />
                </div>
              );
            })}
            {filteredClientes.length === 0 && <div className="text-center text-gray-400 mt-10 font-medium">No hay clientes encontrados</div>}
          </div>
        </div>

        {/* Panel 3: Carreras */}
        <div className="flex-1 bg-white rounded-2xl shadow-md border border-gray-200/60 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl relative">
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-4 text-white flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Clock size={24} className="text-white" />
              </div>
              <h2 className="text-xl font-bold m-0 tracking-wide">Carreras</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-green-700/50 px-3 py-1 rounded-full text-sm font-bold shadow-inner">
                {allRides.length}
              </span>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-green-600 p-1.5 rounded-lg hover:bg-green-50 hover:scale-105 transition-all shadow-sm cursor-pointer border border-transparent hover:border-green-100"
                title="Nueva Carrera"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-slate-50/50">
            {allRides.map((r: any, idx: number) => {
              const op = colorOperador(r.creadoPor);

              return (
                <div key={r.id} className={`bg-white border-l-4 ${op.border} border border-y-gray-100 border-r-gray-100 p-4 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:-translate-x-1 hover:shadow-[0_8px_15px_-3px_rgba(6,81,237,0.15)] transition-all duration-300`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold m-0 text-[16px] truncate max-w-[70%] ${op.text}`}>#{r.numeroDiario || r.id} - {r.cliente?.nombre || 'Cliente'}</h3>
                    <span className="text-xs font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{formatTime(r.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 m-0 flex items-center gap-2 font-medium">
                    <Car size={16} className={op.icon}/>
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
                    {['pendiente', 'asignada'].includes(r.estado) && (
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => completarMutation.mutate({ id: r.id })} 
                          className="text-[10px] font-bold bg-green-100 text-green-700 hover:bg-green-500 hover:text-white px-2 py-1 rounded transition-colors"
                        >
                          TERMINADA
                        </button>
                        <button 
                          onClick={() => cancelarMutation.mutate(r.id)} 
                          className="text-[10px] font-bold bg-red-100 text-red-700 hover:bg-red-500 hover:text-white px-2 py-1 rounded transition-colors"
                        >
                          CANCELADA
                        </button>
                        <button 
                          onClick={() => perderMutation.mutate(r.id)}
                          className="text-[10px] font-bold bg-orange-100 text-orange-700 hover:bg-orange-500 hover:text-white px-2 py-1 rounded transition-colors"
                        >
                          PERDIDA
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {allRides.length === 0 && <div className="text-center text-gray-400 mt-10 font-medium">No hay carreras registradas</div>}
          </div>
        </div>

      </div>

      {isModalOpen && (
        <CarreraFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}

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
