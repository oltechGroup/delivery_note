//almacen-oltech-frontend/src/components/layout/Layout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900 font-sans">
      
      {/* 1. Menú Lateral Fijo a la izquierda */}
      <Sidebar />

      {/* 2. Contenedor Derecho (Ocupa el resto de la pantalla) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Barra Superior */}
        <Topbar />

        {/* 3. Área Principal de Contenido (Aquí se inyectan las pantallas) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {/* El Outlet es el "hueco" donde React renderizará el Dashboard, Almacen, etc. */}
          <Outlet /> 
        </main>
        
      </div>
      
    </div>
  );
}

export default Layout;