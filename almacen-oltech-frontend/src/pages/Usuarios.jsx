// almacen-oltech-frontend/src/pages/Usuarios.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import ModalUsuario from '../components/usuarios/ModalUsuario';
import ModalEditarUsuario from '../components/usuarios/ModalEditarUsuario';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para los modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null); 
  
  const { token } = useAuth();

  const cargarUsuarios = async () => {
    try {
      const respuesta = await axios.get('http://localhost:4000/api/usuarios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(respuesta.data);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('No se pudo cargar la lista de usuarios. Revisa tu conexión.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const handleAbrirEdicion = (usuario) => {
    setUsuarioEditando(usuario);
    setModalEditarAbierto(true);
  };

  return (
    // RESPONSIVO: Ajustamos el margen vertical (space-y-4 en móvil, space-y-6 en PC)
    <div className="space-y-4 sm:space-y-6">
      
      {/* 1. Encabezado */}
      {/* RESPONSIVO: Reducción de padding en móviles (p-4) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="w-full sm:w-auto">
          {/* RESPONSIVO: Ajuste del tamaño del título */}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Administra los accesos y roles del personal de OLTECH.</p>
        </div>
        
        {/* RESPONSIVO: Botón w-full en móviles para mejor toque, centrado de contenido */}
        <button 
          className="mt-4 sm:mt-0 w-full sm:w-auto bg-oltech-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center space-x-2"
          onClick={() => setModalCrearAbierto(true)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* 2. La Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* RESPONSIVO: whitespace-nowrap evita que las columnas se aplasten en móvil */}
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap">
                <th className="p-3 sm:p-4 font-semibold">Nombre Completo</th>
                <th className="p-3 sm:p-4 font-semibold">Usuario</th>
                <th className="p-3 sm:p-4 font-semibold">Rol</th>
                <th className="p-3 sm:p-4 font-semibold">Estado</th>
                <th className="p-3 sm:p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    <svg className="animate-spin h-8 w-8 mx-auto text-oltech-pink mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm sm:text-base">Cargando usuarios...</span>
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 text-sm sm:text-base">
                    No hay usuarios registrados en el sistema.
                  </td>
                </tr>
              ) : (
                usuarios.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    {/* RESPONSIVO: p-3 en móvil, p-4 en PC, y whitespace-nowrap */}
                    <td className="p-3 sm:p-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">{user.nombre} {user.apellido_p} {user.apellido_m || ''}</div>
                    </td>
                    <td className="p-3 sm:p-4 text-gray-600 text-sm sm:text-base whitespace-nowrap">{user.user_name}</td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">
                      <span className="bg-blue-50 text-blue-700 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide border border-blue-100">
                        {user.rol_nombre}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide border ${
                        user.estado_nombre === 'Activo' 
                          ? 'bg-green-50 text-green-700 border-green-100' 
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {user.estado_nombre}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-center">
                      <button 
                        onClick={() => handleAbrirEdicion(user)}
                        className="text-gray-400 hover:text-oltech-pink transition-colors p-2 rounded-full hover:bg-red-50"
                        title="Editar Usuario"
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Los Modales */}
      <ModalUsuario 
        isOpen={modalCrearAbierto} 
        onClose={() => setModalCrearAbierto(false)} 
        onUsuarioGuardado={cargarUsuarios} 
      />

      <ModalEditarUsuario 
        isOpen={modalEditarAbierto} 
        onClose={() => setModalEditarAbierto(false)} 
        onUsuarioActualizado={cargarUsuarios} 
        usuarioEditando={usuarioEditando}
      />

    </div>
  );
}

export default Usuarios;