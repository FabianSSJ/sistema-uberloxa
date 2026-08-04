import { useState, useMemo, useEffect } from 'react';
import { useCarrerasHistorial } from '../../features/carreras/hooks/useCarreras';
import { useUnidades } from '../../features/unidades/hooks/useUnidades';
import { rankBy, scoreUnidad, scoreUsuario } from '../../core/search/matchers';
import { colorOperador, colorUnidad } from '../../core/operadores/colores';
import { fechaCorta, inicioDiaEcuadorDesdeYMD, finDiaEcuadorDesdeYMD } from '../../core/tiempo';
import { Car, CheckCircle2, XCircle, AlertTriangle, TrendingUp, Calendar, Users, Search } from 'lucide-react';

export const AdminDashboard = () => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const [dd, mm, yyyy] = fechaCorta(new Date()).split('/');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [searchUnidad, setSearchUnidad] = useState('');
  const [searchCharlie, setSearchCharlie] = useState('');

  // El día seleccionado se filtra en el SERVER (índice createdAt) — nunca se trae más
  // que las carreras de ese único día, sin importar cuánto historial acumule el sistema.
  const rangoDia = useMemo(
    () => ({ desde: inicioDiaEcuadorDesdeYMD(selectedDate).toISOString(), hasta: finDiaEcuadorDesdeYMD(selectedDate).toISOString() }),
    [selectedDate]
  );
  const { data, isLoading: loadingRides, fetchNextPage, hasNextPage, isFetchingNextPage } = useCarrerasHistorial({ ...rangoDia, take: 100 });

  // El día puede tener más de una página (tope de 100 por página en el server, DoS-safe):
  // drenamos automáticamente hasta traer el día completo, sin truncar ni pedir un take gigante.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allRides = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const { data: unidades = [], isLoading: loadingUnidades } = useUnidades();

  // Cálculos pesados memoizados: solo recalculan si cambian datos (ya vienen filtrados del server).
  const { statsList, charlieStatsList, globalStats } = useMemo(() => {
    const dayRides = allRides;

    // Agrupar por unidad
    const statsPorUnidad: Record<number, any> = {};
    unidades.forEach((u: any) => {
      statsPorUnidad[u.id] = { unidad: u, completadas: 0, canceladas: 0, perdidas: 0, total: 0 };
    });
    dayRides.forEach((ride: any) => {
      const uid = ride.unidadId || 0;
      if (!statsPorUnidad[uid]) return; // ignorar carreras sin unidad en esta tabla
      statsPorUnidad[uid].total += 1;
      if (ride.estado === 'completada') statsPorUnidad[uid].completadas += 1;
      else if (ride.estado === 'cancelada') statsPorUnidad[uid].canceladas += 1;
      else if (ride.estado === 'perdida') statsPorUnidad[uid].perdidas += 1;
    });
    const statsList = Object.values(statsPorUnidad).sort((a: any, b: any) => b.total - a.total);

    // Agrupar por Charlie (creadoPor)
    const statsPorCharlie: Record<number, any> = {};
    dayRides.forEach((ride: any) => {
      const charlieId = ride.creadoPor?.id || 0;
      if (!statsPorCharlie[charlieId]) {
        statsPorCharlie[charlieId] = { charlie: ride.creadoPor || { id: 0, nombre: 'Desconocido', rol: 'N/A' }, completadas: 0, canceladas: 0, perdidas: 0, total: 0 };
      }
      statsPorCharlie[charlieId].total += 1;
      if (ride.estado === 'completada') statsPorCharlie[charlieId].completadas += 1;
      else if (ride.estado === 'cancelada') statsPorCharlie[charlieId].canceladas += 1;
      else if (ride.estado === 'perdida') statsPorCharlie[charlieId].perdidas += 1;
    });
    const charlieStatsList = Object.values(statsPorCharlie).sort((a: any, b: any) => b.total - a.total);

    const globalStats = {
      total: dayRides.length,
      completadas: dayRides.filter((r: any) => r.estado === 'completada').length,
      canceladas: dayRides.filter((r: any) => r.estado === 'cancelada').length,
      perdidas: dayRides.filter((r: any) => r.estado === 'perdida').length,
    };

    return { statsList, charlieStatsList, globalStats };
  }, [allRides, unidades]);

  const statsListFiltrada = useMemo(
    () => rankBy(statsList, searchUnidad, (s: any, q) => scoreUnidad(s.unidad, q)),
    [statsList, searchUnidad]
  );

  const charlieStatsListFiltrada = useMemo(
    () => rankBy(charlieStatsList, searchCharlie, (s: any, q) => scoreUsuario(s.charlie, q)),
    [charlieStatsList, searchCharlie]
  );

  if (loadingRides || loadingUnidades) return <div>Cargando reporte...</div>;

  return (
    <div className="animate-[fadeIn_0.5s_ease-in]">
      <div className="mb-[30px] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-[1.75rem] text-gray-800 font-bold mb-2">Reporte Operativo</h2>
          <p className="text-gray-600">Resumen de carreras para la jornada seleccionada.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
          <Calendar size={20} className="text-blue-500 ml-2" />
          <label className="text-sm font-bold text-gray-600 hidden sm:block">Fecha:</label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-none bg-transparent text-gray-800 font-bold focus:ring-0 cursor-pointer outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5 mb-10">
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Total del Día</p>
            <h3 className="text-3xl font-bold text-gray-800">{globalStats.total}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <TrendingUp size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Completadas</p>
            <h3 className="text-3xl font-bold text-green-600">{globalStats.completadas}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <CheckCircle2 size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Perdidas</p>
            <h3 className="text-3xl font-bold text-orange-600">{globalStats.perdidas}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <AlertTriangle size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Canceladas</p>
            <h3 className="text-3xl font-bold text-red-600">{globalStats.canceladas}</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <XCircle size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-bold text-gray-800">
            Desempeño por Unidad <span className="text-sm font-normal text-gray-400">({statsListFiltrada.length})</span>
          </h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchUnidad}
              onChange={(e) => setSearchUnidad(e.target.value)}
              placeholder="Buscar nº, placa, chofer, teléfono, vehículo, modelo..."
              className="pl-9 pr-3 py-2 w-full sm:w-64 text-sm bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
        <div className="overflow-auto max-h-105">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white sticky top-0 z-10 shadow-[inset_0_-1px_0_0_#e5e7eb]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Unidad / Chofer</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Generadas</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-green-600 uppercase tracking-wider">Completadas</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-orange-600 uppercase tracking-wider">Perdidas</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-red-600 uppercase tracking-wider">Canceladas</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {statsListFiltrada.map((stat: any) => (
                <tr key={stat.unidad.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div style={colorUnidad(stat.unidad).badge} className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center">
                        <Car size={20} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">
                          {stat.unidad.id === 0 ? 'Sin Asignar' : `Nº ${stat.unidad.numeroUnidad || 'S/N'} (${stat.unidad.placa})`}
                        </div>
                        <div className="text-sm text-gray-500">{stat.unidad.choferNombre}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-lg font-bold text-gray-800">{stat.total}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {stat.completadas}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      {stat.perdidas}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      {stat.canceladas}
                    </span>
                  </td>
                </tr>
              ))}
              {statsListFiltrada.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No se encontraron unidades para "{searchUnidad}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            Actividad por Operador (Charlie) <span className="text-sm font-normal text-gray-400">({charlieStatsListFiltrada.length})</span>
          </h3>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchCharlie}
              onChange={(e) => setSearchCharlie(e.target.value)}
              placeholder="Buscar operador..."
              className="pl-9 pr-3 py-2 w-full sm:w-64 text-sm bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>
        <div className="overflow-auto max-h-105">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white sticky top-0 z-10 shadow-[inset_0_-1px_0_0_#e5e7eb]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Operador</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Generadas</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-green-600 uppercase tracking-wider">Completadas</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-orange-600 uppercase tracking-wider">Perdidas</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-red-600 uppercase tracking-wider">Canceladas</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {charlieStatsListFiltrada.map((stat: any) => (
                <tr key={stat.charlie.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div style={colorOperador(stat.charlie).badge} className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center">
                        <Users size={20} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">
                          {stat.charlie.nombre}
                        </div>
                        <div className="text-sm text-gray-500">{stat.charlie.rol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-lg font-bold text-gray-800">{stat.total}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {stat.completadas}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      {stat.perdidas}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      {stat.canceladas}
                    </span>
                  </td>
                </tr>
              ))}
              {charlieStatsListFiltrada.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {searchCharlie
                      ? `No se encontraron operadores para "${searchCharlie}".`
                      : 'No hay actividad de operadores registrada en esta fecha.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
