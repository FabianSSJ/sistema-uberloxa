import type { ReactNode } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { EstadoUnidadBadge } from './EstadoUnidadBadge';
import { getPaleta } from '../../../core/operadores/colores';
import { User, Hash, Car, Phone, Activity, Clock, Palette } from 'lucide-react';

interface UnidadDetalleModalProps {
  unidad: any | null;
  carrerasHoy: number;
  onClose: () => void;
}

const Row = ({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
    <div className="text-gray-400 shrink-0">{icon}</div>
    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 shrink-0">{label}</span>
    <span className="text-sm font-bold text-gray-800 flex-1 text-right min-w-0">{value}</span>
  </div>
);

/** Detalle completo de una unidad (se abre al clickear una fila en el dashboard). */
export const UnidadDetalleModal = ({ unidad, carrerasHoy, onClose }: UnidadDetalleModalProps) => {
  if (!unidad) return null;
  const paleta = getPaleta(unidad.colorIdentidad);

  return (
    <Modal isOpen={true} onClose={onClose} title={`Unidad Nº ${unidad.numeroUnidad || 'S/N'}`}>
      <div className="flex flex-col">
        <Row icon={<User size={16} />} label="Chofer" value={unidad.choferNombre || 'Sin chofer'} />
        <Row icon={<Hash size={16} />} label="Placa" value={<span className="font-mono">{unidad.placa}</span>} />
        <Row icon={<Car size={16} />} label="Vehículo" value={unidad.vehiculo || 'Sin detalle'} />
        <Row icon={<Phone size={16} />} label="Teléfono" value={unidad.choferTelefono || <span className="text-gray-400 italic font-normal">Sin teléfono</span>} />
        <Row icon={<Activity size={16} />} label="Estado" value={<span className="inline-flex justify-end"><EstadoUnidadBadge unidad={unidad} /></span>} />
        <Row icon={<Clock size={16} />} label="Carreras hoy" value={carrerasHoy} />
        <Row
          icon={<Palette size={16} />}
          label="Color"
          value={paleta.key
            ? <span className="inline-flex items-center gap-2 justify-end"><span className={`w-4 h-4 rounded-full ${paleta.swatch}`} />{paleta.label}</span>
            : <span className="text-gray-400 italic font-normal">Sin color</span>}
        />
      </div>
    </Modal>
  );
};
