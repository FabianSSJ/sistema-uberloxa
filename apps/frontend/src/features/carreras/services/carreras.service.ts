import api from '../../../core/api/axios';
import { Cliente } from '../../clientes/services/clientes.service';
import { Unidad } from '../../unidades/services/unidades.service';

export interface Carrera {
  id: number;
  clienteId: number;
  cliente: Cliente;
  unidadId?: number;
  unidad?: Unidad;
  estado: string;
  notas?: string;
  createdAt: string;
  fechaFin?: string;
}

export interface CreateCarreraDto {
  clienteId: number;
  unidadId?: number;
  notas?: string;
}

export interface HistorialParams {
  desde?: string; // ISO — límite inferior inclusivo
  hasta?: string; // ISO — límite superior exclusivo
  cursor?: number; // id de la última carrera cargada (keyset pagination)
  take?: number;
}

export interface HistorialPage {
  data: Carrera[];
  nextCursor: number | null;
}

export const carrerasService = {
  // Historial paginado (keyset) con filtros de fecha opcionales — usado en la página Carreras.
  getHistorial: async (params: HistorialParams = {}): Promise<HistorialPage> => {
    const response = await api.get('/carreras', { params });
    return response.data;
  },

  // Panel de despacho: carreras de hoy + en proceso, ya resueltas por el server (sin paginar, es un set chico).
  getPanel: async (): Promise<Carrera[]> => {
    const response = await api.get('/carreras/panel');
    return response.data;
  },

  getRecent: async (): Promise<Carrera[]> => {
    const response = await api.get('/carreras/recent');
    return response.data;
  },

  create: async (data: CreateCarreraDto): Promise<Carrera> => {
    const response = await api.post('/carreras', data);
    return response.data;
  },

  completar: async (id: number, unidadId?: number): Promise<Carrera> => {
    const response = await api.patch(`/carreras/${id}/completar`, { unidadId });
    return response.data;
  },

  cancelar: async (id: number): Promise<Carrera> => {
    const response = await api.patch(`/carreras/${id}/cancelar`);
    return response.data;
  },

  perder: async (id: number): Promise<Carrera> => {
    const response = await api.patch(`/carreras/${id}/perder`);
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    const response = await api.delete(`/carreras/${id}`);
    return response.data;
  }
};
