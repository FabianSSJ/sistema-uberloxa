import { Modal } from '../../../components/ui/Modal';
import { DetailRow } from '../../../components/ui/DetailRow';
import { User, Phone, MapPin, Navigation, Car, Clock, FileText, Package, Hash } from 'lucide-react';
import { EstadoCarreraBadge } from './EstadoCarreraBadge';

interface CarreraDetalleModalProps {
  carrera: any | null;
  clientes?: any[];
  onClose: () => void;
}

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
        <DetailRow
          icon={<User size={16} />}
          label="Cliente"
          value={cliente.nombre || <span className="text-gray-400 italic font-normal">Sin nombre</span>}
        />
        {cliente.codigo != null && (
          <DetailRow
            icon={<Hash size={16} />}
            label="Código"
            value={<span className="font-mono text-blue-600 font-black">Cód. {cliente.codigo}</span>}
          />
        )}
        <DetailRow
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
        <DetailRow
          icon={<MapPin size={16} />}
          label="Dirección"
          value={cliente.direccion || <span className="text-gray-400 italic font-normal">Sin dirección</span>}
        />
        <DetailRow
          icon={<Navigation size={16} />}
          label="Sector"
          value={cliente.sector?.nombre || <span className="text-gray-400 italic font-normal">Sin sector</span>}
        />
        {cliente.descripcion && (
          <DetailRow
            icon={<FileText size={16} />}
            label="Ref. Cliente"
            value={cliente.descripcion}
          />
        )}
        <DetailRow
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
        <DetailRow
          icon={<Clock size={16} />}
          label="Estado"
          value={<span className="inline-flex justify-end"><EstadoCarreraBadge estado={carrera.estado} /></span>}
        />
        <DetailRow icon={<Clock size={16} />} label="Hora Registro" value={horaStr} />
        {carrera.esEncomienda && (
          <DetailRow
            icon={<Package size={16} />}
            label="Tipo"
            value={<span className="text-amber-700 font-black">ENCOMIENDA</span>}
          />
        )}
        {carrera.notas && (
          <DetailRow
            icon={<FileText size={16} />}
            label="Notas"
            value={<span className="font-normal text-gray-700">{carrera.notas}</span>}
          />
        )}
      </div>
    </Modal>
  );
};
