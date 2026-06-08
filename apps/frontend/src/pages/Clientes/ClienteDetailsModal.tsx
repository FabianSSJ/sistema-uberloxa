import React, { useEffect } from 'react';
import { X, User, MapPin, Phone, Hash, AlignLeft, Map } from 'lucide-react';
import { Cliente } from '../../features/clientes/services/clientes.service';
import { Button } from '../../components/ui/Button';

interface ClienteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
}

export const ClienteDetailsModal: React.FC<ClienteDetailsModalProps> = ({ isOpen, onClose, cliente }) => {
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

  if (!isOpen || !cliente) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-in]"
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
              <User size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 m-0">Detalles del Cliente</h2>
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
          
          {/* Nombre y Sector */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{cliente.nombre}</h3>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-medium text-sm border border-slate-200 rounded-md">
                Sector: {cliente.sector?.nombre || 'Sin sector'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contacto */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-3">
                <Phone size={16} /> Contacto
              </h4>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Teléfono Principal</div>
                  <div className="font-mono font-medium text-gray-800">
                    {cliente.telefono || <span className="italic text-gray-400 font-sans">No registrado</span>}
                  </div>
                </div>
                {cliente.telefonoAlt && (
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Teléfono Alternativo</div>
                    <div className="font-mono font-medium text-gray-800">{cliente.telefonoAlt}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Ubicación */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-3">
                <Map size={16} /> Ubicación
              </h4>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Sector</div>
                  <div className="font-medium text-gray-800">{cliente.sector?.nombre || <span className="italic text-gray-400 font-sans">No registrado</span>}</div>
                </div>
                {cliente.linkGoogleMaps && (
                  <div>
                    <a 
                      href={cliente.linkGoogleMaps} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-sm mt-1 bg-blue-50 px-2 py-1.5 rounded-md transition-colors"
                    >
                      <MapPin size={14} />
                      Abrir en Google Maps
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dirección Completa */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-500 flex items-center gap-2 mb-2">
              <MapPin size={16} /> Dirección Exacta
            </h4>
            {cliente.direccion ? (
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{cliente.direccion}</p>
            ) : (
              <p className="text-gray-400 italic">Dirección no registrada</p>
            )}
          </div>

          {/* Notas */}
          {cliente.descripcion && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <h4 className="text-sm font-semibold text-yellow-800 flex items-center gap-2 mb-2">
                <AlignLeft size={16} /> Notas / Descripción
              </h4>
              <p className="text-yellow-900 leading-relaxed whitespace-pre-wrap">{cliente.descripcion}</p>
            </div>
          )}
          
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
