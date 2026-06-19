import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface UsuarioFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  usuario?: any;
}

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { nombre, username, rol, modulosPermitidos };
    if (!usuario) {
      data.password = password;
    } else if (password) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">{usuario ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input 
              required 
              type="text" 
              value={nombre} 
              onChange={e => setNombre(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario (Login)</label>
            <input 
              required 
              type="text" 
              value={username} 
              disabled={!!usuario}
              onChange={e => setUsername(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none disabled:bg-gray-100 transition-colors text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña {usuario ? '(Dejar en blanco para no cambiar)' : ''}
            </label>
            <input 
              required={!usuario} 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select 
              value={rol} 
              onChange={e => setRol(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors text-gray-800 cursor-pointer"
            >
              <option value="CHARLIE">CHARLIE</option>
              <option value="ADMIN">ADMIN</option>
              <option value="SUPERADMIN">SUPERADMIN</option>
            </select>
          </div>

          {rol !== 'SUPERADMIN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Módulos Permitidos</label>
              <div className="grid grid-cols-2 gap-3">
                {['carreras', 'clientes', 'unidades', 'choferes'].map(mod => (
                  <label key={mod} className="flex items-center space-x-2 cursor-pointer p-2 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={modulosPermitidos.includes(mod)}
                      onChange={() => handleModuleToggle(mod)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 capitalize">{mod}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="success">Guardar Usuario</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
