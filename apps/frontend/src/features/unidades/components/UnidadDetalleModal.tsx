import { Modal } from '../../../components/ui/Modal';
import { DetailRow } from '../../../components/ui/DetailRow';
import { EstadoUnidadBadge } from './EstadoUnidadBadge';
import { getPaleta } from '../../../core/operadores/colores';
import { User, Hash, Car, Phone, Activity, Clock, Palette } from 'lucide-react';

interface UnidadDetalleModalProps {
  unidad: any | null;
  carrerasHoy: number;
  onClose: () => void;
}

/** Detalle completo de una unidad (se abre al clickear una fila en el dashboard). */
export const UnidadDetalleModal = ({ unidad, carrerasHoy, onClose }: UnidadDetalleModalProps) => {
  if (!unidad) return null;
  const paleta = getPaleta(unidad.colorIdentidad);

  return (
    <Modal isOpen={true} onClose={onClose} title={`Unidad Nº ${unidad.numeroUnidad || 'S/N'}`}>
      <div className="flex flex-col">
        <DetailRow icon={<User size={16} />} label="Chofer" value={unidad.choferNombre || 'Sin chofer'} />
        <DetailRow icon={<Hash size={16} />} label="Placa" value={<span className="font-mono">{unidad.placa}</span>} />
        <DetailRow icon={<Car size={16} />} label="Vehículo" value={unidad.vehiculo || 'Sin detalle'} />
        <DetailRow icon={<Phone size={16} />} label="Teléfono" value={unidad.choferTelefono || <span className="text-gray-400 italic font-normal">Sin teléfono</span>} />
        <DetailRow icon={<Activity size={16} />} label="Estado" value={<span className="inline-flex justify-end"><EstadoUnidadBadge unidad={unidad} /></span>} />
        <DetailRow icon={<Clock size={16} />} label="Carreras hoy" value={carrerasHoy} />
        <DetailRow
          icon={<Palette size={16} />}
          label="Color"
          value={paleta.base
            ? <span className="inline-flex items-center gap-2 justify-end"><span className="w-4 h-4 rounded-full" style={paleta.swatch} />{paleta.label}</span>
            : <span className="text-gray-400 italic font-normal">Sin color</span>}
        />
      </div>
    </Modal>
  );
};
