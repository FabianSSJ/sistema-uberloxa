import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { PrivateRoute } from './features/auth/components/PrivateRoute';
import { AppToaster } from './components/ui/toast';

// Code-splitting: cada página se baja solo al entrar a su ruta (bundle inicial más liviano).
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const ClientesPage = lazy(() => import('./pages/Clientes/ClientesPage').then(m => ({ default: m.ClientesPage })));
const UnidadesPage = lazy(() => import('./pages/Unidades/UnidadesPage').then(m => ({ default: m.UnidadesPage })));
const CarrerasPage = lazy(() => import('./pages/Carreras/CarrerasPage').then(m => ({ default: m.CarrerasPage })));
const LoginPage = lazy(() => import('./pages/Login/LoginPage').then(m => ({ default: m.LoginPage })));
const GestorUsuariosPage = lazy(() => import('./pages/GestorUsuarios/GestorUsuariosPage').then(m => ({ default: m.GestorUsuariosPage })));
const NuevosClientesPage = lazy(() => import('./pages/NuevosClientes/NuevosClientesPage').then(m => ({ default: m.NuevosClientesPage })));
const EstadisticasPage = lazy(() => import('./pages/Estadisticas/EstadisticasPage').then(m => ({ default: m.EstadisticasPage })));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
  </div>
);

function App() {
  return (
    <>
      <AppToaster />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route element={<PrivateRoute requiredModule="carreras" />}>
                <Route path="carreras" element={<CarrerasPage />} />
              </Route>
              <Route element={<PrivateRoute requiredModule="clientes" />}>
                <Route path="clientes" element={<ClientesPage />} />
              </Route>
              <Route element={<PrivateRoute requiredModule="unidades" />}>
                <Route path="unidades" element={<UnidadesPage />} />
              </Route>
              <Route element={<PrivateRoute allowedRoles={['SUPERADMIN']} />}>
                <Route path="gestor-usuarios" element={<GestorUsuariosPage />} />
              </Route>
              <Route element={<PrivateRoute allowedRoles={['SUPERADMIN', 'ADMIN']} />}>
                <Route path="nuevos-clientes" element={<NuevosClientesPage />} />
                <Route path="estadisticas" element={<EstadisticasPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
