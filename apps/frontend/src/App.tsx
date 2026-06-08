import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';

import { ClientesPage } from './pages/Clientes/ClientesPage';
import { UnidadesPage } from './pages/Unidades/UnidadesPage';

// Placeholders temporales para las páginas que refactorizaremos en Fase 4
const CarrerasPage = () => (
  <div className="animate-[fadeIn_0.5s_ease-in]">
    <div className="flex justify-between items-center mb-[30px] flex-wrap gap-[15px]">
      <h2 className="text-[28px] text-gray-800 m-0 font-bold">Historial de Carreras</h2>
      <button className="px-5 py-2.5 bg-green-600 border-none rounded-md text-white text-[15px] font-semibold cursor-pointer flex items-center gap-2 transition-colors duration-200 hover:bg-green-700">
        Registrar Carrera
      </button>
    </div>
    <div className="text-center py-[60px] px-5 text-gray-500">
      <p className="text-[18px]">Módulo en construcción (Fase 4)</p>
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
