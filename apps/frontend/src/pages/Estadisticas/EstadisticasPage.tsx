import { useState, useMemo, type ReactNode } from 'react';
import { BarChart3, TrendingUp, Clock, Car, Users, AlertTriangle, Download, Search } from 'lucide-react';
import { useEstadisticas, useRankingUnidades } from '../../features/estadisticas/hooks/useEstadisticas';
import type { EstadisticasResumen } from '../../features/estadisticas/services/estadisticas.service';
import { descargarInforme } from '../../features/reportes/hooks/useReportes';
import { Button } from '../../components/ui/Button';
import { rankBy, scoreUnidad } from '../../core/search/matchers';
import { diaOperativoYMD, fechaCortaOperativa } from '../../core/tiempo';

const pad = (n: number) => String(n).padStart(2, '0');
/** "18:00 y las 19:00" — para usar como "entre las {franja} h". */
const franjaHora = (h: number) => `${pad(h)}:00 y las ${pad((h + 1) % 24)}:00`;
/** 'YYYY-MM-DD' (valor crudo de <input type="date">) -> 'DD/MM/YYYY' para mostrar. */
const formatYMD = (ymd: string) => ymd.split('-').reverse().join('/');

type ModoPdf = 'hoy' | 'dia' | 'rango';
type ModoRanking = 'total' | 'hoy' | 'dia' | 'rango';

