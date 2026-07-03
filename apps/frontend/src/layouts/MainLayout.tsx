import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Car, Users, Clock, Activity, Settings, LogOut, UserPlus, BarChart3 } from 'lucide-react';
import { useAuth } from '../features/auth/context/AuthContext';
import { usePendientesCount } from '../features/clientes/hooks/useClientes';
import { fechaLarga, hora } from '../core/tiempo';

type NavItem = { path: string; icon: any; label: string; reqModule: string | null; badge?: number };

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const esAdmin = user?.rol === 'SUPERADMIN' || user?.rol === 'ADMIN';
  const { data: pendientesCount = 0 } = usePendientesCount(esAdmin);

  // Reloj en vivo (hora de Ecuador). Se actualiza cada segundo.
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allNavItems: NavItem[] = [
    { path: '/', icon: Activity, label: 'Dashboard', reqModule: null },
    { path: '/unidades', icon: Car, label: 'Unidades', reqModule: 'unidades' },
    { path: '/clientes', icon: Users, label: 'Clientes', reqModule: 'clientes' },
    { path: '/carreras', icon: Clock, label: 'Carreras', reqModule: 'carreras' }
  ];

  if (esAdmin) {
    allNavItems.push({ path: '/nuevos-clientes', icon: UserPlus, label: 'Nuevos Clientes', reqModule: null, badge: pendientesCount });
    allNavItems.push({ path: '/estadisticas', icon: BarChart3, label: 'Estadísticas', reqModule: null });
  }

  if (user?.rol === 'SUPERADMIN') {
    allNavItems.push({ path: '/gestor-usuarios', icon: Settings, label: 'Gestor de Usuarios', reqModule: null });
  }

  const navItems = allNavItems.filter((item) => {
    if (!item.reqModule) return true;
    if (user?.rol === 'SUPERADMIN') {
      return true;
    }
    if (user?.rol === 'CHARLIE') {
      // El Charlie no debe ver el menú de CRUD de clientes (unidades ahora sí, a pedido del usuario)
      if (item.reqModule === 'clientes') return false;
      return true;
    }
    return user?.modulosPermitidos?.includes(item.reqModule);
  });

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      {/* Barra superior única y compacta: logo + navegación + reloj/usuario */}
      <header className="relative z-10 bg-white border-b border-gray-200 shadow-sm px-4 md:px-6 py-2">
        <div className="flex items-center justify-between gap-x-4 gap-y-2 flex-wrap">
          {/* Marca (span, no h1: cada página ya tiene su h1; además escapa del h1{56px} global) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center">
              <Car size={20} color="#ffffff" />
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight leading-none whitespace-nowrap">Sistema UberLoxa</span>
          </div>

          {/* Navegación (integrada en el header) */}
          <nav className="flex gap-1.5 flex-wrap items-center order-last w-full lg:order-none lg:w-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `py-1.5 px-3 border rounded-md text-sm font-semibold cursor-pointer flex items-center gap-1.5 transition-all duration-200
                  ${isActive
                    ? 'bg-slate-800 border-slate-800 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <item.icon size={16} />
                {item.label}
                {item.badge ? (
                  <span className="ml-0.5 min-w-5 h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            ))}
          </nav>

          {/* Reloj (hora de Ecuador) + usuario */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-[11px] text-gray-500 font-medium capitalize">{fechaLarga(ahora)}</div>
              <div className="text-sm font-bold text-slate-800 tabular-nums">{hora(ahora, true)}</div>
            </div>
            <div className="h-8 w-px bg-gray-300 hidden sm:block" />
            <span className="font-bold text-slate-800 text-sm whitespace-nowrap">{user?.nombre}</span>
            <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 rounded-full">{user?.rol}</span>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition-colors cursor-pointer" title="Cerrar Sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal (con más aire ahora que el header es compacto) */}
      <main className="relative z-10 py-4 px-4 md:px-6 pb-10">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
