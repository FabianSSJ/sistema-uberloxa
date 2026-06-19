import { Car, Users, Clock, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { useClientes } from '../../features/clientes/hooks/useClientes';
import { useUnidades } from '../../features/unidades/hooks/useUnidades';
import { useCarreras, useCreateCarrera, useCompletarCarrera, useCancelarCarrera, usePerderCarrera, useDeleteCarrera } from '../../features/carreras/hooks/useCarreras';
import { CarreraFormModal } from './CarreraFormModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useAuth } from '../../features/auth/context/AuthContext';

export const CharlieDashboard = () => {
  const { user } = useAuth();
  const { data: clientes = [] } = useClientes();
  const { data: unidades = [] } = useUnidades();
  const { data: allRidesData = [] } = useCarreras();
  
  // Filtrar para que el Charlie solo vea las carreras que Acl mismo ha creado
  const allRides = allRidesData.filter((r: any) => {
    // Si no hay user.id guardado en la carrera (carreras antiguas), o si coincide con el usuario actual
    return !r.creadoPorId || r.creadoPorId === user?.id;
  });

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

  const filteredUnidades = unidades.filter((u: any) => 
    (u.numeroUnidad || '').toLowerCase().includes(searchChofer.toLowerCase()) || 
    (u.choferNombre || '').toLowerCase().includes(searchChofer.toLowerCase()) ||
    (u.placa || '').toLowerCase().includes(searchChofer.toLowerCase())
  );

  const filteredClientes = clientes.filter((c: any) => {
    const query = searchCliente.toLowerCase().trim();
    if (!query) return true;
    const idFormatted = String(c.id).padStart(2, '0');
    return idFormatted.includes(query) || (c.nombre || '').toLowerCase().includes(query);
  });

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getTurnoColor = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const hour = date.getHours();
      // Mañana: 7 AM a 11:59 AM (Azul)
      if (hour >= 7 && hour < 12) {
        return { border: 'border-l-blue-500', icon: 'text-blue-500', text: 'text-blue-700' };
      }
      // Tarde: 12 PM a 6:59 PM (Naranja)
      if (hour >= 12 && hour < 19) {
        return { border: 'border-l-orange-500', icon: 'text-orange-500', text: 'text-orange-700' };
      }
      // Noche/Madrugada: 7 PM a 6:59 AM (Negro/Gris Oscuro)
      return { border: 'border-l-gray-800', icon: 'text-gray-800', text: 'text-gray-800' };
    } catch {
      return { border: 'border-l-gray-300', icon: 'text-gray-400', text: 'text-gray-500' };
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
              {unidades.length}
            </span>
          </div>
          <div className="px-5 pt-5 bg-slate-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar unidad, nombre, placa..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all shadow-sm"
                value={searchChofer}
                onChange={e => setSearchChofer(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3 flex flex-col gap-4 bg-slate-50/50">
            {filteredUnidades.map((u: any, idx: number) => {
              const isDragOver = dragOverItem?.type === 'CHOFER' && dragOverItem.id === u.id;
              return (
                <div 
                  key={idx} 
                  draggable
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
                  className={`border p-4 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:-translate-y-1 hover:shadow-[0_8px_15px_-3px_rgba(6,81,237,0.15)] transition-all duration-300 group cursor-grab active:cursor-grabbing ${isDragOver ? 'bg-amber-50 ring-2 ring-amber-400 border-amber-300 scale-[1.02]' : 'bg-white border-gray-100'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-black text-lg border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300 shadow-sm pointer-events-none">
                      {u.numeroUnidad || 'S/N'}
                    </div>
                    <div className="pointer-events-none">
                      <h3 className="font-bold text-gray-800 m-0 text-[16px]">{u.choferNombre || 'Sin Chofer'}</h3>
                      <p className="text-gray-500 text-sm m-0 mt-1 font-medium">{u.placa} • {u.vehiculo || 'Vehículo N/A'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredUnidades.length === 0 && <div className="text-center text-gray-400 mt-10 font-medium">No hay choferes encontrados</div>}
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
                placeholder="Buscar por código (ej. 01) o nombre..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all shadow-sm"
                value={searchCliente}
                onChange={e => setSearchCliente(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-5 pt-3 flex flex-col gap-4 bg-slate-50/50">
            {filteredClientes.map((c: any, idx: number) => {
              const isDragOver = dragOverItem?.type === 'CLIENTE' && dragOverItem.id === c.id;
              return (
                <div 
                  key={idx} 
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
                  className={`border p-3 rounded-lg shadow-sm hover:-translate-y-0.5 hover:shadow transition-all duration-200 group flex items-center gap-3 cursor-grab active:cursor-grabbing ${isDragOver ? 'bg-blue-50 ring-2 ring-blue-400 border-blue-300 scale-[1.02]' : 'bg-white border-gray-100'}`}
                >
                  <div className="w-10 h-10 min-w-[40px] rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-100 group-hover:bg-blue-500 group-hover:text-white transition-colors pointer-events-none">
                    {String(c.id).padStart(2, '0')}
                  </div>
                  <div className="flex-1 overflow-hidden pointer-events-none">
                    <h3 className="font-bold text-gray-800 m-0 text-[14px] truncate">{c.nombre}</h3>
                  </div>
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
              const statusColors = {
                pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
                asignada: 'bg-blue-100 text-blue-800 border-blue-200',
                completada: 'bg-green-100 text-green-800 border-green-200',
                cancelada: 'bg-red-100 text-red-800 border-red-200',
                perdida: 'bg-gray-200 text-gray-800 border-gray-300',
              };
              
              const colorClass = statusColors[r.estado as keyof typeof statusColors] || statusColors.perdida;
              const turno = getTurnoColor(r.createdAt);

              return (
                <div key={idx} className={`bg-white border-l-4 ${turno.border} border border-y-gray-100 border-r-gray-100 p-4 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:-translate-x-1 hover:shadow-[0_8px_15px_-3px_rgba(6,81,237,0.15)] transition-all duration-300`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold m-0 text-[16px] truncate max-w-[70%] ${turno.text}`}>{r.cliente?.nombre || 'Cliente'}</h3>
                    <span className="text-xs font-black text-gray-400 bg-gray-50 px-2 py-1 rounded-md">{formatTime(r.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 m-0 flex items-center gap-2 font-medium">
                    <Car size={16} className={turno.icon}/> 
                    {r.unidad ? `Unidad ${r.unidad.numeroUnidad} - ${r.unidad.choferNombre}` : 'Sin unidad asignada'}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-xs font-black rounded-md border ${colorClass}`}>
                        {r.estado.toUpperCase()}
                      </span>
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
                          className="text-[10px] font-bold bg-gray-100 text-gray-700 hover:bg-gray-500 hover:text-white px-2 py-1 rounded transition-colors"
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
