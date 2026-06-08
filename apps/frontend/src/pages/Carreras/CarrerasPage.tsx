import { useState, useMemo } from 'react';
import { useCarreras } from '../../features/carreras/hooks/useCarreras';
import { Carrera, EstadoCarrera } from '../../features/carreras/services/carreras.service';
import { Button } from '../../components/ui/Button';
import { Plus, Navigation, CheckCircle, XCircle, Clock, Search, History } from 'lucide-react';
import { NuevaCarreraModal } from './NuevaCarreraModal';
import { AsignarUnidadModal } from './AsignarUnidadModal';

type TabType = 'despacho' | 'historial';

export const CarrerasPage = () => {
  const { carrerasQuery, updateEstadoMutation } = useCarreras();
  const [isNuevaOpen, setIsNuevaOpen] = useState(false);
  const [asignarCarrera, setAsignarCarrera] = useState<Carrera | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('despacho');

  // Filtros Historial
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroFecha, setFiltroFecha] = useState<string>('');

  const carreras = carrerasQuery.data || [];

  // Dividir por estado
  const sinAsignar = carreras.filter(c => c.estado === 'sin_asignar');
  const pendientes = carreras.filter(c => c.estado === 'pendiente');
  
  // Historial: las que ya terminaron su ciclo
  const historialBase = carreras.filter(c => ['aceptada', 'cancelada', 'perdida'].includes(c.estado));

  // Aplicar filtros al historial
  const historialFiltrado = useMemo(() => {
    return historialBase.filter(c => {
      let cumpleEstado = filtroEstado === 'todos' || c.estado === filtroEstado;
      let cumpleFecha = true;
      if (filtroFecha) {
        const fechaCarrera = new Date(c.createdAt).toISOString().split('T')[0];
        cumpleFecha = fechaCarrera === filtroFecha;
      }
      return cumpleEstado && cumpleFecha;
    });
  }, [historialBase, filtroEstado, filtroFecha]);

  const handleUpdateEstado = (id: number, estado: EstadoCarrera) => {
    updateEstadoMutation.mutate({ id, data: { estado } });
  };

  const EstadoBadge = ({ estado }: { estado: EstadoCarrera }) => {
    switch (estado) {
      case 'sin_asignar':
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded flex items-center gap-1"><Search size={14}/> POR ASIGNAR</span>;
      case 'pendiente':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded flex items-center gap-1"><Clock size={14}/> EN CAMINO</span>;
      case 'aceptada':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded flex items-center gap-1"><CheckCircle size={14}/> ACEPTADA</span>;
      case 'cancelada':
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded flex items-center gap-1"><XCircle size={14}/> CANCELADA</span>;
      case 'perdida':
        return <span className="px-2 py-1 bg-gray-800 text-gray-200 text-xs font-bold rounded flex items-center gap-1"><XCircle size={14}/> PERDIDA</span>;
      default:
        return null;
    }
  };

  const CarreraCard = ({ carrera }: { carrera: Carrera }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative overflow-hidden">
      {carrera.estado === 'sin_asignar' && (
        <div className="absolute top-0 left-0 w-1 h-full bg-slate-400"></div>
      )}
      {carrera.estado === 'pendiente' && (
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
      )}

      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-bold text-gray-800 text-lg">{carrera.cliente.nombre}</h4>
          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
            <Navigation size={14} className="text-blue-500" />
            {carrera.cliente.direccion || 'Dirección no registrada'} 
            {carrera.cliente.sector?.nombre && ` (${carrera.cliente.sector.nombre})`}
          </p>
          <p className="text-sm text-gray-500 mt-1">📞 {carrera.cliente.telefono}</p>
        </div>
        <EstadoBadge estado={carrera.estado} />
      </div>

      {carrera.notas && (
        <div className="mt-3 p-2 bg-slate-50 text-slate-700 text-sm rounded border border-slate-200">
          <strong>Notas:</strong> {carrera.notas}
        </div>
      )}

      {carrera.unidad && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between bg-blue-50/50 p-2 rounded">
          <span className="text-sm font-medium text-gray-700">🚖 Unidad asignada:</span>
          <span className="font-bold text-blue-700 bg-blue-100/50 px-2 py-1 rounded">
            {carrera.unidad.placa} ({carrera.unidad.choferNombre})
          </span>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="mt-4 flex flex-wrap gap-2 justify-end">
        {carrera.estado === 'sin_asignar' && (
          <>
            <Button variant="danger" onClick={() => handleUpdateEstado(carrera.id, 'cancelada')} isLoading={updateEstadoMutation.isPending}>Cancelar</Button>
            <Button onClick={() => setAsignarCarrera(carrera)}>Asignar Unidad</Button>
          </>
        )}
        
        {carrera.estado === 'pendiente' && (
          <>
            <Button variant="danger" onClick={() => handleUpdateEstado(carrera.id, 'cancelada')} isLoading={updateEstadoMutation.isPending}>Cancelar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleUpdateEstado(carrera.id, 'aceptada')} isLoading={updateEstadoMutation.isPending}>
              Marcar como Aceptada
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-[fadeIn_0.5s_ease-in] h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl text-gray-800 m-0 font-bold flex items-center gap-2">
          <Navigation className="text-blue-600" />
          Central de Despacho
        </h2>
        <Button onClick={() => setIsNuevaOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus size={18} />
          Despachar Carrera
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-lg p-1 border border-gray-200 mb-6 w-fit shadow-sm">
        <button 
          onClick={() => setActiveTab('despacho')}
          className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'despacho' ? 'bg-slate-800 text-white shadow' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <Navigation size={16} /> Carreras Activas
        </button>
        <button 
          onClick={() => setActiveTab('historial')}
          className={`flex items-center gap-2 px-6 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === 'historial' ? 'bg-slate-800 text-white shadow' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
        >
          <History size={16} /> Historial
        </button>
      </div>

      {carrerasQuery.isLoading ? (
        <div className="text-center py-20 text-gray-500">Cargando tablero de despacho...</div>
      ) : carrerasQuery.isError ? (
        <div className="text-center py-20 text-red-500 bg-red-50 rounded-lg">Error al conectar con la central.</div>
      ) : (
        <div className="flex-1">
          
          {/* TAB: DESPACHO ACTIVO */}
          {activeTab === 'despacho' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* POR ASIGNAR (Calm Slate) */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col h-full max-h-[800px]">
                <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                  <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    <Search className="text-slate-500" />
                    Por Asignar Unidad
                  </h3>
                  <span className="bg-slate-700 text-white px-3 py-1 rounded-full font-bold text-sm">{sinAsignar.length}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
                  {sinAsignar.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-medium bg-white rounded-lg border border-slate-100">
                      No hay carreras en espera. ¡Excelente trabajo!
                    </div>
                  ) : (
                    sinAsignar.map(c => <CarreraCard key={c.id} carrera={c} />)
                  )}
                </div>
              </div>

              {/* PENDIENTES (Calm Blue) */}
              <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4 shadow-sm flex flex-col h-full max-h-[800px]">
                <div className="flex items-center justify-between mb-4 border-b border-blue-100 pb-2">
                  <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
                    <Clock className="text-blue-500" />
                    Unidad en Camino
                  </h3>
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full font-bold text-sm">{pendientes.length}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
                  {pendientes.length === 0 ? (
                    <div className="text-center py-8 text-blue-400 font-medium bg-white rounded-lg border border-blue-50">
                      No hay unidades en camino.
                    </div>
                  ) : (
                    pendientes.map(c => <CarreraCard key={c.id} carrera={c} />)
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB: HISTORIAL */}
          {activeTab === 'historial' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col h-full">
              
              <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-gray-100">
                <div className="flex flex-col gap-1 min-w-[200px]">
                  <label className="text-sm font-medium text-gray-700">Estado</label>
                  <select 
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="aceptada">Aceptadas</option>
                    <option value="cancelada">Canceladas</option>
                    <option value="perdida">Perdidas</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1 min-w-[200px]">
                  <label className="text-sm font-medium text-gray-700">Fecha</label>
                  <input 
                    type="date" 
                    className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                  />
                </div>
                
                <div className="flex items-end">
                  <Button variant="secondary" onClick={() => { setFiltroEstado('todos'); setFiltroFecha(''); }}>
                    Limpiar Filtros
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {historialFiltrado.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-400 font-medium">No hay registros que coincidan con la búsqueda.</div>
                  ) : (
                    historialFiltrado.map(c => (
                      <div key={c.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-gray-800 truncate max-w-[180px]">{c.cliente.nombre}</span>
                          <EstadoBadge estado={c.estado} />
                        </div>
                        <div className="text-sm text-gray-600 mb-2 truncate">
                          📍 {c.cliente.direccion || 'Sin dirección'}
                        </div>
                        {c.unidad && (
                          <div className="text-sm text-blue-700 bg-blue-50 p-1.5 rounded inline-block w-fit mb-2">
                            🚖 Taxi: {c.unidad.placa}
                          </div>
                        )}
                        <div className="mt-auto text-xs text-gray-400 border-t border-gray-200 pt-2 flex justify-between">
                          <span>Registrada:</span>
                          <span>{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {isNuevaOpen && <NuevaCarreraModal isOpen={isNuevaOpen} onClose={() => setIsNuevaOpen(false)} />}
      {asignarCarrera && <AsignarUnidadModal isOpen={!!asignarCarrera} onClose={() => setAsignarCarrera(null)} carrera={asignarCarrera} />}
    </div>
  );
};
