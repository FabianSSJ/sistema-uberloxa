import { useState } from 'react';
import { UserPlus, Phone, MapPin, CheckCircle2, Trash2, Inbox } from 'lucide-react';
import { usePendientes, useDeleteCliente } from '../../features/clientes/hooks/useClientes';
import { ClienteFormModal } from '../Clientes/ClienteFormModal';
import { Button } from '../../components/ui/Button';

/**
 * Bandeja de "Nuevos clientes": clientes agregados en caliente SIN código.
 * Acá se completan (se les asigna código y lo que falte) reutilizando el ClienteFormModal.
 */
export const NuevosClientesPage = () => {
  const { data: pendientes = [], isLoading } = usePendientes();
  const deleteMutation = useDeleteCliente();
  const [completarId, setCompletarId] = useState<number | null>(null);

  const handleDescartar = (id: number, nombre: string) => {
    if (window.confirm(`¿Descartar a "${nombre}"? Se eliminará de la bandeja.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease-in]">
      <div className="flex items-center gap-3 mb-2">
        <UserPlus className="text-blue-600" size={32} />
        <h2 className="text-2xl md:text-[28px] text-gray-800 m-0 font-bold">Nuevos Clientes</h2>
        {pendientes.length > 0 && (
          <span className="px-2.5 py-1 text-sm font-bold bg-red-100 text-red-700 rounded-full">{pendientes.length} pendientes</span>
        )}
      </div>
      <p className="text-gray-500 mb-8">Clientes agregados sin código. Completalos asignándoles un código (y lo que falte).</p>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : pendientes.length === 0 ? (
        <div className="text-center py-[60px] px-5 text-gray-500 bg-white rounded-lg border border-gray-200 border-dashed">
          <Inbox size={64} className="mx-auto mb-5 opacity-40 text-blue-400" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">Bandeja al día 🎉</h3>
          <p className="text-[15px] max-w-md mx-auto">No hay clientes pendientes de completar. Cuando agregues uno sin código, va a aparecer acá.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pendientes.map((c: any) => (
            <div key={c.id} className="bg-white rounded-xl p-5 border border-gray-200 border-l-4 border-l-amber-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded uppercase tracking-wide">Sin código</span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-800 m-0 truncate">{c.nombre || 'Sin nombre'}</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-[12px] text-gray-500 flex items-center gap-1.5 m-0">
                    <Phone size={13} className="shrink-0" />
                    {c.telefono || c.telefonoAlt || <span className="italic text-gray-400">Sin teléfono</span>}
                  </p>
                  <p className="text-[12px] text-gray-500 flex items-start gap-1.5 m-0">
                    <MapPin size={13} className="shrink-0 mt-0.5" />
                    <span className="truncate">{c.direccion || 'Sin dirección'} · {c.sector?.nombre || 'Sin sector'}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <Button onClick={() => setCompletarId(c.id)} icon={<CheckCircle2 size={16} />} fullWidth>
                  Completar
                </Button>
                <button
                  onClick={() => handleDescartar(c.id, c.nombre)}
                  className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors shrink-0"
                  title="Descartar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {completarId !== null && (
        <ClienteFormModal
          isOpen={completarId !== null}
          onClose={() => setCompletarId(null)}
          clienteId={completarId}
        />
      )}
    </div>
  );
};
