// almacen-oltech-frontend/src/components/layout/Layout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

function Layout() {
  // Estado visual exclusivo para la responsividad en móviles
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900 font-sans relative">
      
      {/* 1. Menú Lateral Fijo a la izquierda (Ahora recibe props para móviles) */}
      <Sidebar 
        menuAbierto={menuMovilAbierto} 
        cerrarMenu={() => setMenuMovilAbierto(false)} 
      />

      {/* 2. Contenedor Derecho (Ocupa el resto de la pantalla) */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        
        {/* Barra Superior (Recibe la función para abrir el menú en móviles) */}
        <Topbar abrirMenu={() => setMenuMovilAbierto(true)} />

        {/* 3. Área Principal de Contenido (Padding adaptativo p-4 en móvil, p-6 en escritorio) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6">
          {/* El Outlet es el "hueco" donde React renderizará el Dashboard, Almacen, etc. */}
          <Outlet /> 
        </main>
        
      </div>
      
    </div>
  );
}

export default Layout;