import { useMemo, useState } from 'react';
import { Clock, Plus, MapPin, CheckCircle2, Search, Trash2, CalendarDays, X } from 'lucide-react';
import { useCarrerasHistorial, useDeleteCarrera } from '../../features/carreras/hooks/useCarreras';
import { CarreraFormModal } from '../Dashboard/CarreraFormModal';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { CodigoBadge } from '../../components/ui/CodigoBadge';
import { EstadoCarreraBadge } from '../../features/carreras/components/EstadoCarreraBadge';
import { rankBy, scoreCarrera } from '../../core/search/matchers';
import { colorOperador } from '../../core/operadores/colores';
import { hora, fechaCorta, inicioDiaEcuadorDesdeYMD, finDiaEcuadorDesdeYMD } from '../../core/tiempo';
import { useAuth } from '../../features/auth/context/AuthContext';

const hoyYMD = (): string => {
  const [dd, mm, yyyy] = fechaCorta(new Date()).split('/');
  return `${yyyy}-${mm}-${dd}`;
};

export const CarrerasPage = () => {
  const { user } = useAuth();
  const [desdeYMD, setDesdeYMD] = useState('');
  const [hastaYMD, setHastaYMD] = useState('');

  // "Hoy" es un atajo del mismo filtro de rango (desde = hasta = hoy), no un caso especial.
  const filtroActivo = Boolean(desdeYMD || hastaYMD);
  const esHoyActivo = desdeYMD === hoyYMD() && hastaYMD === hoyYMD();

  const filtros = useMemo(() => {
    if (!filtroActivo) return {};
    const d = desdeYMD || hastaYMD;
    const h = hastaYMD || desdeYMD;
    return { desde: inicioDiaEcuadorDesdeYMD(d).toISOString(), hasta: finDiaEcuadorDesdeYMD(h).toISOString() };
  }, [desdeYMD, hastaYMD, filtroActivo]);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useCarrerasHistorial(filtros);
  const carreras = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

  const deleteCarreraMutation = useDeleteCarrera();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [careerToDelete, setCareerToDelete] = useState<number | null>(null);

  // Hora de Ecuador (fuente única en core/tiempo).
  const formatTime = (isoString: string) => { try { return hora(isoString); } catch { return ''; } };
  const formatDate = (isoString: string) => { try { return fechaCorta(isoString); } catch { return ''; } };

  const filteredCarreras = rankBy(carreras, searchQuery, scoreCarrera);

  return (
    <div className="animate-[fadeIn_0.5s_ease-in]">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h2 className="text-2xl md:text-[1.75rem] text-gray-800 m-0 font-bold flex items-center gap-3">
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
          placeholder="Buscar por cliente, código, placa, chofer, dirección, operador, Nº..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
        />
      </div>

      {/* Filtros de fecha: Hoy es un atajo del mismo rango, no un modo aparte */}
      <div className="mb-6 flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500 text-sm font-semibold shrink-0">
          <CalendarDays size={18} className="text-green-600" />
          Filtrar por fecha:
        </div>
        <button
          onClick={() => { const h = hoyYMD(); setDesdeYMD(h); setHastaYMD(h); }}
          className={`text-sm font-bold px-3 py-1.5 rounded-md transition-colors ${esHoyActivo ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
        >
          Hoy
        </button>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          Desde
          <input
            type="date"
            value={desdeYMD}
            onChange={(e) => setDesdeYMD(e.target.value)}
            className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          Hasta
          <input
            type="date"
            value={hastaYMD}
            onChange={(e) => setHastaYMD(e.target.value)}
            className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </label>
        {filtroActivo && (
          <button
            onClick={() => { setDesdeYMD(''); setHastaYMD(''); }}
            className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-700 ml-auto"
          >
            <X size={14} /> Limpiar
          </button>
        )}
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
          <p className="text-[1.125rem]">No se encontraron carreras registradas.</p>
        </div>
      ) : filteredCarreras.length === 0 ? (
        <div className="text-center py-[60px] px-5 text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
          <Search size={64} className="mx-auto mb-5 opacity-30 text-gray-500" />
          <p className="text-[1.125rem]">No se encontraron resultados para "{searchQuery}".</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCarreras.map((carrera: any) => {
            const op = colorOperador(carrera.creadoPor);
            return (
            <div
              key={carrera.id}
              style={op.borderLeft}
              className="bg-white rounded-xl p-5 border-l-4 border-y-gray-200 border-r-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:justify-between md:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                {/* Unidad */}
                <div className="flex items-center gap-2 mb-2">
                  <span style={op.textColor} className="px-2 py-0.5 bg-gray-100 text-[0.6875rem] font-bold rounded-md shrink-0">
                    #{carrera.numeroDiario || carrera.id}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.625rem] font-semibold text-gray-400 uppercase tracking-wide m-0 leading-none">Unidad</p>
                    <h3 style={op.textColor} className="text-[0.8125rem] font-bold m-0 truncate">
                      {carrera.unidad
                        ? `Nº ${carrera.unidad.numeroUnidad || 'S/N'} · ${carrera.unidad.placa} · ${carrera.unidad.choferNombre}`
                        : 'Sin unidad asignada'}
                    </h3>
                  </div>
                </div>

                {/* Cliente */}
                <div className="mb-1.5">
                  <p className="text-[0.625rem] font-semibold text-gray-400 uppercase tracking-wide m-0">Cliente</p>
                  <div className="flex items-center gap-1.5 min-w-0">
                    {carrera.cliente.codigo != null && (
                      <CodigoBadge codigo={carrera.cliente.codigo} className="shrink-0" />
                    )}
                    <span className="text-[0.8125rem] font-bold text-gray-800 truncate">{carrera.cliente.nombre}</span>
                    {carrera.esEncomienda && (
                      <span className="px-2 py-0.5 text-[0.6875rem] font-extrabold bg-amber-100 text-amber-800 rounded border border-amber-300 shrink-0">
                        ENCOMIENDA
                      </span>
                    )}
                  </div>
                </div>

                {/* Creador */}
                <div className="mb-1.5">
                  <p className="text-[0.625rem] font-semibold text-gray-400 uppercase tracking-wide m-0">Operador</p>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span style={op.badge} className="text-[0.75rem] font-bold px-2 py-0.5 rounded truncate">
                      {carrera.creadoPor ? carrera.creadoPor.nombre : 'Sistema'}
                    </span>
                  </div>
                </div>

                {/* Dirección */}
                <p className="text-[0.6875rem] text-gray-500 flex items-start gap-1 m-0">
                  <span className="shrink-0">📍</span>
                  <span className="truncate">{carrera.cliente.direccion || 'Sin dirección'} · {carrera.cliente.sector?.nombre || 'Sin sector'}</span>
                </p>

                {carrera.notas && (
                  <div className="text-[0.6875rem] text-gray-500 bg-gray-50 italic p-2 rounded mt-2">
                    📝 {carrera.notas}
                  </div>
                )}

                {carrera.fechaFin && (
                  <div className="text-green-600 text-[0.6875rem] mt-2 font-medium flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Finalizado: {formatDate(carrera.fechaFin)} a las {formatTime(carrera.fechaFin)}
                  </div>
                )}
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                <div className="text-right text-[0.6875rem] text-gray-500">
                  <div className="font-medium">{formatDate(carrera.createdAt)}</div>
                  <div className="text-amber-600 font-bold mt-0.5 text-[0.8125rem]">{formatTime(carrera.createdAt)}</div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end gap-2">
                  <EstadoCarreraBadge estado={carrera.estado} />

                  {user?.rol === 'SUPERADMIN' && (
                    <button 
                      onClick={() => setCareerToDelete(carrera.id)}
                      className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                      title="Eliminar Carrera Permanentemente"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {hasNextPage && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            {isFetchingNextPage ? 'Cargando...' : 'Cargar más'}
          </Button>
        </div>
      )}

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
