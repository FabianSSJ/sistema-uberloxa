import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';

interface UsuarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  usuario?: any;
}

const MODULOS = ['carreras', 'clientes', 'unidades', 'choferes'];

const ROLES = [
  { value: 'CHARLIE', label: 'CHARLIE' },
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'SUPERADMIN', label: 'SUPERADMIN' },
];

export const UsuarioFormModal: React.FC<UsuarioFormModalProps> = ({ isOpen, onClose, onSubmit, usuario }) => {
  const [nombre, setNombre] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rol, setRol] = useState('CHARLIE');
  const [modulosPermitidos, setModulosPermitidos] = useState<string[]>([]);

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre);
      setUsername(usuario.username);
      setRol(usuario.rol);
      setModulosPermitidos(usuario.modulosPermitidos || []);
      setPassword('');
    } else {
      setNombre('');
      setUsername('');
      setPassword('');
      setRol('CHARLIE');
      setModulosPermitidos([]);
    }
  }, [usuario, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { nombre, username, rol, modulosPermitidos };
    if (!usuario || password) {
      data.password = password;
    }
    onSubmit(data);
  };

  const handleModuleToggle = (mod: string) => {
    if (modulosPermitidos.includes(mod)) {
      setModulosPermitidos(modulosPermitidos.filter(m => m !== mod));
    } else {
      setModulosPermitidos([...modulosPermitidos, mod]);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={usuario ? 'Editar Usuario' : 'Nuevo Usuario'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <Input
            label="Nombre Completo *"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: José Lenin Jiménez"
            required
            autoFocus
          />
          <Input
            label="Usuario (Login) *"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ej: jlenin"
            disabled={!!usuario}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <Input
            label={usuario ? 'Contraseña (opcional)' : 'Contraseña *'}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={usuario ? 'Dejar en blanco para no cambiar' : '••••••••'}
            required={!usuario}
          />
          <Select
            label="Rol"
            options={ROLES}
            value={rol}
            onChange={(val) => setRol(String(val))}
          />
        </div>

        {rol !== 'SUPERADMIN' && (
          <div className="border-t border-gray-100 pt-4">
            <label className="text-sm font-semibold text-gray-700">Módulos Permitidos</label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {MODULOS.map(mod => (
                <label key={mod} className="flex items-center gap-2 cursor-pointer p-2.5 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={modulosPermitidos.includes(mod)}
                    onChange={() => handleModuleToggle(mod)}
                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 capitalize">{mod}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar Usuario</Button>
        </div>
      </form>
    </Modal>
  );
};
