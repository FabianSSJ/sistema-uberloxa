import axios from 'axios';

const API_URL = 'http://localhost:3000/api/carreras';

export type EstadoCarrera = 'sin_asignar' | 'pendiente' | 'aceptada' | 'perdida' | 'cancelada';

export interface Carrera {
  id: number;
  clienteId: number;
  unidadId: number | null;
  creadoPorId: number | null;
  estado: EstadoCarrera;
  notas: string | null;
  createdAt: string;
  fechaFin: string | null;
  cliente: {
    id: number;
    nombre: string;
    telefono: string | null;
    sectorId: number | null;
    sector?: { nombre: string };
    direccion: string | null;
  };
  unidad: {
    id: number;
    placa: string;
    choferNombre: string;
    modelo: {
      nombre: string;
      marca: {
        nombre: string;
      }
    }
  } | null;
}

export interface CreateCarreraDto {
  clienteId: number;
  unidadId?: number;
  notas?: string;
}

export interface AssignUnidadDto {
  unidadId: number;
}

export interface UpdateEstadoCarreraDto {
  estado: EstadoCarrera;
}

export const carrerasService = {
  getAll: async (): Promise<Carrera[]> => {
    const { data } = await axios.get(API_URL);
    return data;
  },

  getById: async (id: number): Promise<Carrera> => {
    const { data } = await axios.get(`${API_URL}/${id}`);
    return data;
  },

  create: async (carrera: CreateCarreraDto): Promise<Carrera> => {
    const { data } = await axios.post(API_URL, carrera);
    return data;
  },

  assignUnidad: async (id: number, assignData: AssignUnidadDto): Promise<Carrera> => {
    const { data } = await axios.patch(`${API_URL}/${id}/asignar`, assignData);
    return data;
  },

  updateEstado: async (id: number, estadoData: UpdateEstadoCarreraDto): Promise<Carrera> => {
    const { data } = await axios.patch(`${API_URL}/${id}/estado`, estadoData);
    return data;
  },
};
