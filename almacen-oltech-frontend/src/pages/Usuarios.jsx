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
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Administra los accesos, roles y sedes del personal de OLTECH.</p>
        </div>
        
        <button 
          className="mt-4 sm:mt-0 w-full sm:w-auto bg-oltech-black text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center space-x-2"
          onClick={() => setModalCrearAbierto(true)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span>Nuevo Usuario</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm sm:text-base font-medium">
          {error}
        </div>
      )}

      {/* 2. La Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px] flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b-2 border-gray-200 text-gray-700 text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap">
                <th className="p-3 sm:p-4 font-bold border-r border-gray-100">Nombre Completo</th>
                <th className="p-3 sm:p-4 font-bold border-r border-gray-100">Usuario</th>
                <th className="p-3 sm:p-4 font-bold border-r border-gray-100 w-48">Roles</th>
                <th className="p-3 sm:p-4 font-bold border-r border-gray-100 w-32">Sede(s)</th>
                <th className="p-3 sm:p-4 font-bold border-r border-gray-100 text-center w-28">Estado</th>
                <th className="p-3 sm:p-4 font-bold text-center w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-500">
                    <svg className="animate-spin h-8 w-8 mx-auto text-oltech-pink mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm sm:text-base font-medium">Cargando usuarios...</span>
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-500 text-sm sm:text-base bg-gray-50/50 font-medium">
                    No hay usuarios registrados en el sistema.
                  </td>
                </tr>
              ) : (
                usuarios.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-3 sm:p-4 whitespace-nowrap border-r border-gray-100">
                      <div className="font-bold text-gray-900 text-sm sm:text-base">{user.nombre} {user.apellido_p} {user.apellido_m || ''}</div>
                    </td>
                    <td className="p-3 sm:p-4 text-gray-600 text-sm sm:text-base whitespace-nowrap border-r border-gray-100 font-medium">
                      {user.user_name}
                    </td>
                    
                    {/* NUEVO: Mapeo de múltiples roles */}
                    <td className="p-3 sm:p-4 border-r border-gray-100">
                      <div className="flex flex-wrap gap-1">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((rol, idx) => (
                            <span key={idx} className="bg-oltech-blue/10 text-oltech-blue px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold tracking-wide border border-oltech-blue/20 uppercase shadow-sm">
                              {rol}
                            </span>
                          ))
                        ) : (
                          <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold tracking-wide border border-gray-200 uppercase shadow-sm">
                            {user.rol_nombre || 'Sin Rol'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* NUEVO: Mapeo de múltiples sedes */}
                    <td className="p-3 sm:p-4 border-r border-gray-100">
                      <div className="flex flex-wrap gap-1">
                        {user.sedes && user.sedes.length > 0 ? (
                          user.sedes.map((sede, idx) => (
                            <span key={idx} className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold tracking-wide border border-purple-200 uppercase shadow-sm">
                              Unidad {sede.unidad_medica_id}
                            </span>
                          ))
                        ) : (
                          <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold tracking-wide border border-gray-200 uppercase shadow-sm">
                            Nacional
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 sm:p-4 whitespace-nowrap border-r border-gray-100 text-center">
                      <span className={`px-2.5 py-1 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border shadow-sm ${
                        user.estado_nombre === 'Activo' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {user.estado_nombre}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-center">
                      <button 
                        onClick={() => handleAbrirEdicion(user)}
                        className="text-gray-400 hover:text-oltech-pink transition-colors p-2 rounded-lg hover:bg-pink-50 border border-transparent hover:border-pink-100"
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