import api from '../../../core/api/axios';

export interface Sector {
  id: number;
  nombre: string;
}

export interface Cliente {
  id: number;
  codigo?: number;
  nombre: string;
  telefono?: string;
  telefonoAlt?: string;
  direccion?: string;
  descripcion?: string;
  linkGoogleMaps?: string;
  sectorId?: number;
  sector?: Sector;
  activo: boolean;
}

export interface CreateClienteDto {
  nombre: string;
  telefono?: string;
  telefonoAlt?: string;
  direccion?: string;
  descripcion?: string;
  linkGoogleMaps?: string;
  sectorId?: number;
}

export type UpdateClienteDto = Partial<CreateClienteDto>;

export interface PaginatedClientes {
  data: Cliente[];
  total: number;
  page: number;
  totalPages: number;
}

export const clientesService = {
  getAll: async (): Promise<Cliente[]> => {
    const response = await api.get('/clientes');
    return response.data;
  },

  getPaginated: async (page: number, limit: number, search?: string): Promise<PaginatedClientes> => {
    const response = await api.get('/clientes/paginado', {
      params: { page, limit, search: search?.trim() || undefined },
    });
    return response.data;
  },

  getById: async (id: number): Promise<Cliente> => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  },

  create: async (data: CreateClienteDto): Promise<Cliente> => {
    const response = await api.post('/clientes', data);
    return response.data;
  },

  update: async (id: number, data: UpdateClienteDto): Promise<Cliente> => {
    const response = await api.patch(`/clientes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string; id: number }> => {
    const response = await api.delete(`/clientes/${id}`);
    return response.data;
  }
};
