import api from '../../../core/api/axios';

export interface Usuario {
  id: number;
  nombre: string;
  username: string;
  rol: string;
  modulosPermitidos: string[];
  activo: boolean;
  createdAt: string;
}

export const usuariosService = {
  getAll: async (): Promise<Usuario[]> => {
    const response = await api.get('/usuarios');
    return response.data;
  },

  create: async (data: any): Promise<Usuario> => {
    const response = await api.post('/usuarios', data);
    return response.data;
  },

  update: async (id: number, data: any): Promise<Usuario> => {
    const response = await api.patch(`/usuarios/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/usuarios/${id}`);
  }
};
