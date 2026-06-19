import api from '../../../core/api/axios';

export interface Chofer {
  id: number;
  nombre: string;
  telefono?: string;
  activo: boolean;
  createdAt: string;
}

export const choferesService = {
  getAll: async (): Promise<Chofer[]> => {
    const response = await api.get('/choferes');
    return response.data;
  },

  create: async (data: { nombre: string; telefono?: string }): Promise<Chofer> => {
    const response = await api.post('/choferes', data);
    return response.data;
  },

  update: async (id: number, data: { nombre?: string; telefono?: string; activo?: boolean }): Promise<Chofer> => {
    const response = await api.patch(`/choferes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/choferes/${id}`);
  }
};
