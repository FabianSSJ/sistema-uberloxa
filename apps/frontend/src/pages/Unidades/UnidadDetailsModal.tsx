import React, { useEffect } from 'react';
import { X, Car, User, Phone, Palette, Calendar, Settings2 } from 'lucide-react';
import { Unidad } from '../../features/unidades/services/unidades.service';
import { Button } from '../../components/ui/Button';

interface UnidadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unidad: Unidad | null;
}

export const UnidadDetailsModal: React.FC<UnidadDetailsModalProps> = ({ isOpen, onClose, unidad }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !unidad) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-[slideIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Car size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 m-0">Detalles de Unidad</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Placa y Vehiculo */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              {unidad.numero && (
                <span className="px-3 py-1.5 bg-gray-800 text-white font-bold text-xl rounded-md shadow-sm">
                  Unidad {unidad.numero}
                </span>
              )}
              <span className="px-3 py-1.5 bg-yellow-50 text-yellow-800 border border-yellow-200 font-mono font-bold text-xl rounded-md tracking-wider shadow-sm">
                {unidad.placa}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mt-3">
              {unidad.modelo ? `${unidad.modelo.marca?.nombre} ${unidad.modelo.nombre}` : 'Vehículo sin modelo'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Conductor */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-3">
                <User size={16} /> Chofer Asignado
              </h4>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Nombre</div>
                  <div className="font-medium text-gray-800">{unidad.choferNombre}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Teléfono</div>
                  <div className="font-mono font-medium text-blue-700">
                    {unidad.choferTelefono || <span className="italic text-gray-400 font-sans">No registrado</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles Técnicos */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-3">
                <Settings2 size={16} /> Ficha Técnica
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b border-gray-200 pb-1">
                  <span className="text-sm text-gray-500 flex items-center gap-1.5"><Palette size={14}/> Color</span>
                  <span className="font-medium text-gray-800">{unidad.color || '-'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-1">
                  <span className="text-sm text-gray-500 flex items-center gap-1.5"><Calendar size={14}/> Año</span>
                  <span className="font-medium text-gray-800">{unidad.anio || '-'}</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 flex justify-end bg-gray-50/50">
          <Button variant="secondary" onClick={onClose}>
            Cerrar Detalles
          </Button>
        </div>
      </div>
    </div>
  );
};
