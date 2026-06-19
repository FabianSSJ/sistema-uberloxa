import { useState } from 'react';
import { Clock, Plus, MapPin, CheckCircle2, Search } from 'lucide-react';
import { useCarreras } from '../../features/carreras/hooks/useCarreras';
import { CarreraFormModal } from '../Dashboard/CarreraFormModal';
import { Button } from '../../components/ui/Button';

export const CarrerasPage = () => {
  const { data: carreras = [], isLoading, isError } = useCarreras();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const getTurnoColor = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const hour = date.getHours();
      if (hour >= 7 && hour < 12) return { border: 'border-l-blue-500', icon: 'text-blue-500', text: 'text-blue-700' };
      if (hour >= 12 && hour < 19) return { border: 'border-l-orange-500', icon: 'text-orange-500', text: 'text-orange-700' };
      return { border: 'border-l-gray-800', icon: 'text-gray-800', text: 'text-gray-800' };
    } catch {
      return { border: 'border-l-gray-300', icon: 'text-gray-400', text: 'text-gray-500' };
    }
  };

  const filteredCarreras = carreras.filter((c: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    const idFormatted = String(c.cliente?.id).padStart(2, '0');
    
    const matchUnidad = c.unidad?.numeroUnidad?.toLowerCase().includes(q) || c.unidad?.placa?.toLowerCase().includes(q);
    const matchCliente = idFormatted.includes(q) || c.cliente?.nombre?.toLowerCase().includes(q) || c.cliente?.telefono?.includes(q);
    const matchEstado = c.estado?.toLowerCase().includes(q);
    
    return matchUnidad || matchCliente || matchEstado;
  });

  return (
    <div className="animate-[fadeIn_0.5s_ease-in]">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h2 className="text-2xl md:text-[28px] text-gray-800 m-0 font-bold flex items-center gap-3">
          <Clock className="text-green-600" size={32} />
          Historial de Carreras
        </h2>
        
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={20} />} className="bg-green-600 hover:bg-green-700 text-white">
          Registrar Carrera
        </Button>
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-400" size={20} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por código de cliente (ej. 01), número de unidad, placa, nombre o estado..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
        />
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          Ocurrió un error al cargar el historial de carreras.
        </div>
      ) : carreras.length === 0 ? (
        <div className="text-center py-[60px] px-5 text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
          <Clock size={64} className="mx-auto mb-5 opacity-50 text-green-600" />
          <p className="text-[18px]">No se encontraron carreras registradas.</p>
        </div>
      ) : filteredCarreras.length === 0 ? (
        <div className="text-center py-[60px] px-5 text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
          <Search size={64} className="mx-auto mb-5 opacity-30 text-gray-500" />
          <p className="text-[18px]">No se encontraron resultados para "{searchQuery}".</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCarreras.map((carrera: any) => {
            const turno = getTurnoColor(carrera.createdAt);
            return (
            <div 
              key={carrera.id} 
              className={`bg-white rounded-xl p-5 border-l-4 ${turno.border} border-y-gray-200 border-r-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:justify-between md:items-center gap-4`}
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-2.5 py-1 bg-gray-100 ${turno.text} text-xs font-bold rounded-md`}>
                    #{carrera.id}
                  </span>
                  <h3 className={`text-lg font-bold m-0 ${turno.text}`}>
                    {carrera.unidad ? `Unidad Placa: ${carrera.unidad.placa} (${carrera.unidad.choferNombre})` : 'Sin Unidad Asignada'}
                  </h3>
                </div>
                
                <div className="text-sm font-medium mb-1">
                  <span className="text-gray-500">Cliente: </span>
                  <span className="text-gray-800">{carrera.cliente.nombre}</span>
                </div>
                
                <div className="text-sm flex items-start gap-1 mt-2">
                  <span className="text-gray-400">📍</span>
                  <span className="text-gray-600">{carrera.cliente.direccion || 'Sin dirección'} - Sector: {carrera.cliente.sector?.nombre || 'Sin Sector'}</span>
                </div>

                {carrera.notas && (
                  <div className="text-xs text-gray-500 bg-gray-50 italic p-2 rounded mt-3">
                    📝 Notas: {carrera.notas}
                  </div>
                )}

                {carrera.fechaFin && (
                  <div className="text-green-600 text-xs mt-[8px] font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Finalizado: {formatDate(carrera.fechaFin)} a las {formatTime(carrera.fechaFin)}
                  </div>
                )}
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                <div className="text-right text-sm text-gray-500">
                  <div className="font-medium">{formatDate(carrera.createdAt)}</div>
                  <div className="text-amber-600 font-bold mt-0.5">{formatTime(carrera.createdAt)}</div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end gap-2">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    carrera.estado === 'pendiente' ? 'bg-amber-100 text-amber-800' :
                    carrera.estado === 'asignada' ? 'bg-blue-100 text-blue-800' :
                    carrera.estado === 'completada' ? 'bg-green-100 text-green-800' :
                    carrera.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                    'bg-gray-200 text-gray-800'
                  }`}>
                    {carrera.estado.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {isModalOpen && (
        <CarreraFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
