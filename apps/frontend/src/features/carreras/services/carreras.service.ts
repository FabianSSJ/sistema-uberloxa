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

export const carrerasService = {
  getAll: async (): Promise<Carrera[]> => {
    const response = await api.get('/carreras');
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
