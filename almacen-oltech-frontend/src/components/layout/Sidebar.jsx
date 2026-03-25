//almacen-oltech-frontend/src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import logoBlanco from '../../assets/Logo acostado blanco.png'; 

function Sidebar() {
  // Definimos nuestras rutas y dibujamos los íconos (SVGs) para cada módulo
  const menuItems = [
    {
      nombre: 'Dashboard',
      ruta: '/dashboard',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
        </svg>
      )
    },
    {
      nombre: 'Remisiones',
      ruta: '/remisiones',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      )
    },
    {
      nombre: 'Almacén Base',
      ruta: '/almacen',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
        </svg>
      )
    },
    {
      nombre: 'Catálogos',
      ruta: '/catalogos',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
      )
    },
    {
      nombre: 'Usuarios',
      ruta: '/usuarios',
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
      )
    }
  ];

  return (
    <aside className="w-64 bg-oltech-black text-white flex flex-col min-h-screen shadow-2xl z-20">
      
      {/* 1. Zona del Logo */}
      <div className="p-6 flex justify-center items-center border-b border-gray-800">
        <img 
          src={logoBlanco} 
          alt="OLTECH" 
          className="w-48 drop-shadow-md hover:scale-105 transition-transform duration-300" 
        />
      </div>

      {/* 2. Zona de los Botones de Navegación */}
      <nav className="flex-1 py-8 space-y-2 px-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.nombre}
            to={item.ruta}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gray-800 border-l-4 border-oltech-pink text-white shadow-md' // Estilo cuando estás en la página
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white border-l-4 border-transparent' // Estilo apagado
              }`
            }
          >
            {item.icono}
            <span className="font-medium tracking-wide">{item.nombre}</span>
          </NavLink>
        ))}
      </nav>

      {/* 3. Zona del Pie de página del menú */}
      <div className="p-4 border-t border-gray-800 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} Grupo OLTECH</p>
        <p className="mt-1">Versión 1.0.0</p>
      </div>
    </aside>
  );
}

export default Sidebar;