import type { ReactNode } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { User, Phone, MapPin, Navigation, Car, Clock, FileText, Package, Hash } from 'lucide-react';
import { EstadoCarreraBadge } from './EstadoCarreraBadge';

interface CarreraDetalleModalProps {
  carrera: any | null;
  clientes?: any[];
  onClose: () => void;
}

const Row = ({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
    <div className="text-gray-400 shrink-0">{icon}</div>
    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 shrink-0">{label}</span>
    <span className="text-sm font-bold text-gray-800 flex-1 text-right min-w-0">{value}</span>
  </div>
);

export const CarreraDetalleModal = ({ carrera, clientes = [], onClose }: CarreraDetalleModalProps) => {
  if (!carrera) return null;

  // Buscar el cliente completo en la lista de clientes en memoria si falta algo en la carrera
  const clienteFromList = clientes.find((c: any) => c.id === (carrera.clienteId || carrera.cliente?.id));
  const cliente = { ...carrera.cliente, ...clienteFromList };
  const unidad = carrera.unidad;

  const horaStr = carrera.createdAt
    ? new Date(carrera.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={cliente.codigo != null ? `Cliente Cód. ${cliente.codigo}` : `Cliente Sin Código`}
    >
      <div className="flex flex-col">
        <Row
          icon={<User size={16} />}
          label="Cliente"
          value={cliente.nombre || <span className="text-gray-400 italic font-normal">Sin nombre</span>}
        />
        {cliente.codigo != null && (
          <Row
            icon={<Hash size={16} />}
            label="Código"
            value={<span className="font-mono text-blue-600 font-black">Cód. {cliente.codigo}</span>}
          />
        )}
        <Row
          icon={<Phone size={16} />}
          label="Teléfono"
          value={
            cliente.telefono || cliente.telefonoAlt ? (
              <span>
                {cliente.telefono}
                {cliente.telefonoAlt ? ` / ${cliente.telefonoAlt}` : ''}
              </span>
            ) : (
              <span className="text-gray-400 italic font-normal">Sin teléfono</span>
            )
          }
        />
        <Row
          icon={<MapPin size={16} />}
          label="Dirección"
          value={cliente.direccion || <span className="text-gray-400 italic font-normal">Sin dirección</span>}
        />
        <Row
          icon={<Navigation size={16} />}
          label="Sector"
          value={cliente.sector?.nombre || <span className="text-gray-400 italic font-normal">Sin sector</span>}
        />
        {cliente.descripcion && (
          <Row
            icon={<FileText size={16} />}
            label="Ref. Cliente"
            value={cliente.descripcion}
          />
        )}
        <Row
          icon={<Car size={16} />}
          label="Unidad"
          value={
            unidad ? (
              <span className="font-bold text-emerald-700">
                Nº {unidad.numeroUnidad || 'S/N'} {unidad.choferNombre ? `(${unidad.choferNombre})` : ''}
              </span>
            ) : (
              <span className="text-amber-600 font-semibold italic">Sin unidad (Pendiente)</span>
            )
          }
        />
        <Row
          icon={<Clock size={16} />}
          label="Estado"
          value={<span className="inline-flex justify-end"><EstadoCarreraBadge estado={carrera.estado} /></span>}
        />
        <Row icon={<Clock size={16} />} label="Hora Registro" value={horaStr} />
        {carrera.esEncomienda && (
          <Row
            icon={<Package size={16} />}
            label="Tipo"
            value={<span className="text-amber-700 font-black">ENCOMIENDA</span>}
          />
        )}
        {carrera.notas && (
          <Row
            icon={<FileText size={16} />}
            label="Notas"
            value={<span className="font-normal text-gray-700">{carrera.notas}</span>}
          />
        )}
      </div>
    </Modal>
  );
};
