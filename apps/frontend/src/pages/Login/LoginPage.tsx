import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import api from '../../core/api/axios';
import { Car } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      login(response.data.access_token, response.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        {/* Usamos el logo que enviaste. Si aún no está en la carpeta, mostramos el carrito como fallback temporal */}
        <div className="relative flex justify-center mb-6">
          <img 
            src="/logo.jpg" 
            alt="Uber Loxa Taxi" 
            className="w-56 h-auto object-contain drop-shadow-[0_0_25px_rgba(34,197,94,0.3)] z-10" 
            onError={(e) => { 
              e.currentTarget.style.display = 'none'; 
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }} 
          />
          <div className="hidden text-green-500">
            <Car size={64} />
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#111] py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-green-900/30 backdrop-blur-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-md text-sm font-medium text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Usuario
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-xl shadow-inner text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all sm:text-sm"
                  placeholder="Ingresa tu usuario"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Contraseña
              </label>
              <div className="mt-2">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-xl shadow-inner text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)] text-sm font-bold text-white bg-green-600 hover:bg-green-500 hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-black transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isLoading ? 'Iniciando...' : 'INGRESAR'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
