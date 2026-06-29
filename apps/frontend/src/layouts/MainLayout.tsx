import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Car, Users, Clock, Activity, Settings, LogOut, UserPlus, BarChart3 } from 'lucide-react';
import { useAuth } from '../features/auth/context/AuthContext';
import { usePendientesCount } from '../features/clientes/hooks/useClientes';

type NavItem = { path: string; icon: any; label: string; reqModule: string | null; badge?: number };

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const esAdmin = user?.rol === 'SUPERADMIN' || user?.rol === 'ADMIN';
  // El badge de pendientes solo importa para administración; si no es admin, no consultamos.
  const { data: pendientesCount = 0 } = usePendientesCount(esAdmin);

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
    if (!item.reqModule) return true; // Dashboard y Gestor siempre permitidos (si llegaron aquí)
    if (user?.rol === 'SUPERADMIN') {
      return true;
    }
    if (user?.rol === 'CHARLIE') {
      // El Charlie no debe ver los menús de CRUD completos de unidades ni clientes
      if (item.reqModule === 'unidades' || item.reqModule === 'clientes') return false;
      return true;
    }
    return user?.modulosPermitidos?.includes(item.reqModule);
  });

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      {/* Header */}
      <header className="relative z-10 py-5 px-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Car size={28} color="#ffffff" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="m-0 text-2xl font-bold text-gray-800 tracking-tight leading-none">Sistema UberLoxa</h1>
            </div>
          </div>
          <div className="text-base text-gray-600 font-medium flex items-center gap-6">
            <span>{new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-800">{user?.nombre}</span>
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">{user?.rol}</span>
              <button onClick={handleLogout} className="ml-2 text-gray-500 hover:text-red-600 transition-colors cursor-pointer" title="Cerrar Sesión">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="relative z-10 py-5 px-10 flex gap-4 flex-wrap">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `py-2.5 px-5 border rounded-md text-[15px] font-semibold cursor-pointer flex items-center gap-2 transition-all duration-200 shadow-sm
              ${isActive 
                ? 'bg-slate-800 border-slate-800 text-white' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
            {item.badge ? (
              <span className="ml-1 min-w-5 h-5 px-1.5 flex items-center justify-center text-[11px] font-bold bg-red-500 text-white rounded-full">
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      {/* Main Content */}
      <main className="relative z-10 py-5 px-10 pb-15">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
