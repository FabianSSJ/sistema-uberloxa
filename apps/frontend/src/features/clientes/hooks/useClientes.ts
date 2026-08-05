import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientesService, Cliente, CreateClienteDto, UpdateClienteDto } from '../services/clientes.service';
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

// Clientes pendientes (sin código) — la bandeja de "Nuevos clientes".
export const usePendientes = () => {
  return useQuery({
    queryKey: ['clientes', 'pendientes'],
    queryFn: clientesService.getPendientes,
    refetchInterval: 10000,
  });
};

// Contador para el badge del nav (liviano). Solo para admin/superadmin (enabled), porque el
// endpoint requiere el módulo 'clientes'. Se refresca al crear/editar clientes (prefijo 'clientes').
export const usePendientesCount = (enabled = true) => {
  return useQuery({
    queryKey: ['clientes', 'pendientes', 'count'],
    queryFn: clientesService.getPendientesCount,
    refetchInterval: 15000,
    enabled,
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
    onSuccess: async (cliente) => {
      // Append optimista en vez de invalidar+refetch la lista completa: en un turno se
      // crean muchos clientes nuevos ("Crear rápido" desde el despacho) y esa lista solo
      // crece — refetchear los ~4mil clientes enteros en CADA alta iba empeorando la
      // carga de red cuanto más avanzaba el turno, justo el patrón de degradación que ya
      // matamos en WhatsApp y en el polling duplicado. El backend ahora devuelve el
      // cliente creado con su sector incluido (mismo shape que findAll), así que insertarlo
      // directo en la cache ya ordenada queda 100% consistente con lo que traería un refetch.
      //
      // cancelQueries ANTES de escribir: sin esto, un refetch de ['clientes'] que ya estaba
      // en vuelo (disparado por un update/delete de OTRO cliente segundos antes) puede
      // resolver DESPUÉS de este append con una foto vieja de la DB y pisarlo — el cliente
      // recién creado desaparecería de la pantalla sin aviso hasta el próximo refetch real.
      await queryClient.cancelQueries({ queryKey: ['clientes'], exact: true });
      queryClient.setQueryData<Cliente[]>(['clientes'], (prev) => {
        if (!prev) return prev;
        const next = [...prev, cliente];
        next.sort((a, b) => (a.codigo ?? Infinity) - (b.codigo ?? Infinity));
        return next;
      });
      // La tabla paginada de "Directorio de Clientes" (ClientesPage) usa una query aparte
      // (['clientes','paginado',...]) que el append de arriba no toca — sin esto, un alta
      // hecha desde ahí no aparecía en la tabla hasta cambiar de página o de búsqueda. Es
      // invalidar solo la página actual (barata), no el listado completo de ~4mil.
      queryClient.invalidateQueries({ queryKey: ['clientes', 'paginado'] });
      // Si nace sin código, cae directo en la bandeja de "Nuevos" — esa query sí se
      // invalida (es chica, acotada, y necesita reflejar el conteo/orden del server).
      if (cliente.codigo == null) {
        queryClient.invalidateQueries({ queryKey: ['clientes', 'pendientes'] });
      }
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
