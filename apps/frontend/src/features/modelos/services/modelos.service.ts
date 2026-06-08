import api from '../../../core/api/axios';
import { Marca } from '../../marcas/services/marcas.service';

export interface Modelo {
  id: number;
  nombre: string;
  marcaId: number;
  marca: Marca;
}

export interface CreateModeloDto {
  nombre: string;
  marcaId: number;
}

export const modelosService = {
  getAll: async (): Promise<Modelo[]> => {
    const { data } = await api.get('/modelos');
    return data;
  },
  
  create: async (modelo: CreateModeloDto): Promise<Modelo> => {
    const { data } = await api.post('/modelos', modelo);
    return data;
  },

  update: async (id: number, modelo: Partial<CreateModeloDto>): Promise<Modelo> => {
    const { data } = await api.patch(`/modelos/${id}`, modelo);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/modelos/${id}`);
  }
};
