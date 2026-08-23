import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { ColorPicker } from '../../../components/ui/ColorPicker';
import { Car, Clock } from 'lucide-react';
import { getPaleta, estiloGradientePanel, parseColorPaneles } from '../../../core/operadores/colores';

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
  const [colorIdentidad, setColorIdentidad] = useState<string | null>(null);
  const [colorUnidades, setColorUnidades] = useState<string | null>(null);
  const [colorCarreras, setColorCarreras] = useState<string | null>(null);

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre);
      setUsername(usuario.username);
      setRol(usuario.rol);

      const { identidad, unidades, carreras } = parseColorPaneles(usuario.color);
      setColorIdentidad(identidad);
      setColorUnidades(unidades);
      setColorCarreras(carreras);

      setPassword('');
    } else {
      setNombre('');
      setUsername('');
      setPassword('');
      setRol('CHARLIE');
      setColorIdentidad(null);
      setColorUnidades(null);
      setColorCarreras(null);
    }
  }, [usuario, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalColor = colorIdentidad || colorUnidades || colorCarreras
      ? `${colorIdentidad || ''}|${colorUnidades || 'naranja'}|${colorCarreras || 'verde'}`
      : null;

    const data: any = { nombre, username, rol, color: finalColor };
    if (!usuario || password) {
      data.password = password;
    }
    onSubmit(data);
  };

  const paletaU = getPaleta(colorUnidades || 'naranja');
  const paletaC = getPaleta(colorCarreras || 'verde');
  const styleU = estiloGradientePanel(paletaU, '#f97316');
  const styleC = estiloGradientePanel(paletaC, '#10b981');

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

        {/* Color de Identidad del Charlie */}
        <ColorPicker
          label="Color de identidad (Distingue a este Charlie en carreras y reportes)"
          value={colorIdentidad}
          onChange={setColorIdentidad}
          allowNone={true}
        />

        {/* Colores de Paneles para este Operador */}
        <div className="flex flex-col gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-800">Colores de Paneles de su Tablero</span>
            <span className="text-xs text-gray-500 font-medium">Personalización visual</span>
          </div>

          <div className="flex flex-col gap-3">
            <ColorPicker
              label="Color del Panel Unidades"
              value={colorUnidades}
              onChange={setColorUnidades}
              allowNone={true}
            />

            <ColorPicker
              label="Color del Panel Gestión de Carreras"
              value={colorCarreras}
              onChange={setColorCarreras}
              allowNone={true}
            />
          </div>

          {/* Vista previa en vivo para el Administrador */}
          <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-slate-200">
            <div style={styleU} className="p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <Car size={14} className="text-current" />
              <span className="truncate">Unidades</span>
            </div>
            <div style={styleC} className="p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <Clock size={14} className="text-current" />
              <span className="truncate">Carreras</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar Usuario</Button>
        </div>
      </form>
    </Modal>
  );
};
