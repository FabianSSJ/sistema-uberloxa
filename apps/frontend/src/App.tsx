import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';

import { ClientesPage } from './pages/Clientes/ClientesPage';
import { UnidadesPage } from './pages/Unidades/UnidadesPage';
import { CarrerasPage } from './pages/Carreras/CarrerasPage';
import { LoginPage } from './pages/Login/LoginPage';
import { PrivateRoute } from './features/auth/components/PrivateRoute';
import { GestorUsuariosPage } from './pages/GestorUsuarios/GestorUsuariosPage';

function App() {
  return (
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
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
