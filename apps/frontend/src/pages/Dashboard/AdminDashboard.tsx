import { useState } from 'react';
import { useCarreras } from '../../features/carreras/hooks/useCarreras';
import { useUnidades } from '../../features/unidades/hooks/useUnidades';
import { Car, CheckCircle2, XCircle, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';

export const AdminDashboard = () => {
  const { data: allRides = [], isLoading: loadingRides } = useCarreras();
  const { data: unidades = [], isLoading: loadingUnidades } = useUnidades();

  const getLocalYYYYMMDD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getLocalYYYYMMDD(new Date()));

  if (loadingRides || loadingUnidades) return <div>Cargando reporte...</div>;

  // Revertido a validación local como se solicitó
  const selectedDateObj = new Date(selectedDate + "T00:00:00");
  const selectedDateString = selectedDateObj.toDateString();

  const dayRides = allRides.filter((r: any) => new Date(r.createdAt).toDateString() === selectedDateString);

  // Agrupar por unidad
  const statsPorUnidad: Record<number, any> = {};

  unidades.forEach((u: any) => {
    statsPorUnidad[u.id] = {
      unidad: u,
      completadas: 0,
      canceladas: 0,
      perdidas: 0,
      total: 0
    };
  });

  // También agrupamos las "Sin unidad"
  statsPorUnidad[0] = {
    unidad: { placa: 'Sin Asignar', choferNombre: 'N/A' },
    completadas: 0,
    canceladas: 0,
    perdidas: 0,
    total: 0
  };

  dayRides.forEach((ride: any) => {
    const uid = ride.unidadId || 0;
    if (!statsPorUnidad[uid]) return; // Por si acaso

    statsPorUnidad[uid].total += 1;
    if (ride.estado === 'completada') statsPorUnidad[uid].completadas += 1;
    if (ride.estado === 'cancelada') statsPorUnidad[uid].canceladas += 1;
    if (ride.estado === 'perdida') statsPorUnidad[uid].perdidas += 1;
  });

  // Filtrar unidades que no hicieron nada si quieres que solo salgan las que trabajaron, 
  // o mostrar todas. Mostraremos todas ordenadas por las que tienen más carreras
  const statsList = Object.values(statsPorUnidad).sort((a: any, b: any) => b.total - a.total);

  const globalStats = {
    total: dayRides.length,
    completadas: dayRides.filter((r: any) => r.estado === 'completada').length,
    canceladas: dayRides.filter((r: any) => r.estado === 'cancelada').length,
    perdidas: dayRides.filter((r: any) => r.estado === 'perdida').length,
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease-in]">
      <div className="mb-[30px] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-[28px] text-gray-800 font-bold mb-2">Reporte Operativo</h2>
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
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Desempeño por Unidad</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Unidad / Chofer</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Generadas</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-green-600 uppercase tracking-wider">Completadas</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-orange-600 uppercase tracking-wider">Perdidas</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-red-600 uppercase tracking-wider">Canceladas</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {statsList.map((stat: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
