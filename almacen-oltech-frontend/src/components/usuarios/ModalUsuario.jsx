//almacen-oltech-frontend/src/components/usuarios/ModalUsuario.jsx
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalUsuario({ isOpen, onClose, onUsuarioGuardado }) {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Estado inicial del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    apellido_p: '',
    apellido_m: '',
    user_name: '',
    contrasena: '',
    rol_id: '1', // Por defecto "Almacén"
    estado_usuario_id: 1 // Siempre nacen "Activos" (1)
  });

  // Si el modal está cerrado, no dibujamos nada en la pantalla
  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      // Mandamos los datos al backend asegurándonos de que los IDs sean números
      await axios.post('http://localhost:4000/api/usuarios', {
        ...formData,
        rol_id: parseInt(formData.rol_id)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Si todo sale bien, avisamos a la tabla que recargue y cerramos la ventana
      onUsuarioGuardado(); 
      onClose();
    } catch (err) {
      if (err.response && err.response.data.mensaje) {
        setError(err.response.data.mensaje);
      } else {
        setError('Error al guardar el usuario. Revisa tu conexión.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado del Modal */}
        <div className="bg-oltech-black px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Registrar Nuevo Usuario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none" placeholder="Ej. Juan" />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Paterno *</label>
              <input type="text" name="apellido_p" required value={formData.apellido_p} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none" placeholder="Ej. Pérez" />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido Materno</label>
              <input type="text" name="apellido_m" value={formData.apellido_m} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none" placeholder="Opcional" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario *</label>
              <input type="text" name="user_name" required value={formData.user_name} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none" placeholder="Ej. Juan-Operaciones" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Inicial *</label>
              <input type="password" name="contrasena" required value={formData.contrasena} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none" placeholder="••••••••" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rol en el Sistema *</label>
            <select name="rol_id" value={formData.rol_id} onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none bg-white">
              <option value="1">Almacén (Operativo básico)</option>
              <option value="5">Encargado de almacén (Supervisión y Remisiones)</option>
              <option value="2">Biomédicos (Crear Remisiones)</option>
              <option value="3">Operaciones (Auditoría Total)</option>
              <option value="4">Sistemas (Administración IT)</option>
              <option value="6">Ventas (Auditoría de Efectivo)</option>
            </select>
          </div>

          {/* Botones de acción */}
          <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={cargando}
              className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={cargando}
              className="px-6 py-2 bg-oltech-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 flex items-center">
              {cargando ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ModalUsuario;