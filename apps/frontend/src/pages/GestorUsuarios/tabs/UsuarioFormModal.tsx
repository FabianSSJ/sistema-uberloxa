import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { ColorPicker } from '../../../components/ui/ColorPicker';

interface UsuarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  usuario?: any;
}



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
  const [color, setColor] = useState<string | null>(null);


  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre);
      setUsername(usuario.username);
      setRol(usuario.rol);
      setColor(usuario.color ?? null);

      setPassword('');
    } else {
      setNombre('');
      setUsername('');
      setPassword('');
      setRol('CHARLIE');
      setColor(null);

    }
  }, [usuario, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { nombre, username, rol, color };
    if (!usuario || password) {
      data.password = password;
    }
    onSubmit(data);
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

        <ColorPicker
          label="Color de identidad"
          value={color}
          onChange={setColor}
        />

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar Usuario</Button>
        </div>
      </form>
    </Modal>
  );
};
