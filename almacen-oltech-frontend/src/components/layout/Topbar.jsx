// almacen-oltech-frontend/src/components/layout/Topbar.jsx
import { useState } from 'react'; 
import { useAuth } from '../../hooks/useAuth';
import ModalCambiarContrasena from '../usuarios/ModalCambiarContrasena'; 

// NUEVO: Recibimos la prop abrirMenu desde el Layout
function Topbar({ abrirMenu }) {
  const { usuario, logout } = useAuth();
  
  const [modalContrasenaAbierto, setModalContrasenaAbierto] = useState(false);

  const limpiarTexto = (texto) => {
    if (!texto) return '';
    return texto.replace(/‚/g, 'é');
  };

  const obtenerColorRol = (rolName) => {
    const rolLimpio = limpiarTexto(rolName);
    switch (rolLimpio) {
      case 'Sistemas':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Operaciones':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Encargado de almacén':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Biomédicos':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Almacén':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-oltech-pink/10 text-oltech-pink border-oltech-pink/20'; 
    }
  };

  const rolMostrado = limpiarTexto(usuario?.rol || 'Sistemas');
  const badgeClasses = obtenerColorRol(usuario?.rol);

  return (
    <>
      {/* NUEVO: Ajustamos el padding horizontal en móviles (px-4) y escritorio (sm:px-8) */}
      <header className="bg-white h-20 px-4 sm:px-8 flex items-center justify-between shadow-sm border-b border-gray-200 z-10 w-full relative">
        
        {/* Agrupamos el botón hamburguesa y el título */}
        <div className="flex items-center space-x-3">
          {/* NUEVO: Botón de menú hamburguesa visible solo en móviles */}
          <button
            onClick={abrirMenu}
            className="md:hidden p-2 -ml-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-oltech-pink transition-colors"
            title="Abrir menú"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* NUEVO: Ocultamos el texto en pantallas muy pequeñas para evitar que se encime */}
          <div className="text-gray-500 font-medium tracking-wide hidden sm:block">
            Panel de Administración
          </div>
        </div>

        {/* NUEVO: Ajustamos el espaciado entre los elementos de la derecha en móviles */}
        <div className="flex items-center space-x-3 sm:space-x-6">
          
          <div className="flex items-center space-x-3 text-right">
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-800">
                {usuario?.nombre} {usuario?.apellido_p}
              </p>
              <div className="mt-1 flex justify-end">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border shadow-sm ${badgeClasses}`}>
                  {rolMostrado}
                </span>
              </div>
            </div>
            
            <div 
              onClick={() => setModalContrasenaAbierto(true)}
              className="h-10 w-10 rounded-full bg-gray-50 flex justify-center items-center border-2 border-gray-200 shadow-sm transition-transform hover:scale-105 cursor-pointer hover:border-oltech-pink shrink-0"
              title="Cambiar Mi Contraseña"
            >
              <svg className="w-5 h-5 text-gray-400 hover:text-oltech-pink transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
          </div>

          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

          <button 
            onClick={logout}
            className="flex items-center space-x-2 text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 group shrink-0"
            title="Cerrar Sesión"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            <span className="font-medium hidden sm:block">Salir</span>
          </button>

        </div>
      </header>

      <ModalCambiarContrasena 
        isOpen={modalContrasenaAbierto} 
        onClose={() => setModalContrasenaAbierto(false)} 
      />
    </>
  );
}

export default Topbar;