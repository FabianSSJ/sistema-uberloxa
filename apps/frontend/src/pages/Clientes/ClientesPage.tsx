import { useState } from 'react';
import { Users, Plus, Edit2, Trash2, MapPin, Search } from 'lucide-react';
import { useClientes, useDeleteCliente } from '../../features/clientes/hooks/useClientes';
import { ClienteFormModal } from './ClienteFormModal';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';

export const ClientesPage = () => {
  const { data: clientes = [], isLoading, isError } = useClientes();
  const deleteMutation = useDeleteCliente();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClienteId, setEditingClienteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 12 cards per page (fits nicely in grids of 2 or 3)

  const handleDelete = async (id: number, nombre: string) => {
    if (window.confirm(`¿Estás seguro de eliminar al cliente ${nombre}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenEdit = (id: number) => {
    setEditingClienteId(id);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingClienteId(null);
    setIsModalOpen(true);
  };

  const filteredClientes = clientes.filter(c => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    
    // Buscar exactamente por el ID numérico o el código formateado
    const idFormatted = String(c.id).padStart(2, '0');
    const exactId = String(c.id);
    
    return idFormatted === term || exactId === term || idFormatted.includes(term);
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredClientes.slice(indexOfFirstItem, indexOfLastItem);

  // Reset page when searching
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease-in]">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h2 className="text-2xl md:text-[28px] text-gray-800 m-0 font-bold flex items-center gap-3">
          <Users className="text-blue-600" size={32} />
          Gestión de Clientes
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por código (ej. 01, 1)..." 
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2.5 w-full sm:w-64 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <Button onClick={handleOpenCreate} icon={<Plus size={20} />}>
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          Ocurrió un error al cargar los clientes. Por favor, intenta nuevamente.
        </div>
      ) : filteredClientes.length === 0 ? (
        <div className="text-center py-[60px] px-5 text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
          <Users size={64} className="mx-auto mb-5 opacity-50" />
          <p className="text-[18px]">No se encontraron clientes.</p>
        </div>
      ) : (
        /* Responsive Grid: Cards on mobile, Table-like cards on Desktop */
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {currentItems.map((cliente) => (
              <div 
                key={cliente.id} 
                className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md">
                          #{cliente.id}
                        </span>
                        <h3 className="text-lg font-bold text-gray-800 m-0 leading-tight">
                          {cliente.nombre}
                        </h3>
                      </div>
                      
                      <div className="text-sm font-medium mb-1">
                        <span className="text-gray-500">Sector: </span>
                        {cliente.sector ? (
                          <span className="text-gray-800">{cliente.sector.nombre}</span>
                        ) : (
                          <span className="text-gray-400 italic font-normal">Sin sector</span>
                        )}
                      </div>
                      
                      <div className="text-sm flex items-start gap-1 mt-2">
                        <span className="mt-0.5 text-gray-400">📍</span>
                        {cliente.direccion ? (
                          <span className="text-gray-600 leading-snug">{cliente.direccion}</span>
                        ) : (
                          <span className="text-gray-400 italic font-normal">Sin dirección</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEdit(cliente.id)}
                        className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(cliente.id, cliente.nombre)}
                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer info (Phones & Maps) */}
                <div>
                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap justify-between items-center gap-2 text-sm">
                    <div className="flex flex-col">
                      {cliente.telefono ? (
                        <span className="text-gray-700 font-mono font-medium">{cliente.telefono}</span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Sin teléfono</span>
                      )}
                      
                      {cliente.telefonoAlt && (
                        <span className="text-gray-500 font-mono text-xs mt-0.5">{cliente.telefonoAlt} (Alt)</span>
                      )}
                    </div>
                    
                    {cliente.linkGoogleMaps && (
                      <a 
                        href={cliente.linkGoogleMaps} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium transition-colors bg-blue-50 px-2 py-1 rounded"
                      >
                        <MapPin size={14} />
                        Maps
                      </a>
                    )}
                  </div>
                  
                  <div className={`mt-3 text-xs p-2 rounded ${cliente.descripcion ? 'text-gray-500 bg-gray-50 italic' : 'text-gray-400 bg-gray-50 italic border border-gray-200 border-dashed'}`}>
                    {cliente.descripcion ? cliente.descripcion : 'Sin notas / descripción'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination 
            currentPage={currentPage}
            totalItems={filteredClientes.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <ClienteFormModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          clienteId={editingClienteId}
        />
      )}
    </div>
  );
};
