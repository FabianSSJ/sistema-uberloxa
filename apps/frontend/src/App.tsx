import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';

import { ClientesPage } from './pages/Clientes/ClientesPage';
import { UnidadesPage } from './pages/Unidades/UnidadesPage';
import { CarrerasPage } from './pages/Carreras/CarrerasPage';

// Placeholders temporales para las páginas que refactorizaremos en Fase 5
const DashboardPage = () => (
  <div className="animate-[fadeIn_0.5s_ease-in]">
    <div className="flex justify-between items-center mb-[30px] flex-wrap gap-[15px]">
      <h2 className="text-[28px] text-[#2c3e50] m-0 font-bold border-b-2 border-[#3498db] pb-[10px]">
        📊 Dashboard Analítico
      </h2>
    </div>
    <div className="text-center py-[60px] px-[20px] text-[#7f8c8d] bg-white rounded-[10px] border border-dashed border-[#bdc3c7]">
      <h3 className="text-[24px] font-medium text-[#34495e] mb-[15px]">Módulo en construcción</h3>
      <p className="text-[16px] max-w-[500px] mx-auto leading-[1.6]">
        Aquí irán las gráficas de carreras por día, semana y mes, ranking de choferes, y tiempos promedio de atención.
      </p>
    </div>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="unidades" element={<UnidadesPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="carreras" element={<CarrerasPage />} />
      </Route>
    </Routes>
  );
}

export default App;