const Kpi = ({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color: string }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
    <p className="text-sm text-gray-500 font-medium m-0">{label}</p>
    <h3 className={`text-3xl font-bold m-0 ${color}`}>{value}</h3>
    {sub && <p className="text-[0.75rem] text-gray-400 m-0 mt-0.5">{sub}</p>}
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

  // Ranking de unidades: independiente del resumen general, con su propio buscador y 4 modos
  // EXCLUYENTES, mismo criterio que el selector del PDF (heurística de Nielsen #4: consistencia
  // entre pantallas). "Total acumulado" es el histórico de siempre (desde el día 0 de cada
  // unidad); Hoy/Día específico/Rango cuentan SOLO las carreras de ese período puntual.
  const [modoRanking, setModoRanking] = useState<ModoRanking>('total');
  const [totalHastaRanking, setTotalHastaRanking] = useState(''); // corte opcional del modo "Total"
  const [diaRanking, setDiaRanking] = useState('');
  const [desdeRanking, setDesdeRanking] = useState('');
  const [hastaRanking, setHastaRanking] = useState('');
  const [searchUnidad, setSearchUnidad] = useState('');

  const rankingListo =
    modoRanking === 'dia' ? Boolean(diaRanking)
    : modoRanking === 'rango' ? Boolean(desdeRanking && hastaRanking)
    : true; // 'total' y 'hoy' no dependen de que el usuario elija nada

  // Mientras el modo elegido no tenga todavía la fecha que necesita, no mandamos un filtro a
  // medio llenar: se muestra el total acumulado de siempre y el texto de estado avisa qué falta.
  const { rankingDesde, rankingHasta } = useMemo(() => {
    if (!rankingListo) return { rankingDesde: undefined, rankingHasta: undefined };
    switch (modoRanking) {
      case 'hoy': { const h = diaOperativoYMD(); return { rankingDesde: h, rankingHasta: h }; }
      case 'dia': return { rankingDesde: diaRanking, rankingHasta: diaRanking };
      case 'rango': return { rankingDesde: desdeRanking, rankingHasta: hastaRanking };
      default: return { rankingDesde: undefined, rankingHasta: totalHastaRanking || undefined };
    }
  }, [modoRanking, diaRanking, desdeRanking, hastaRanking, totalHastaRanking, rankingListo]);

  const rankingStatus =
    modoRanking === 'total'
      ? (totalHastaRanking ? `Acumulado hasta el ${formatYMD(totalHastaRanking)}.` : 'Total acumulado de todas las carreras (sin filtro de fecha).')
      : modoRanking === 'hoy'
        ? `Carreras de hoy (${fechaCortaOperativa()}) por unidad.`
        : modoRanking === 'dia'
          ? (diaRanking ? `Carreras del ${formatYMD(diaRanking)} por unidad.` : 'Elegí un día para ver el ranking de esa fecha.')
          : (desdeRanking && hastaRanking ? `Carreras del ${formatYMD(desdeRanking)} al ${formatYMD(hastaRanking)} por unidad.` : 'Elegí las dos fechas del rango.');

  const { data: ranking = [], isLoading: loadingRanking } = useRankingUnidades(rankingDesde, rankingHasta);
  const rankingFiltrado = useMemo(
    () => rankBy(ranking, searchUnidad, scoreUnidad),
    [ranking, searchUnidad]
  );

  // Descarga del informe PDF: 3 modos EXPLÍCITOS y mutuamente excluyentes (no 2 inputs
  // vacíos/llenos de los que hay que "adivinar" qué van a descargar — heurística de Nielsen
  // #6, reconocer en vez de recordar). Cada modo muestra SOLO el/los campo(s) que le
  // corresponden (heurística #8, diseño minimalista: no mostrar controles irrelevantes).
  const [modoPdf, setModoPdf] = useState<ModoPdf>('hoy');
  const [diaPdf, setDiaPdf] = useState('');
  const [desdePdf, setDesdePdf] = useState('');
  const [hastaPdf, setHastaPdf] = useState('');

  const hoyLabel = fechaCortaOperativa();
  const puedeDescargarPdf =
    modoPdf === 'hoy' ? true : modoPdf === 'dia' ? Boolean(diaPdf) : Boolean(desdePdf && hastaPdf);

  // Heurística #1 (visibilidad del estado del sistema): siempre se ve, en texto plano, qué
  // es EXACTAMENTE lo que se va a descargar antes de tocar el botón.
  const statusPdf =
    modoPdf === 'hoy'
      ? `Se descarga el informe de hoy (${hoyLabel}).`
      : modoPdf === 'dia'
        ? (diaPdf ? `Se descarga el informe del ${formatYMD(diaPdf)}.` : 'Elegí un día para descargar su informe.')
        : (desdePdf && hastaPdf ? `Se descarga el informe del ${formatYMD(desdePdf)} al ${formatYMD(hastaPdf)}.` : 'Elegí las dos fechas del rango.');

  const handleDescargarPdf = () => {
    if (modoPdf === 'hoy') descargarInforme();
    else if (modoPdf === 'dia') descargarInforme(diaPdf);
    else descargarInforme(desdePdf, hastaPdf);
  };

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
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="text-blue-600" size={32} />
        <h2 className="text-2xl md:text-[1.75rem] text-gray-800 m-0 font-bold">Estadísticas</h2>
      </div>

      {/* Descarga de informe PDF: selector de 3 modos EXCLUYENTES (tabs), campos condicionales
          por modo (progressive disclosure) y una línea de estado que dice, en criollo, qué se
          va a descargar antes de apretar el botón. Mismo patrón de "barra de filtro" que ya
          usamos en Carreras (heurística de Nielsen #4: consistencia entre pantallas). */}
      <div className="mb-8 flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 text-gray-500 text-sm font-semibold shrink-0">
          <Download size={18} className="text-blue-600" />
          Informe PDF:
        </div>

        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 gap-1 shrink-0">
          {([
            { m: 'hoy' as const, label: 'Hoy' },
            { m: 'dia' as const, label: 'Día específico' },
            { m: 'rango' as const, label: 'Rango de fechas' },
          ]).map(({ m, label }) => (
            <button
              key={m}
              type="button"
              onClick={() => setModoPdf(m)}
              aria-pressed={modoPdf === m}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ease-out ${
                modoPdf === m
                  ? 'bg-blue-600 text-white shadow-md scale-[1.04]'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 scale-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {modoPdf === 'dia' && (
          <label className="flex items-center gap-1.5 text-sm text-gray-600">
            Fecha
            <input
              type="date"
              value={diaPdf}
              onChange={(e) => setDiaPdf(e.target.value)}
              className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        )}

        {modoPdf === 'rango' && (
          <>
            <label className="flex items-center gap-1.5 text-sm text-gray-600">
              Desde
              <input
                type="date"
                value={desdePdf}
                onChange={(e) => setDesdePdf(e.target.value)}
                className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center gap-1.5 text-sm text-gray-600">
              Hasta
              <input
                type="date"
                value={hastaPdf}
                onChange={(e) => setHastaPdf(e.target.value)}
                className="border border-gray-200 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </>
        )}

        <Button
          variant="secondary"
          icon={<Download size={16} />}
          disabled={!puedeDescargarPdf}
          onClick={handleDescargarPdf}
        >
          Descargar PDF
        </Button>

        <span className="text-xs text-gray-500 basis-full md:basis-auto md:ml-auto">{statusPdf}</span>
      </div>

      {t.total === 0 ? (
        <div className="text-center py-[60px] px-5 text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
          <BarChart3 size={64} className="mx-auto mb-5 opacity-40 text-blue-400" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Aún no hay carreras registradas</h3>
          <p className="text-[0.9375rem] max-w-md mx-auto">Las estadísticas se van a ir llenando a medida que se registren carreras en el sistema.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Totales (números, sin gráficos) */}
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
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
                <p className="text-[0.9375rem] text-gray-800 m-0 mb-4">
                  <span className="font-semibold">Hora pico:</span> entre las{' '}
                  <span className="font-bold text-emerald-600">{franjaHora(d.horaPico.hora)} h</span>, con{' '}
                  <span className="font-bold">{d.horaPico.cantidad}</span> carreras.
                </p>
              ) : null}

              <p className="text-[0.8125rem] font-semibold text-gray-500 uppercase tracking-wide m-0 mb-2">Horas más activas</p>
              <ul className="m-0 mb-4 pl-0 list-none flex flex-col gap-1.5">
                {topHoras.map((h) => (
                  <li key={h.hora} className="text-[0.875rem] text-gray-700 flex justify-between gap-2">
                    <span>Entre las {franjaHora(h.hora)} h</span>
                    <span className="font-bold text-gray-800">{h.cantidad} carreras</span>
                  </li>
                ))}
              </ul>

              <p className="text-[0.8125rem] font-semibold text-gray-500 uppercase tracking-wide m-0 mb-2">Dónde se pierden más carreras</p>
              {topPerdidas.length === 0 ? (
                <p className="text-[0.875rem] text-gray-500 m-0">Sin carreras perdidas. ¡Bien ahí! 🎉</p>
              ) : (
                <ul className="m-0 pl-0 list-none flex flex-col gap-1.5">
                  {topPerdidas.map((h) => (
                    <li key={h.hora} className="text-[0.875rem] text-gray-700 flex justify-between gap-2">
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
                <p className="text-[0.9375rem] text-gray-800 m-0 mb-3">
                  <span className="font-semibold">Día más activo:</span>{' '}
                  <span className="font-bold">{diaMasActivo.dia}</span> con{' '}
                  <span className="font-bold">{diaMasActivo.cantidad}</span> carreras.
                </p>
              )}
              <p className="text-[0.9375rem] text-gray-800 m-0">
                <span className="font-semibold">Promedio:</span> <span className="font-bold">{promedioDia}</span> carreras por día (últimos {d.porDia.length} días con actividad).
              </p>
            </Panel>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Ranking de unidades: todas, acumulado desde su primera carrera, filtrable por fecha y buscador */}
            <Panel title="Ranking de unidades" icon={<Car size={18} className="text-blue-600" />}>
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 mb-2 sm:overflow-x-auto">
                {/* La caja de búsqueda achica: acá casi siempre se tipea solo un Nº de unidad
                    (heurística de Nielsen #8, diseño minimalista — no reservar ancho que no se
                    usa). Se sacaron las etiquetas "Desde"/"Hasta"/"Fecha" en texto: quedan como
                    `title` (tooltip) + `aria-label` (accesibilidad) y el `rankingStatus` de abajo
                    ya dice en criollo qué es cada fecha. De `sm` para arriba entra TODO en una
                    sola fila (con scroll horizontal como red de seguridad); en un celular
                    angosto (<640px) se permite que envuelva a una segunda línea en vez de
                    esconder los controles detrás de un scroll horizontal no evidente. */}
                <div className="relative w-16 shrink-0">
                  <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchUnidad}
                    onChange={(e) => setSearchUnidad(e.target.value)}
                    placeholder="Nº..."
                    title="Buscar por número de unidad o chofer"
                    className="w-full pl-6 pr-1 py-1.5 text-[0.75rem] border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 4 modos EXCLUYENTES (mismo patrón que el selector del PDF): "Total" es el
                    histórico de siempre; Hoy/Día/Rango cuentan solo el período puntual. */}
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 gap-0.5 shrink-0">
                  {([
                    { m: 'total' as const, label: 'Total' },
                    { m: 'hoy' as const, label: 'Hoy' },
                    { m: 'dia' as const, label: 'Día' },
                    { m: 'rango' as const, label: 'Rango' },
                  ]).map(({ m, label }) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModoRanking(m)}
                      aria-pressed={modoRanking === m}
                      className={`px-2 py-1 text-[0.6875rem] font-semibold rounded-md whitespace-nowrap transition-all duration-200 ease-out ${
                        modoRanking === m
                          ? 'bg-blue-600 text-white shadow-md scale-[1.04]'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 scale-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Campo(s) condicionales por modo (progressive disclosure, heurística #8). */}
                {modoRanking === 'total' && (
                  <input
                    type="date"
                    value={totalHastaRanking}
                    onChange={(e) => setTotalHastaRanking(e.target.value)}
                    title="Corte opcional del acumulado (vacío = hasta hoy)"
                    aria-label="Corte opcional del acumulado"
                    className="w-30 shrink-0 border border-gray-200 rounded-md px-1.5 py-1 text-[0.6875rem] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
                {modoRanking === 'dia' && (
                  <input
                    type="date"
                    value={diaRanking}
                    onChange={(e) => setDiaRanking(e.target.value)}
                    title="Día a consultar"
                    aria-label="Día a consultar"
                    className="w-30 shrink-0 border border-gray-200 rounded-md px-1.5 py-1 text-[0.6875rem] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
                {modoRanking === 'rango' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="date"
                      value={desdeRanking}
                      onChange={(e) => setDesdeRanking(e.target.value)}
                      title="Desde"
                      aria-label="Desde"
                      className="w-30 border border-gray-200 rounded-md px-1.5 py-1 text-[0.6875rem] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-400 text-[0.75rem]" aria-hidden="true">→</span>
                    <input
                      type="date"
                      value={hastaRanking}
                      onChange={(e) => setHastaRanking(e.target.value)}
                      title="Hasta"
                      aria-label="Hasta"
                      className="w-30 border border-gray-200 rounded-md px-1.5 py-1 text-[0.6875rem] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              {/* Heurística #1 (visibilidad del estado del sistema): siempre se ve, en texto
                  plano, qué período representan los números de la lista de abajo. */}
              <p className="text-[0.6875rem] text-gray-400 m-0 mb-3">{rankingStatus}</p>
              {loadingRanking ? (
                <p className="text-[0.8125rem] text-gray-400 m-0">Cargando...</p>
              ) : (
                <ol className="m-0 pl-0 list-none flex flex-col gap-2 max-h-80 overflow-y-auto">
                  {rankingFiltrado.map((u, i) => (
                    <li key={u.unidadId} className="flex items-baseline justify-between gap-2 text-[0.875rem]">
                      <span className="truncate text-gray-700">
                        <span className="font-bold text-gray-400 mr-2">{i + 1}.</span>
                        Unidad Nº {u.numeroUnidad || 'S/N'} · {u.choferNombre || 'Sin chofer'}
                      </span>
                      <span className="font-bold text-gray-800 shrink-0">{u.cantidad} carreras</span>
                    </li>
                  ))}
                  {rankingFiltrado.length === 0 && (
                    <p className="text-[0.8125rem] text-gray-400 m-0">Sin resultados.</p>
                  )}
                </ol>
              )}
            </Panel>

            {/* Clientes que más piden */}
            <Panel title="Clientes que más piden" icon={<Users size={18} className="text-blue-600" />}>
              <ol className="m-0 pl-0 list-none flex flex-col gap-2">
                {d.topClientes.map((c, i) => (
                  <li key={c.clienteId} className="flex items-baseline justify-between gap-2 text-[0.875rem]">
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
              <p className="text-[0.875rem] text-orange-800 m-0">
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
