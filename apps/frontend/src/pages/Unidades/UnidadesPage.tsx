import React, { useState } from 'react';
import { useUnidades, useDeleteUnidad } from '../../features/unidades/hooks/useUnidades';
import { UnidadFormModal } from './UnidadFormModal';
import { MarcaManagerModal } from './MarcaManagerModal';
import { ModeloManagerModal } from './ModeloManagerModal';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { Car, Search, Edit2, Trash2, Plus, Settings2, Tags } from 'lucide-react';

export const UnidadesPage = () => {
  const { data: unidades = [], isLoading, isError } = useUnidades();
  const deleteMutation = useDeleteUnidad();

  const [isUnidadModalOpen, setIsUnidadModalOpen] = useState(false);
  const [editingUnidadId, setEditingUnidadId] = useState<number | null>(null);
  
  const [isMarcaModalOpen, setIsMarcaModalOpen] = useState(false);
  const [isModeloModalOpen, setIsModeloModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleDelete = async (id: number, placa: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la unidad ${placa}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenEdit = (id: number) => {
    setEditingUnidadId(id);
    setIsUnidadModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingUnidadId(null);
    setIsUnidadModalOpen(true);
  };

  const filteredUnidades = unidades.filter(u => 
    u.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.choferNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.modelo?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.modelo?.marca?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUnidades.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease-in] flex flex-col h-full">
      {/* Header & Actions */}
      <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center mb-6 gap-4">
        <h2 className="text-2xl md:text-[28px] text-gray-800 m-0 font-bold flex items-center gap-3">
          <Car className="text-blue-600" size={32} />
          Directorio de Unidades
        </h2>
        
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por placa, chofer o modelo..." 
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 w-full sm:w-72 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => setIsMarcaModalOpen(true)} variant="secondary" icon={<Tags size={18} />}>
              Marcas
            </Button>
            <Button onClick={() => setIsModeloModalOpen(true)} variant="secondary" icon={<Settings2 size={18} />}>
              Modelos
            </Button>
            <Button onClick={handleOpenCreate} icon={<Plus size={18} />}>
              Nueva Unidad
            </Button>
          </div>
        </div>
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20 flex-1">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          Ocurrió un error al cargar las unidades. Por favor, intenta nuevamente.
        </div>
      ) : filteredUnidades.length === 0 ? (
        <div className="text-center py-20 px-5 text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed flex-1">
          <Car size={48} className="mx-auto mb-4 opacity-30 text-blue-400" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Aún no hay unidades registradas</h3>
          <p className="text-base text-gray-500 max-w-md mx-auto">
            {searchTerm 
              ? "No encontramos ninguna unidad que coincida con tu búsqueda." 
              : "Comienza a gestionar tu flota agregando la primera unidad al sistema. No olvides registrar las marcas y modelos primero."}
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm">
                  <th className="px-6 py-4 font-semibold w-32">Placa</th>
                  <th className="px-6 py-4 font-semibold w-1/4">Vehículo</th>
                  <th className="px-6 py-4 font-semibold w-1/4">Detalles</th>
                  <th className="px-6 py-4 font-semibold w-1/3">Conductor Asignado</th>
                  <th className="px-6 py-4 font-semibold w-12 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {currentItems.map((unidad, index) => (
                  <tr 
                    key={unidad.id} 
                    className={`group transition-all duration-200 border-l-4 hover:bg-blue-50/60 hover:border-l-blue-500 ${
                      index % 2 === 0 ? 'bg-white border-l-transparent' : 'bg-slate-100/60 border-l-transparent'
                    }`}
                  >
                    {/* Placa */}
                    <td className="px-6 py-4 align-middle">
                      <span className="px-3 py-1.5 bg-yellow-50 text-yellow-800 border border-yellow-200 font-mono font-bold rounded-md tracking-wider shadow-sm">
                        {unidad.placa}
                      </span>
                    </td>

                    {/* Vehículo */}
                    <td className="px-6 py-4 align-middle">
                      {unidad.modelo ? (
                        <div className="font-semibold text-gray-800 text-[15px]">
                          {unidad.modelo.marca?.nombre} {unidad.modelo.nombre}
                        </div>
                      ) : (
                        <div className="text-gray-400 italic">Sin modelo</div>
                      )}
                    </td>

                    {/* Detalles */}
                    <td className="px-6 py-4 align-middle text-gray-600">
                      <div className="flex gap-2 mb-1">
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-xs">Color: <strong>{unidad.color || '-'}</strong></span>
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-xs">Año: <strong>{unidad.anio || '-'}</strong></span>
                      </div>
                    </td>

                    {/* Chofer */}
                    <td className="px-6 py-4 align-middle">
                      <div className="font-bold text-gray-800 text-[15px]">{unidad.choferNombre}</div>
                      {unidad.choferTelefono ? (
                        <div className="text-blue-700 font-mono text-sm mt-1 inline-block bg-white border border-blue-100 px-2 py-1 rounded shadow-sm">
                          {unidad.choferTelefono}
                        </div>
                      ) : (
                        <div className="text-gray-400 italic text-xs mt-1">Sin teléfono</div>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 align-middle">
                      <div className="flex justify-center gap-2 opacity-0 md:opacity-100 xl:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button 
                          onClick={() => handleOpenEdit(unidad.id)}
                          className="p-1.5 text-blue-600 bg-white hover:bg-blue-100 border border-blue-100 rounded shadow-sm transition-all"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(unidad.id, unidad.placa)}
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
              totalItems={filteredUnidades.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {isUnidadModalOpen && (
        <UnidadFormModal 
          isOpen={isUnidadModalOpen} 
          onClose={() => setIsUnidadModalOpen(false)} 
          editingId={editingUnidadId}
        />
      )}

      {isMarcaModalOpen && (
        <MarcaManagerModal 
          isOpen={isMarcaModalOpen} 
          onClose={() => setIsMarcaModalOpen(false)} 
        />
      )}

      {isModeloModalOpen && (
        <ModeloManagerModal 
          isOpen={isModeloModalOpen} 
          onClose={() => setIsModeloModalOpen(false)} 
        />
      )}
    </div>
  );
};
