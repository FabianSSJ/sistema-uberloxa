import axios from 'axios';

// La URL base por defecto es el backend en el puerto 3001 (el 3000 lo usa otro proyecto en esta máquina).
const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el token JWT en cada request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Sesión vencida o inválida: sin esto, un token expirado (8h) dejaba a los paneles con
// polling (cada 1s) reintentando en silencio para siempre — nunca mandaba al login, nunca
// mostraba error, solo seguía fallando cada segundo. Excluye /auth/login: ahí un 401 es
// "contraseña incorrecta", lo maneja el propio formulario, no una sesión vencida.
let sesionExpirando = false;
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const esLogin = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !esLogin && !sesionExpirando) {
      sesionExpirando = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
