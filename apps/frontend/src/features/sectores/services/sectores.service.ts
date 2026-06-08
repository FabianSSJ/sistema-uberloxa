import api from '../../../core/api/axios';
import { Sector } from '../../clientes/services/clientes.service';

export const sectoresService = {
  getAll: async (): Promise<Sector[]> => {
    const response = await api.get('/sectores');
    return response.data;
  }
};
