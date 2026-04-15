// almacen-oltech-frontend/src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import logoBlanco from '../../assets/Logo acostado blanco.png'; 

// NUEVO: Agregamos las props para controlar la vista en móviles
function Sidebar({ menuAbierto, cerrarMenu }) {
  const { usuario } = useAuth();
  
  // 1. Función para limpiar el rol que viene de la base de datos
  const limpiarTexto = (texto) => {
    if (!texto) return '';
    return texto.replace(/‚/g, 'é'); // Arreglamos el Biom‚dicos
  };

  // 2. Aplicamos la limpieza al rol del usuario antes de compararlo
  const rolUsuario = limpiarTexto(usuario?.rol || '');

  const menuItems = [
    {
      nombre: 'Dashboard',
      ruta: '/dashboard',
      rolesPermitidos: ['Sistemas', 'Operaciones', 'Biomédicos', 'Encargado de almacén', 'Almacén'],
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
        </svg>
      )
    },
    {
      nombre: 'Bandeja Remisiones',
      ruta: '/remisiones',
      rolesPermitidos: ['Sistemas', 'Operaciones', 'Biomédicos', 'Encargado de almacén'],
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      )
    },
    {
      nombre: 'Historial / Auditoría',
      ruta: '/historial-remisiones',
      rolesPermitidos: ['Sistemas', 'Operaciones'],
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      )
    },
    {
      nombre: 'Almacén Base',
      ruta: '/almacen',
      rolesPermitidos: ['Sistemas', 'Operaciones', 'Biomédicos', 'Encargado de almacén', 'Almacén'],
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
        </svg>
      )
    },
    {
      nombre: 'Catálogos',
      ruta: '/catalogos',
      rolesPermitidos: ['Sistemas', 'Operaciones'],
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
      )
    },
    // ==========================================
    // NUEVO MÓDULO: EFECTIVO
    // ==========================================
    {
      nombre: 'Reportar Efectivo',
      ruta: '/reportar-efectivo',
      rolesPermitidos: ['Sistemas', 'Operaciones', 'Biomédicos'],
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
      )
    },
    {
      nombre: 'Auditoría Efectivo',
      ruta: '/auditoria-efectivo',
      rolesPermitidos: ['Sistemas', 'Operaciones', 'Ventas'],
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
      )
    },
    // ==========================================
    // FIN NUEVO MÓDULO
    // ==========================================
    {
      nombre: 'Usuarios',
      ruta: '/usuarios',
      rolesPermitidos: ['Sistemas', 'Operaciones'],
      icono: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
      )
    }
  ];

  const menusVisibles = menuItems.filter(item => item.rolesPermitidos.includes(rolUsuario));

  return (
    <>
      {/* NUEVO: Fondo oscuro transparente en móviles para cerrar el menú */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity" 
          onClick={cerrarMenu}
        ></div>
      )}

      {/* NUEVO: Clases responsivas añadidas (fixed, md:relative, transform, translate) */}
      <aside className={`w-64 bg-oltech-black text-white flex flex-col h-full shadow-2xl z-30 fixed md:relative transform transition-transform duration-300 ease-in-out ${menuAbierto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        
        <div className="p-6 flex justify-center items-center border-b border-gray-800">
          <img 
            src={logoBlanco} 
            alt="OLTECH" 
            className="w-48 drop-shadow-md hover:scale-105 transition-transform duration-300" 
          />
        </div>

        {/* NUEVO: Se agregó overflow-y-auto para pantallas pequeñas */}
        <nav className="flex-1 py-8 space-y-2 px-4 overflow-y-auto">
          {menusVisibles.map((item) => (
            <NavLink
              key={item.nombre}
              to={item.ruta}
              onClick={cerrarMenu} // NUEVO: Cierra el menú al hacer clic en móvil
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-gray-800 border-l-4 border-oltech-pink text-white shadow-md' 
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white border-l-4 border-transparent' 
                }`
              }
            >
              {item.icono}
              <span className="font-medium tracking-wide">{item.nombre}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 text-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Grupo OLTECH</p>
          <p className="mt-1">Versión 1.0.0</p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;