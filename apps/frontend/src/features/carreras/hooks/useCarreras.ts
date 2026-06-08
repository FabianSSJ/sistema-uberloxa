import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carrerasService, CreateCarreraDto, AssignUnidadDto, UpdateEstadoCarreraDto } from '../services/carreras.service';
import toast from 'react-hot-toast';

export const useCarreras = () => {
  const queryClient = useQueryClient();

  const carrerasQuery = useQuery({
    queryKey: ['carreras'],
    queryFn: carrerasService.getAll,
    refetchInterval: 5000, // Polling cada 5 segundos para mantener el despacho actualizado
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCarreraDto) => carrerasService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carreras'] });
      toast.success('Carrera creada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear la carrera');
    },
  });

  const assignUnidadMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssignUnidadDto }) => carrerasService.assignUnidad(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carreras'] });
      toast.success('Unidad asignada exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al asignar la unidad');
    },
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEstadoCarreraDto }) => carrerasService.updateEstado(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carreras'] });
      toast.success('Estado actualizado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar el estado');
    },
  });

  return {
    carrerasQuery,
    createMutation,
    assignUnidadMutation,
    updateEstadoMutation,
  };
};
