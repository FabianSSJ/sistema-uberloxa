import api from '../../../core/api/axios';

export interface Marca {
  id: number;
  nombre: string;
}

export interface CreateMarcaDto {
  nombre: string;
}

export const marcasService = {
  getAll: async (): Promise<Marca[]> => {
    const { data } = await api.get('/marcas');
    return data;
  },
  
  create: async (marca: CreateMarcaDto): Promise<Marca> => {
    const { data } = await api.post('/marcas', marca);
    return data;
  },

  update: async (id: number, marca: CreateMarcaDto): Promise<Marca> => {
    const { data } = await api.patch(`/marcas/${id}`, marca);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/marcas/${id}`);
  }
};
