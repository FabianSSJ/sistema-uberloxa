import type { ReactNode } from 'react';
import { BarChart3, TrendingUp, Clock, Car, Users, AlertTriangle, Download, Send, MessageCircle } from 'lucide-react';
import { useEstadisticas } from '../../features/estadisticas/hooks/useEstadisticas';
import type { EstadisticasResumen } from '../../features/estadisticas/services/estadisticas.service';
import { useEnviarReporte, useEstadoWhatsapp, descargarInformeHoy } from '../../features/reportes/hooks/useReportes';
import { Button } from '../../components/ui/Button';

const pad = (n: number) => String(n).padStart(2, '0');
/** "18:00 y las 19:00" — para usar como "entre las {franja} h". */
const franjaHora = (h: number) => `${pad(h)}:00 y las ${pad((h + 1) % 24)}:00`;

const Kpi = ({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
    <p className="text-sm text-gray-500 font-medium m-0">{label}</p>
    <h3 className={`text-3xl font-bold m-0 ${color}`}>{value}</h3>
    {sub && <p className="text-[12px] text-gray-400 m-0 mt-0.5">{sub}</p>}
  </div>
);

const Panel = ({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) => (
  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-4">{icon}{title}</h3>
    {children}
  </div>
);

export const EstadisticasPage = () => {
  const { data, isLoading, isError } = useEstadisticas();
  const enviar = useEnviarReporte();
  const { data: wa } = useEstadoWhatsapp();

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;
  }
  if (isError || !data) {
    return <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">No se pudieron cargar las estadísticas.</div>;
  }

  const d: EstadisticasResumen = data;
  const t = d.totales;
  const pct = (n: number) => (t.total > 0 ? Math.round((n / t.total) * 100) : 0);

  const topHoras = [...d.porHora].filter((x) => x.cantidad > 0).sort((a, b) => b.cantidad - a.cantidad).slice(0, 3);
  const topPerdidas = [...d.perdidasPorHora].filter((x) => x.cantidad > 0).sort((a, b) => b.cantidad - a.cantidad).slice(0, 3);
  const diaMasActivo = d.porDia.reduce((m, x) => (x.cantidad > (m?.cantidad ?? -1) ? x : m), null as { dia: string; cantidad: number } | null);
  const sumaDias = d.porDia.reduce((s, x) => s + x.cantidad, 0);
  const promedioDia = d.porDia.length ? Math.round(sumaDias / d.porDia.length) : 0;

  return (
    <div className="animate-[fadeIn_0.5s_ease-in]">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-blue-600" size={32} />
          <h2 className="text-2xl md:text-[28px] text-gray-800 m-0 font-bold">Estadísticas</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${wa?.conectado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
            title="Estado del emisor de WhatsApp"
          >
            <MessageCircle size={13} /> WhatsApp {wa?.conectado ? 'conectado' : 'sin conectar'}
          </span>
          <Button variant="secondary" icon={<Download size={16} />} onClick={descargarInformeHoy}>
            Informe de hoy
          </Button>
          <Button icon={<Send size={16} />} isLoading={enviar.isPending} onClick={() => enviar.mutate()}>
            Enviar ahora
          </Button>
        </div>
      </div>

      {t.total === 0 ? (
        <div className="text-center py-[60px] px-5 text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
          <BarChart3 size={64} className="mx-auto mb-5 opacity-40 text-blue-400" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Aún no hay carreras registradas</h3>
          <p className="text-[15px] max-w-md mx-auto">Las estadísticas se van a ir llenando a medida que se registren carreras en el sistema.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Totales (números, sin gráficos) */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <Kpi label="Carreras totales" value={t.total} color="text-gray-800" />
            <Kpi label="Completadas" value={t.completadas} sub={`${pct(t.completadas)}% del total`} color="text-green-600" />
            <Kpi label="En curso" value={t.enCurso} color="text-blue-600" />
            <Kpi label="Canceladas" value={t.canceladas} sub={`${pct(t.canceladas)}% del total`} color="text-red-600" />
            <Kpi label="Perdidas" value={t.perdidas} sub={`${pct(t.perdidas)}% del total`} color="text-orange-600" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Horarios */}
            <Panel title="Horarios" icon={<Clock size={18} className="text-blue-600" />}>
              {d.horaPico ? (
                <p className="text-[15px] text-gray-800 m-0 mb-4">
                  <span className="font-semibold">Hora pico:</span> entre las{' '}
                  <span className="font-bold text-emerald-600">{franjaHora(d.horaPico.hora)} h</span>, con{' '}
                  <span className="font-bold">{d.horaPico.cantidad}</span> carreras.
                </p>
              ) : null}

              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide m-0 mb-2">Horas más activas</p>
              <ul className="m-0 mb-4 pl-0 list-none flex flex-col gap-1.5">
                {topHoras.map((h) => (
                  <li key={h.hora} className="text-[14px] text-gray-700 flex justify-between gap-2">
                    <span>Entre las {franjaHora(h.hora)} h</span>
                    <span className="font-bold text-gray-800">{h.cantidad} carreras</span>
                  </li>
                ))}
              </ul>

              <p className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide m-0 mb-2">Dónde se pierden más carreras</p>
              {topPerdidas.length === 0 ? (
                <p className="text-[14px] text-gray-500 m-0">Sin carreras perdidas. ¡Bien ahí! 🎉</p>
              ) : (
                <ul className="m-0 pl-0 list-none flex flex-col gap-1.5">
                  {topPerdidas.map((h) => (
                    <li key={h.hora} className="text-[14px] text-gray-700 flex justify-between gap-2">
                      <span>Entre las {franjaHora(h.hora)} h</span>
                      <span className="font-bold text-orange-600">{h.cantidad} perdidas</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {/* Actividad por día */}
            <Panel title="Actividad por día" icon={<TrendingUp size={18} className="text-blue-600" />}>
              {diaMasActivo && (
                <p className="text-[15px] text-gray-800 m-0 mb-3">
                  <span className="font-semibold">Día más activo:</span>{' '}
                  <span className="font-bold">{diaMasActivo.dia}</span> con{' '}
                  <span className="font-bold">{diaMasActivo.cantidad}</span> carreras.
                </p>
              )}
              <p className="text-[15px] text-gray-800 m-0">
                <span className="font-semibold">Promedio:</span> <span className="font-bold">{promedioDia}</span> carreras por día (últimos {d.porDia.length} días con actividad).
              </p>
            </Panel>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Ranking de unidades */}
            <Panel title="Ranking de unidades" icon={<Car size={18} className="text-blue-600" />}>
              <ol className="m-0 pl-0 list-none flex flex-col gap-2">
                {d.topUnidades.map((u, i) => (
                  <li key={u.unidadId} className="flex items-baseline justify-between gap-2 text-[14px]">
                    <span className="truncate text-gray-700">
                      <span className="font-bold text-gray-400 mr-2">{i + 1}.</span>
                      Unidad Nº {u.numeroUnidad || 'S/N'} · {u.choferNombre || 'Sin chofer'}
                    </span>
                    <span className="font-bold text-gray-800 shrink-0">{u.cantidad} carreras</span>
                  </li>
                ))}
              </ol>
            </Panel>

            {/* Clientes que más piden */}
            <Panel title="Clientes que más piden" icon={<Users size={18} className="text-blue-600" />}>
              <ol className="m-0 pl-0 list-none flex flex-col gap-2">
                {d.topClientes.map((c, i) => (
                  <li key={c.clienteId} className="flex items-baseline justify-between gap-2 text-[14px]">
                    <span className="truncate text-gray-700">
                      <span className="font-bold text-gray-400 mr-2">{i + 1}.</span>
                      {c.nombre} {c.codigo ? <span className="text-gray-400">(código {c.codigo})</span> : ''}
                    </span>
                    <span className="font-bold text-gray-800 shrink-0">{c.cantidad} carreras</span>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>

          {/* nota de salud operativa */}
          {t.perdidas > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={20} className="text-orange-500 shrink-0 mt-0.5" />
              <p className="text-[14px] text-orange-800 m-0">
                Se perdieron <span className="font-bold">{t.perdidas}</span> carreras ({pct(t.perdidas)}% del total).
                {topPerdidas[0] && <> El peor horario es entre las <span className="font-bold">{franjaHora(topPerdidas[0].hora)} h</span> — conviene tener más unidades activas ahí.</>}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
