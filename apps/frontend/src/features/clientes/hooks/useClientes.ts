import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesService, CreateClienteDto, UpdateClienteDto } from '../services/clientes.service';
import { notify } from '../../../components/ui/toast';

export const useClientes = () => {
  return useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const data = await clientesService.getAll();
      // Ordenar por el codigo real (secuencial del Excel), nulls al final.
      return data.sort((a: any, b: any) => (a.codigo ?? Infinity) - (b.codigo ?? Infinity));
    },
  });
};

// Paginado + búsqueda server-side: la tabla de Clientes solo baja la página visible.
export const useClientesPaginados = (page: number, limit: number, search: string) => {
  return useQuery({
    queryKey: ['clientes', 'paginado', page, limit, search],
    queryFn: () => clientesService.getPaginated(page, limit, search),
    placeholderData: (prev) => prev, // mantiene la data anterior mientras carga la nueva (sin parpadeo)
  });
};

export const useCreateCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClienteDto) => clientesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      notify.success('Cliente creado con éxito');
    },
  });
};

export const useUpdateCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateClienteDto }) =>
      clientesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      notify.success('Cliente actualizado');
    },
  });
};

export const useDeleteCliente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clientesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      notify.success('Cliente eliminado');
    },
  });
};
