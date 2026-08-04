import { useState } from 'react';
import { useUsuarios, useCreateUsuario, useUpdateUsuario, useDeleteUsuario } from '../../../features/usuarios/hooks/useUsuarios';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Edit2, Plus, UserX, UserCheck } from 'lucide-react';
import { UsuarioFormModal } from './UsuarioFormModal';
import { getPaleta } from '../../../core/operadores/colores';

export const UsuariosTab = () => {
  const { data: usuarios = [], isLoading } = useUsuarios();
  const createMutation = useCreateUsuario();
  const updateMutation = useUpdateUsuario();
  const deleteMutation = useDeleteUsuario();

  const [modalData, setModalData] = useState<{isOpen: boolean, usuario: any}>({ isOpen: false, usuario: null });

  const handleCreateOrEdit = (data: any) => {
    if (modalData.usuario) {
      updateMutation.mutate({ id: modalData.usuario.id, data });
    } else {
      createMutation.mutate(data);
    }
    setModalData({ isOpen: false, usuario: null });
  };

  // "Eliminar" = desactivar (soft-delete): bloquea el login, conserva el historial.
  const [usuarioToDeactivate, setUsuarioToDeactivate] = useState<{ id: number; nombre: string } | null>(null);

  const handleDeactivate = (u: any) => {
    setUsuarioToDeactivate({ id: u.id, nombre: u.nombre });
  };

  const handleReactivate = (u: any) => {
    updateMutation.mutate({ id: u.id, data: { activo: true } });
  };

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h3 className="text-lg font-bold text-gray-800">Gestión de Usuarios</h3>
        <Button onClick={() => setModalData({ isOpen: true, usuario: null })} className="flex items-center gap-2 self-start sm:self-auto">
          <Plus size={16} /> Nuevo Usuario
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Módulos</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usuarios.map((u) => (
              <tr key={u.id} className={u.activo ? '' : 'opacity-50 bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full shrink-0"
                      style={getPaleta(u.color).swatch}
                      title={u.color ? `Color: ${u.color}` : 'Sin color'}
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {u.nombre}
                        {!u.activo && (
                          <span className="px-1.5 py-0.5 text-[0.625rem] font-bold rounded bg-gray-200 text-gray-600 uppercase">Inactivo</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.rol === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                    {u.rol}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 flex flex-wrap gap-1">
                    {u.rol === 'SUPERADMIN' ? 'TODOS' : u.modulosPermitidos.map((m: string) => (
                      <span key={m} className="bg-gray-100 px-2 py-0.5 rounded text-xs">{m}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => setModalData({ isOpen: true, usuario: u })} className="text-indigo-600 hover:text-indigo-900 mr-4" title="Editar">
                    <Edit2 size={18} />
                  </button>
                  {u.activo ? (
                    <button onClick={() => handleDeactivate(u)} className="text-red-600 hover:text-red-900" title="Desactivar (bloquear acceso)">
                      <UserX size={18} />
                    </button>
                  ) : (
                    <button onClick={() => handleReactivate(u)} className="text-green-600 hover:text-green-900" title="Reactivar">
                      <UserCheck size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UsuarioFormModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ isOpen: false, usuario: null })}
        onSubmit={handleCreateOrEdit}
        usuario={modalData.usuario}
      />

      <ConfirmDialog
        isOpen={usuarioToDeactivate !== null}
        onClose={() => setUsuarioToDeactivate(null)}
        onConfirm={() => {
          if (usuarioToDeactivate) deleteMutation.mutate(usuarioToDeactivate.id);
          setUsuarioToDeactivate(null);
        }}
        title="Desactivar Usuario"
        message={
          <span>
            ¿Desactivar a <span className="font-bold">"{usuarioToDeactivate?.nombre}"</span>? No podrá iniciar sesión, pero se conserva su historial.
          </span>
        }
        confirmText="Sí, Desactivar"
      />
    </div>
  );
};
