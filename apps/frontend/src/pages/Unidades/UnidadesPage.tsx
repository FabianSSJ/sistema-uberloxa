import React, { useState } from 'react';
import { useUnidades, useDeleteUnidad } from '../../features/unidades/hooks/useUnidades';
import { useAuth } from '../../features/auth/context/AuthContext';
import { useColaDespacho } from '../../features/unidades/hooks/useColaDespacho';
import { UnidadFormModal } from './UnidadFormModal';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { EstadoUnidadBadge } from '../../features/unidades/components/EstadoUnidadBadge';
import { AsignacionPanel } from '../../features/unidades/components/AsignacionPanel';
import { rankBy, scoreUnidad } from '../../core/search/matchers';
import { colorUnidad } from '../../core/operadores/colores';
import { Car, Search, Edit2, Trash2, Plus, ListOrdered, LayoutGrid } from 'lucide-react';

type Tab = 'asignacion' | 'lista';

export const UnidadesPage = () => {
  const { user } = useAuth();
  const { data: unidades = [], isLoading, isError } = useUnidades();
  const { carrerasHoy } = useColaDespacho();
  const deleteMutation = useDeleteUnidad();

  const [isUnidadModalOpen, setIsUnidadModalOpen] = useState(false);
  const [editingUnidadId, setEditingUnidadId] = useState<number | null>(null);

  const [tab, setTab] = useState<Tab>('asignacion');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const handleDelete = async (id: number, numero: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la unidad ${numero}?`)) {
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

  const filteredUnidades = rankBy(unidades, searchTerm, scoreUnidad);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUnidades.slice(indexOfFirstItem, indexOfLastItem);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const tabBtn = (value: Tab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setTab(value)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition ${
        tab === value ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="animate-[fadeIn_0.5s_ease-in]">
      {/* Header & Actions */}
      <div className="flex flex-col xl:flex-row xl:justify-between xl:items-center mb-6 gap-4">
        <h2 className="text-2xl md:text-[28px] text-gray-800 m-0 font-bold flex items-center gap-3">
          <Car className="text-blue-600" size={32} />
          Gestión de Unidades
        </h2>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por número, placa, chofer, teléfono, vehículo, modelo..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2.5 w-full sm:w-64 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {user?.rol !== 'CHARLIE' && (
            <div className="flex gap-2">
              <Button onClick={handleOpenCreate} icon={<Plus size={18} />}>
                Nueva Unidad
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs (segmentado) */}
      <div className="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {tabBtn('asignacion', 'Asignación', <ListOrdered size={16} />)}
        {user?.rol !== 'CHARLIE' && tabBtn('lista', 'Lista de unidades', <LayoutGrid size={16} />)}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          Ocurrió un error al cargar las unidades. Por favor, intenta nuevamente.
        </div>
      ) : tab === 'asignacion' ? (
        <AsignacionPanel searchTerm={searchTerm} />
      ) : filteredUnidades.length === 0 ? (
        <div className="text-center py-[60px] px-5 text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
          <Car size={64} className="mx-auto mb-5 opacity-50 text-blue-400" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Aún no hay unidades registradas</h3>
          <p className="text-[16px] text-gray-500 max-w-md mx-auto">
            {searchTerm
              ? 'No encontramos ninguna unidad que coincida con tu búsqueda.'
              : 'Comienza a gestionar tu flota agregando la primera unidad al sistema.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {currentItems.map((unidad) => (
              <div
                key={unidad.id}
                style={colorUnidad(unidad).borderLeft}
                className="bg-white rounded-xl p-5 border border-gray-200 border-l-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-300 font-mono text-xs font-bold rounded-md tracking-wider">
                          Nº {unidad.numeroUnidad || 'S/N'}
                        </span>
                        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 border border-yellow-300 font-mono text-xs font-bold rounded-md tracking-wider">
                          {unidad.placa}
                        </span>
                        <EstadoUnidadBadge unidad={unidad} />
                        {(() => { const n = carrerasHoy.get(unidad.id) || 0; return (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                          {n} {n === 1 ? 'carrera' : 'carreras'} hoy
                        </span>
                        ); })()}
                      </div>

                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide m-0">Vehículo</p>
                      <p className="text-[13px] font-bold text-gray-800 m-0 truncate">{unidad.vehiculo || 'Sin detalle'}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(unidad.id)}
                        className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(unidad.id, unidad.numeroUnidad || unidad.placa)}
                        className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer info (Chofer) */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide m-0 mb-1">Conductor Asignado</p>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[13px] font-bold text-gray-800 truncate">{unidad.choferNombre}</span>
                    {unidad.choferTelefono ? (
                      <span className="shrink-0 text-blue-700 font-mono text-[11px] font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                        {unidad.choferTelefono}
                      </span>
                    ) : (
                      <span className="shrink-0 text-gray-400 italic text-[11px]">Sin teléfono</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={filteredUnidades.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Modals */}
      {isUnidadModalOpen && (
        <UnidadFormModal
          isOpen={isUnidadModalOpen}
          onClose={() => {
            setIsUnidadModalOpen(false);
            setEditingUnidadId(null);
          }}
          editingId={editingUnidadId}
        />
      )}

    </div>
  );
};
