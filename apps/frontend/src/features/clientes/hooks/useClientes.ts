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
