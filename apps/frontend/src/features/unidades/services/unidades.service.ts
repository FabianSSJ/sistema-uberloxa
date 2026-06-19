import api from '../../../core/api/axios';
import { Modelo } from '../../modelos/services/modelos.service';

export interface Unidad {
  id: number;
  placa: string;
  vehiculo?: string;
  numeroUnidad?: string;
  modeloId: number;
  modelo: Modelo;
  color: string;
  anio: number;
  choferNombre: string;
  choferTelefono: string | null;
}

export interface CreateUnidadDto {
  numeroUnidad?: string;
  placa: string;
  vehiculo?: string;
  modeloId?: number;
  color?: string;
  anio?: number;
  choferNombre: string;
  choferTelefono?: string;
}

export const unidadesService = {
  getAll: async (): Promise<Unidad[]> => {
    const { data } = await api.get('/unidades');
    return data;
  },
  
  create: async (unidad: CreateUnidadDto): Promise<Unidad> => {
    const { data } = await api.post('/unidades', unidad);
    return data;
  },

  update: async (id: number, unidad: Partial<CreateUnidadDto>): Promise<Unidad> => {
    const { data } = await api.patch(`/unidades/${id}`, unidad);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/unidades/${id}`);
  }
};
