// almacen-oltech-frontend/src/components/usuarios/ModalUsuario.jsx
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
      {/* RESPONSIVO: flex-col y max-h-[90vh] para garantizar que se pueda hacer scroll si la pantalla es muy pequeña */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado del Modal */}
        {/* RESPONSIVO: Reducción de padding en móvil (px-4 py-3) */}
        <div className="bg-oltech-black px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white">Registrar Nuevo Usuario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5 sm:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        {/* RESPONSIVO: overflow-y-auto para permitir scroll interno en móviles y reducción de space-y */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-md">
              <p className="text-xs sm:text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* RESPONSIVO: Reducción del gap en móviles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
          {/* RESPONSIVO: flex-col-reverse apila los botones en móvil (Guardar arriba, Cancelar abajo) y w-full */}
          <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 mt-auto">
            <button type="button" onClick={onClose} disabled={cargando}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center">
              Cancelar
            </button>
            <button type="submit" disabled={cargando}
              className="w-full sm:w-auto px-6 py-2.5 bg-oltech-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 flex items-center justify-center">
              {cargando ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ModalUsuario;