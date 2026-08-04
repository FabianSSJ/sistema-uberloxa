import { useState } from 'react';
import { Car, Power, Coffee, LogOut, PlayCircle, GripVertical } from 'lucide-react';
import { useColaDespacho } from '../hooks/useColaDespacho';
import { useCambiarEstadoUnidad } from '../hooks/useUnidades';
import { EstadoUnidadBadge, ESTADO_UNIDAD_STYLES } from './EstadoUnidadBadge';
import { colorUnidad } from '../../../core/operadores/colores';
import { scoreUnidad } from '../../../core/search/matchers';
import type { EstadoUnidad, Unidad } from '../services/unidades.service';

/** Filtra preservando el ORDEN original (no reordena por relevancia: la cola es FIFO). */
const filtrar = (lista: Unidad[], q: string): Unidad[] =>
  q.trim() ? lista.filter((u) => scoreUnidad(u, q) > 0) : lista;

interface AsignacionPanelProps {
  /** búsqueda compartida con el resto de la página */
  searchTerm: string;
}

/**
 * Panel de ASIGNACIÓN: arrastrás unidades entre "Disponibles para activar" y la "Cola de activas".
 * La cola es FIFO con posición fija (ver useColaDespacho / backend cambiarEstado).
 * Reutilizable; solo depende del hook de cola y de la mutación de estado.
 */
export const AsignacionPanel = ({ searchTerm }: AsignacionPanelProps) => {
  const { activas, inactivas, carrerasHoy, proximaId } = useColaDespacho();
  const cambiarEstado = useCambiarEstadoUnidad();

  const [dragId, setDragId] = useState<number | null>(null);
  const [hoverZona, setHoverZona] = useState<'activas' | 'inactivas' | null>(null);

  const set = (id: number, estado: EstadoUnidad) => cambiarEstado.mutate({ id, estado });

  const onDrop = (zona: 'activas' | 'inactivas') => {
    if (dragId == null) return;
    // Soltar en "activas" => activar (disponible). Soltar en "inactivas" => sacar de la cola.
    set(dragId, zona === 'activas' ? 'disponible' : 'inactivo');
    setDragId(null);
    setHoverZona(null);
  };

  const activasF = filtrar(activas, searchTerm);
  const inactivasF = filtrar(inactivas, searchTerm);

  const renderMini = (u: Unidad) => (
    <div
      key={u.id}
      draggable
      onDragStart={() => setDragId(u.id)}
      onDragEnd={() => { setDragId(null); setHoverZona(null); }}
      style={colorUnidad(u).borderLeft}
      className="flex items-center gap-2.5 bg-white border border-gray-200 border-l-4 rounded-lg p-2.5 cursor-grab active:cursor-grabbing hover:shadow-sm transition"
    >
      <GripVertical size={16} className="text-gray-300 shrink-0" />
      <div className="flex flex-col items-center shrink-0">
        <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-black text-sm">
          {u.numeroUnidad || 'S/N'}
        </div>
        <span className="text-[0.5625rem] font-bold text-gray-400 uppercase tracking-wide mt-0.5">Unidad</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem] font-bold text-gray-800 truncate m-0">{u.choferNombre || 'Sin chofer'}</p>
        <p className="text-[0.6875rem] text-gray-500 truncate m-0">{u.placa} · {u.vehiculo || 'N/A'}</p>
      </div>
    </div>
  );

  const renderActiva = (u: Unidad) => {
    const estado = (u.estado || 'disponible') as EstadoUnidad;
    const s = ESTADO_UNIDAD_STYLES[estado];
    const esProxima = u.id === proximaId;
    const hoy = carrerasHoy.get(u.id) || 0;
    return (
      <div
        key={u.id}
        draggable
        onDragStart={() => setDragId(u.id)}
        onDragEnd={() => { setDragId(null); setHoverZona(null); }}
        className={`relative flex items-center gap-3 bg-white border rounded-xl p-3 cursor-grab active:cursor-grabbing transition shadow-sm ${
          esProxima ? 'ring-2 ring-emerald-400 border-emerald-300' : 'border-gray-200'
        }`}
      >
        <div className="flex flex-col items-center shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border ${s.avatar}`}>
            {u.numeroUnidad || 'S/N'}
          </div>
          <span className="text-[0.5625rem] font-bold text-gray-400 uppercase tracking-wide mt-1">Unidad</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[0.8125rem] font-bold text-gray-800 truncate m-0">{u.choferNombre || 'Sin chofer'}</p>
            {esProxima && <span className="text-[0.5625rem] font-black uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded">Próxima</span>}
          </div>
          <p className="text-[0.6875rem] text-gray-500 truncate m-0">{u.placa} · {u.vehiculo || 'N/A'}</p>
          <div className="flex items-center gap-2 mt-1">
            <EstadoUnidadBadge unidad={u} />
            <span className="text-[0.625rem] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
              {hoy} {hoy === 1 ? 'carrera' : 'carreras'} hoy
            </span>
          </div>
        </div>

        {/* acciones */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {estado === 'descanso' ? (
            <button onClick={() => set(u.id, 'disponible')} title="Volver a disponible"
              className="flex items-center gap-1 text-[0.6875rem] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition">
              <PlayCircle size={13} /> Volver
            </button>
          ) : (
            <button onClick={() => set(u.id, 'descanso')} disabled={estado === 'ocupado'} title={estado === 'ocupado' ? 'No se puede descansar en carrera' : 'Marcar en descanso'}
              className="flex items-center gap-1 text-[0.6875rem] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded transition disabled:opacity-40 disabled:cursor-not-allowed">
              <Coffee size={13} /> Descanso
            </button>
          )}
          <button onClick={() => set(u.id, 'inactivo')} title="Sacar de la cola"
            className="flex items-center gap-1 text-[0.6875rem] font-bold text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition">
            <LogOut size={13} /> Sacar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Columna: Disponibles para activar */}
      <div
        onDragOver={(e) => { e.preventDefault(); setHoverZona('inactivas'); }}
        onDragLeave={() => setHoverZona(null)}
        onDrop={() => onDrop('inactivas')}
        className={`bg-gray-50 rounded-2xl border-2 border-dashed p-4 min-h-[200px] transition ${
          hoverZona === 'inactivas' ? 'border-red-400 bg-red-50/50' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Power size={18} className="text-gray-500" />
          <h3 className="font-bold text-gray-700 m-0">Disponibles para activar</h3>
          <span className="ml-auto text-xs font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{inactivasF.length}</span>
        </div>
        <div className="flex flex-col gap-2">
          {inactivasF.map(renderMini)}
          {inactivasF.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Arrastrá una unidad acá para sacarla de la cola.</p>
          )}
        </div>
      </div>

      {/* Columna: Cola de activas */}
      <div
        onDragOver={(e) => { e.preventDefault(); setHoverZona('activas'); }}
        onDragLeave={() => setHoverZona(null)}
        onDrop={() => onDrop('activas')}
        className={`bg-emerald-50/30 rounded-2xl border-2 border-dashed p-4 min-h-[200px] transition ${
          hoverZona === 'activas' ? 'border-emerald-400 bg-emerald-50/60' : 'border-emerald-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Car size={18} className="text-emerald-600" />
          <h3 className="font-bold text-gray-700 m-0">Cola de activas <span className="font-normal text-gray-400 text-sm">(orden de llegada)</span></h3>
          <span className="ml-auto text-xs font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">{activasF.length}</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {activasF.map((u) => renderActiva(u))}
          {activasF.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Arrastrá unidades acá para activarlas. La primera en llegar es la primera en despachar.</p>
          )}
        </div>
      </div>
    </div>
  );
};
