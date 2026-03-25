//almacen-oltech-frontend/src/components/usuarios/ModalEditarUsuario.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalEditarUsuario({ isOpen, onClose, onUsuarioActualizado, usuarioEditando }) {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' }); // tipo puede ser 'error' o 'exito'
  const [pestanaActiva, setPestanaActiva] = useState('generales'); // pestañas: generales, estado, contrasena

  // Estados para los formularios
  const [formData, setFormData] = useState({
    nombre: '', apellido_p: '', apellido_m: '', user_name: '', rol_id: '1'
  });
  const [nuevoEstado, setNuevoEstado] = useState('1');
  const [nuevaContrasena, setNuevaContrasena] = useState('');

  // Efecto mágico: Cuando abres el modal y le pasas un usuario, rellenamos los campos automáticamente
  useEffect(() => {
    if (usuarioEditando && isOpen) {
      setFormData({
        nombre: usuarioEditando.nombre,
        apellido_p: usuarioEditando.apellido_p,
        apellido_m: usuarioEditando.apellido_m || '',
        user_name: usuarioEditando.user_name,
        rol_id: usuarioEditando.rol_id.toString()
      });
      setNuevoEstado(usuarioEditando.estado_usuario_id.toString());
      setNuevaContrasena('');
      setMensaje({ texto: '', tipo: '' });
      setPestanaActiva('generales'); // Siempre empezamos en la primera pestaña
    }
  }, [usuarioEditando, isOpen]);

  // Si el modal está cerrado o no hay usuario seleccionado, no dibujamos nada
  if (!isOpen || !usuarioEditando) return null;

  const handleCerrar = () => {
    setMensaje({ texto: '', tipo: '' });
    onClose();
  };

  // --- 1. Guardar Datos Generales ---
  const handleGuardarGenerales = async (e) => {
    e.preventDefault();
    setMensaje({ texto: '', tipo: '' });
    setCargando(true);
    try {
      await axios.put(`http://localhost:4000/api/usuarios/${usuarioEditando.id}`, {
        ...formData,
        rol_id: parseInt(formData.rol_id)
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setMensaje({ texto: 'Datos actualizados correctamente.', tipo: 'exito' });
      onUsuarioActualizado(); // Avisamos a la tabla que recargue
    } catch (err) {
      setMensaje({ texto: err.response?.data?.mensaje || 'Error al actualizar datos.', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  // --- 2. Guardar Nuevo Estado ---
  const handleGuardarEstado = async (e) => {
    e.preventDefault();
    setMensaje({ texto: '', tipo: '' });
    setCargando(true);
    try {
      await axios.patch(`http://localhost:4000/api/usuarios/${usuarioEditando.id}/estado`, {
        estado_usuario_id: parseInt(nuevoEstado)
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setMensaje({ texto: 'Estado actualizado correctamente.', tipo: 'exito' });
      onUsuarioActualizado();
    } catch (err) {
      setMensaje({ texto: err.response?.data?.mensaje || 'Error al cambiar estado.', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  // --- 3. Restablecer Contraseña ---
  const handleGuardarContrasena = async (e) => {
    e.preventDefault();
    if (nuevaContrasena.length < 6) {
      setMensaje({ texto: 'La contraseña debe tener al menos 6 caracteres.', tipo: 'error' });
      return;
    }
    setMensaje({ texto: '', tipo: '' });
    setCargando(true);
    try {
      await axios.patch(`http://localhost:4000/api/usuarios/${usuarioEditando.id}/contrasena`, {
        nueva_contrasena: nuevaContrasena
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setMensaje({ texto: 'Contraseña restablecida exitosamente.', tipo: 'exito' });
      setNuevaContrasena(''); // Limpiamos el campo por seguridad
    } catch (err) {
      setMensaje({ texto: err.response?.data?.mensaje || 'Error al cambiar contraseña.', tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado del Modal */}
        <div className="bg-oltech-black px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <svg className="w-5 h-5 text-oltech-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
            </svg>
            <span>Editar Usuario: {usuarioEditando.user_name}</span>
          </h2>
          <button onClick={handleCerrar} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Las Pestañas (Tabs) */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-2 space-x-4">
          <button 
            onClick={() => { setPestanaActiva('generales'); setMensaje({ texto: '', tipo: '' }); }}
            className={`py-3 px-4 font-medium text-sm transition-colors border-b-2 ${pestanaActiva === 'generales' ? 'border-oltech-pink text-oltech-pink' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Datos Generales
          </button>
          <button 
            onClick={() => { setPestanaActiva('estado'); setMensaje({ texto: '', tipo: '' }); }}
            className={`py-3 px-4 font-medium text-sm transition-colors border-b-2 ${pestanaActiva === 'estado' ? 'border-oltech-pink text-oltech-pink' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Estado de Acceso
          </button>
          <button 
            onClick={() => { setPestanaActiva('contrasena'); setMensaje({ texto: '', tipo: '' }); }}
            className={`py-3 px-4 font-medium text-sm transition-colors border-b-2 ${pestanaActiva === 'contrasena' ? 'border-oltech-pink text-oltech-pink' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Contraseña
          </button>
        </div>

        {/* Área de Mensajes (Éxito o Error) */}
        <div className="px-6 pt-4">
          {mensaje.texto && (
            <div className={`p-4 rounded-md border-l-4 text-sm font-medium ${mensaje.tipo === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
              {mensaje.texto}
            </div>
          )}
        </div>

        {/* Contenido de las pestañas */}
        <div className="p-6">
          
          {/* PESTAÑA 1: Datos Generales */}
          {pestanaActiva === 'generales' && (
            <form onSubmit={handleGuardarGenerales} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input type="text" name="nombre" required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none" />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno *</label>
                  <input type="text" name="apellido_p" required value={formData.apellido_p} onChange={(e) => setFormData({...formData, apellido_p: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none" />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
                  <input type="text" name="apellido_m" value={formData.apellido_m} onChange={(e) => setFormData({...formData, apellido_m: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario *</label>
                  <input type="text" name="user_name" required value={formData.user_name} onChange={(e) => setFormData({...formData, user_name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol en el Sistema *</label>
                  <select name="rol_id" value={formData.rol_id} onChange={(e) => setFormData({...formData, rol_id: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none bg-white">
                    <option value="1">Almacén (Operativo básico)</option>
                    <option value="5">Encargado de almacén (Supervisión y Remisiones)</option>
                    <option value="2">Biomédicos (Crear Remisiones)</option>
                    <option value="3">Operaciones (Auditoría Total)</option>
                    <option value="4">Sistemas (Administración IT)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button type="submit" disabled={cargando} className="px-6 py-2 bg-oltech-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-70">
                  {cargando ? 'Guardando...' : 'Actualizar Datos'}
                </button>
              </div>
            </form>
          )}

          {/* PESTAÑA 2: Estado */}
          {pestanaActiva === 'estado' && (
            <form onSubmit={handleGuardarEstado} className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Si cambias el estado a "Inactivo", el usuario no podrá iniciar sesión en el sistema, pero su historial de remisiones se mantendrá intacto por temas de auditoría.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado de la cuenta</label>
                <div className="flex space-x-4">
                  <label className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all ${nuevoEstado === '1' ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                    <input type="radio" name="estado" value="1" checked={nuevoEstado === '1'} onChange={(e) => setNuevoEstado(e.target.value)} className="sr-only" />
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${nuevoEstado === '1' ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}></div>
                      <span className="font-semibold text-green-700">Cuenta Activa</span>
                    </div>
                  </label>
                  
                  <label className={`flex-1 border rounded-lg p-4 cursor-pointer transition-all ${nuevoEstado === '2' ? 'border-red-500 bg-red-50 shadow-sm' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                    <input type="radio" name="estado" value="2" checked={nuevoEstado === '2'} onChange={(e) => setNuevoEstado(e.target.value)} className="sr-only" />
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full border-2 ${nuevoEstado === '2' ? 'border-red-500 bg-red-500' : 'border-gray-300'}`}></div>
                      <span className="font-semibold text-red-700">Cuenta Inactiva</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button type="submit" disabled={cargando} className="px-6 py-2 bg-oltech-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-70">
                  {cargando ? 'Guardando...' : 'Actualizar Estado'}
                </button>
              </div>
            </form>
          )}

          {/* PESTAÑA 3: Contraseña */}
          {pestanaActiva === 'contrasena' && (
            <form onSubmit={handleGuardarContrasena} className="space-y-6">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <p className="text-sm text-yellow-800">
                  Al restablecer la contraseña, el usuario deberá usar la nueva clave inmediatamente. Te recomendamos asignarle una contraseña temporal.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
                <input 
                  type="password" 
                  required 
                  value={nuevaContrasena} 
                  onChange={(e) => setNuevaContrasena(e.target.value)} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none" 
                  placeholder="Escribe la nueva clave..." 
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button type="submit" disabled={cargando || !nuevaContrasena} className="px-6 py-2 bg-oltech-pink text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-70">
                  {cargando ? 'Procesando...' : 'Restablecer Contraseña'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}

export default ModalEditarUsuario;