import { Outlet, NavLink } from 'react-router-dom';
import { Car, Users, Clock, Activity } from 'lucide-react';

const MainLayout = () => {
  const navItems = [
    { path: '/', icon: Activity, label: 'Dashboard' },
    { path: '/unidades', icon: Car, label: 'Unidades' },
    { path: '/clientes', icon: Users, label: 'Clientes' },
    { path: '/carreras', icon: Clock, label: 'Carreras' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      {/* Header */}
      <header className="relative z-10 py-5 px-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Car size={28} color="#ffffff" />
            </div>
            <div>
              <h1 className="m-0 text-[32px] font-bold text-gray-800">Sistema UberLoxa</h1>
              <p className="m-0 text-sm text-gray-600">Sistema de Gestión Integral</p>
            </div>
          </div>
          <div className="text-base text-gray-600 font-medium">
            {new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
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
