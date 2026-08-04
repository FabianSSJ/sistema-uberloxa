import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, MapPin, Search, Eye } from 'lucide-react';
import { useClientesPaginados, useDeleteCliente } from '../../features/clientes/hooks/useClientes';
import { ClienteFormModal } from './ClienteFormModal';
import { ClienteDetailsModal } from './ClienteDetailsModal';
import { Cliente } from '../../features/clientes/services/clientes.service';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { CodigoBadge } from '../../components/ui/CodigoBadge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export const ClientesPage = () => {
  const deleteMutation = useDeleteCliente();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClienteId, setEditingClienteId] = useState<number | null>(null);
  const [viewingCliente, setViewingCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Debounce: no golpea al server en cada tecla (espera 350ms) y resetea a la página 1.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data: result, isLoading, isError } = useClientesPaginados(currentPage, itemsPerPage, debouncedSearch);
  const currentItems = result?.data ?? [];
  const totalClientes = result?.total ?? 0;

  const [clienteToDelete, setClienteToDelete] = useState<{ id: number; nombre: string } | null>(null);

  const handleDelete = (id: number, nombre: string) => {
    setClienteToDelete({ id, nombre });
  };

  const handleOpenEdit = (id: number) => {
    setEditingClienteId(id);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingClienteId(null);
    setIsModalOpen(true);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease-in] flex flex-col h-full">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl md:text-[1.75rem] text-gray-800 m-0 font-bold flex items-center gap-3">
          <Users className="text-blue-600" size={32} />
          Directorio de Clientes
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por código (ej. 01, 1)..." 
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 w-full sm:w-72 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <Button onClick={handleOpenCreate} icon={<Plus size={18} />}>
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 flex-1">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          Ocurrió un error al cargar los clientes. Por favor, intenta nuevamente.
        </div>
      ) : currentItems.length === 0 ? (
        <div className="text-center py-20 px-5 text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed flex-1">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">No se encontraron clientes.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                  <th className="px-6 py-4 font-semibold w-20 text-center">Código</th>
                  <th className="px-6 py-4 font-semibold w-1/4">Cliente</th>
                  <th className="px-6 py-4 font-semibold w-1/5">Teléfono</th>
                  <th className="px-6 py-4 font-semibold w-1/5">Sector</th>
                  <th className="px-6 py-4 font-semibold w-1/4">Dirección</th>
                  <th className="px-6 py-4 font-semibold w-12 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {currentItems.map((cliente, index) => (
                  <tr 
                    key={cliente.id} 
                    className={`group transition-all duration-200 border-l-4 hover:bg-blue-50/60 hover:border-l-blue-500 ${
                      index % 2 === 0 ? 'bg-white border-l-transparent' : 'bg-slate-100/60 border-l-transparent'
                    }`}
                  >
                    {/* Código */}
                    <td className="px-6 py-4 align-top text-center">
                      <CodigoBadge codigo={cliente.codigo} />
                    </td>

                    {/* Cliente Nombre */}
                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-gray-800 text-base">{cliente.nombre}</div>
                      {cliente.descripcion && (
                        <div className="text-xs text-gray-500 mt-1 line-clamp-1" title={cliente.descripcion}>
                          {cliente.descripcion}
                        </div>
                      )}
                    </td>

                    {/* Teléfono */}
                    <td className="px-6 py-4 align-top text-gray-700">
                      {cliente.telefono ? (
                        <div className="font-mono font-medium text-[0.9375rem]">{cliente.telefono}</div>
                      ) : (
                        <div className="text-gray-400 italic">No registrado</div>
                      )}
                      {cliente.telefonoAlt && (
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{cliente.telefonoAlt} (Alt)</div>
                      )}
                    </td>

                    {/* Sector */}
                    <td className="px-6 py-4 align-top text-gray-700">
                      {cliente.sector ? (
                        <span className="bg-white text-slate-700 px-3 py-1.5 rounded-md font-medium text-[0.8125rem] border border-slate-200 whitespace-nowrap inline-block shadow-sm">
                          {cliente.sector.nombre}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Sin sector</span>
                      )}
                    </td>

                    {/* Dirección */}
                    <td className="px-6 py-4 align-top text-gray-700">
                      <div className="flex items-start gap-1">
                        {cliente.direccion ? (
                          <span className="line-clamp-2 leading-relaxed text-[0.8125rem] text-gray-600">{cliente.direccion}</span>
                        ) : (
                          <span className="text-gray-400 italic">No registrada</span>
                        )}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex justify-center gap-2 opacity-0 md:opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button 
                          onClick={() => setViewingCliente(cliente)}
                          className="p-1.5 text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded shadow-sm transition-all"
                          title="Ver detalles"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(cliente.id)}
                          className="p-1.5 text-blue-600 bg-white hover:bg-blue-100 border border-blue-100 rounded shadow-sm transition-all"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cliente.id, cliente.nombre)}
                          className="p-1.5 text-red-600 bg-white hover:bg-red-100 border border-red-100 rounded shadow-sm transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-gray-200 bg-gray-50 mt-auto">
            <Pagination 
              currentPage={currentPage}
              totalItems={totalClientes}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <ClienteFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          clienteId={editingClienteId}
        />
      )}

      {/* Detalles Modal */}
      <ClienteDetailsModal
        isOpen={!!viewingCliente}
        onClose={() => setViewingCliente(null)}
        cliente={viewingCliente}
      />

      <ConfirmDialog
        isOpen={clienteToDelete !== null}
        onClose={() => setClienteToDelete(null)}
        onConfirm={() => {
          if (clienteToDelete) deleteMutation.mutate(clienteToDelete.id);
          setClienteToDelete(null);
        }}
        title="Eliminar Cliente"
        message={
          <span>
            ¿Estás seguro de eliminar a <span className="font-bold">"{clienteToDelete?.nombre}"</span>? Esta acción no se puede deshacer.
          </span>
        }
        confirmText="Sí, Eliminar"
      />
    </div>
  );
};
