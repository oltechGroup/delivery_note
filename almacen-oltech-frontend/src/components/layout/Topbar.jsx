//almacen-oltech-frontend/src/components/layout/Topbar.jsx
import { useAuth } from '../../hooks/useAuth';

function Topbar() {
  // Extraemos la información del usuario y la función para salir directamente de nuestro hook
  const { usuario, logout } = useAuth();

  return (
    <header className="bg-white h-20 px-8 flex items-center justify-between shadow-sm border-b border-gray-200 z-10 w-full">
      
      {/* Lado izquierdo: Título (por ahora un texto genérico, luego podemos hacerlo dinámico) */}
      <div className="text-gray-500 font-medium tracking-wide">
        Panel de Administración
      </div>

      {/* Lado derecho: Perfil de usuario y botón de salir */}
      <div className="flex items-center space-x-6">
        
        {/* Info del Usuario */}
        <div className="flex items-center space-x-3 text-right">
          <div className="hidden sm:block"> {/* Se oculta en pantallas muy pequeñas */}
            <p className="text-sm font-bold text-gray-800">
              {usuario?.nombre} {usuario?.apellido_p}
            </p>
            <p className="text-xs font-bold text-oltech-pink uppercase tracking-widest">
              {usuario?.rol || 'Sistemas'}
            </p>
          </div>
          
          {/* Avatar genérico (Un circulito gris con un ícono de persona) */}
          <div className="h-10 w-10 rounded-full bg-gray-100 flex justify-center items-center border-2 border-oltech-blue shadow-sm">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
        </div>

        {/* Separador vertical */}
        <div className="h-8 w-px bg-gray-300"></div>

        {/* Botón Cerrar Sesión */}
        <button 
          onClick={logout}
          className="flex items-center space-x-2 text-gray-500 hover:text-oltech-pink transition-colors duration-200"
          title="Cerrar Sesión"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          <span className="font-medium hidden sm:block">Salir</span>
        </button>

      </div>
    </header>
  );
}

export default Topbar;