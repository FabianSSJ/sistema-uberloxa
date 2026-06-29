import api from '../../../core/api/axios';

export interface EstadisticasResumen {
  totales: { total: number; completadas: number; canceladas: number; perdidas: number; enCurso: number };
  porDia: Array<{ dia: string; cantidad: number }>;
  porHora: Array<{ hora: number; cantidad: number }>;
  perdidasPorHora: Array<{ hora: number; cantidad: number }>;
  horaPico: { hora: number; cantidad: number } | null;
  topUnidades: Array<{ unidadId: number; numeroUnidad: string | null; choferNombre: string | null; cantidad: number }>;
  topClientes: Array<{ clienteId: number; codigo: number | null; nombre: string; cantidad: number }>;
}

export const estadisticasService = {
  getResumen: async (): Promise<EstadisticasResumen> => {
    const { data } = await api.get('/estadisticas/resumen');
    return data;
  },
};
