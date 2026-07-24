import api from '../../../core/api/axios';

export interface EstadisticasResumen {
  totales: { total: number; completadas: number; canceladas: number; perdidas: number; enCurso: number };
  porDia: Array<{ dia: string; cantidad: number }>;
  porHora: Array<{ hora: number; cantidad: number }>;
  perdidasPorHora: Array<{ hora: number; cantidad: number }>;
  horaPico: { hora: number; cantidad: number } | null;
  topClientes: Array<{ clienteId: number; codigo: number | null; nombre: string; cantidad: number }>;
}

export interface RankingUnidad {
  unidadId: number;
  numeroUnidad: string | null;
  choferNombre: string | null;
  cantidad: number;
}

export const estadisticasService = {
  getResumen: async (): Promise<EstadisticasResumen> => {
    const { data } = await api.get('/estadisticas/resumen');
    return data;
  },

  // Ranking de TODAS las unidades. Sin `desde`: acumulado desde el día 0 de cada unidad hasta
  // `hasta` (o hoy si se omite). Con `desde`: ventana acotada [desde, hasta] (Hoy/Día/Rango).
  getRankingUnidades: async (desde?: string, hasta?: string): Promise<RankingUnidad[]> => {
    const params: Record<string, string> = {};
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;
    const { data } = await api.get('/estadisticas/ranking-unidades', { params });
    return data;
  },
};
