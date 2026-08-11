// almacen-oltech-frontend/src/components/usuarios/ModalUsuario.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalUsuario({ isOpen, onClose, onUsuarioGuardado }) {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Catálogos dinámicos
  const [catalogoRoles, setCatalogoRoles] = useState([]);
  const [catalogoHospitales, setCatalogoHospitales] = useState([]);

  // Estado inicial del formulario adaptado para Múltiples Roles y Sedes
  const [formData, setFormData] = useState({
    nombre: '',
    apellido_p: '',
    apellido_m: '',
    user_name: '',
    contrasena: '',
    roles: [], // Array de IDs de roles seleccionados
    sedes: [], // Array con el objeto sede { ciudad_id, unidad_medica_id }
    estado_usuario_id: 1 
  });

  // Cargar catálogos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarCatalogos();
    }
  }, [isOpen, token]);

  const cargarCatalogos = async () => {
    try {
      // Necesitamos crear un endpoint de roles si no existe, o podemos cablearlos temporalmente.
      // Asumiremos que creaste un GET /api/usuarios/roles en el backend. 
      // Por seguridad y rapidez, los dejaremos cableados aquí como lo tenías, pero en formato de array para iterar:
      const rolesBD = [
        { id: 1, nombre: 'Almacén' },
        { id: 5, nombre: 'Encargado de almacén' },
        { id: 2, nombre: 'Biomédicos' },
        { id: 7, nombre: 'Cotizaciones' },
        { id: 3, nombre: 'Operaciones' },
        { id: 4, nombre: 'Sistemas' },
        { id: 6, nombre: 'Ventas' },
        { id: 8, nombre: 'Técnico' },       // NUEVO
        { id: 9, nombre: 'Coordinador' }    // NUEVO
      ];
      setCatalogoRoles(rolesBD);

      // Traemos las sedes desde el endpoint que ya tienes en remisiones
      const resHospitales = await axios.get('http://localhost:4000/api/remisiones/unidades-medicas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCatalogoHospitales(resHospitales.data);
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
    }
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejador para los Checkboxes de Roles
  const handleRolToggle = (rolId) => {
    setFormData((prev) => {
      const rolesSeleccionados = prev.roles.includes(rolId)
        ? prev.roles.filter((id) => id !== rolId) // Quitar si ya estaba
        : [...prev.roles, rolId]; // Agregar si no estaba
      return { ...prev, roles: rolesSeleccionados };
    });
  };

  // Manejador para el Selector de Hospital
  const handleSedeChange = (e) => {
    const unidadId = e.target.value;
    if (!unidadId) {
      setFormData({ ...formData, sedes: [] }); // Acceso Nacional
      return;
    }

    const hospitalSeleccionado = catalogoHospitales.find(h => h.id === parseInt(unidadId));
    if (hospitalSeleccionado) {
      setFormData({
        ...formData,
        sedes: [{ 
          unidad_medica_id: hospitalSeleccionado.id, 
          ciudad_id: hospitalSeleccionado.ciudad_id 
        }]
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.roles.length === 0) {
        setError('Debes seleccionar al menos un Rol en el Sistema para el usuario.');
        return;
    }

    setCargando(true);

    try {
      await axios.post('http://localhost:4000/api/usuarios', {
        ...formData,
        rol_id: formData.roles[0] // Mandamos el primero como principal para compatibilidad con código legacy
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="bg-oltech-black px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white">Registrar Nuevo Usuario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5 sm:w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-md">
              <p className="text-xs sm:text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre *</label>
              <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none" placeholder="Ej. Juan" />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Apellido Paterno *</label>
              <input type="text" name="apellido_p" required value={formData.apellido_p} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none" placeholder="Ej. Pérez" />
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-bold text-gray-700 mb-1">Apellido Materno</label>
              <input type="text" name="apellido_m" value={formData.apellido_m} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none" placeholder="Opcional" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre de Usuario *</label>
              <input type="text" name="user_name" required value={formData.user_name} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none font-mono text-sm" placeholder="Ej. Juan-Operaciones" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña Inicial *</label>
              <input type="password" name="contrasena" required value={formData.contrasena} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none font-mono text-sm" placeholder="••••••••" />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-black text-oltech-blue mb-3 uppercase tracking-wide">Permisos y Ubicación</label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* CHECKBOXES DE ROLES */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="block text-xs font-bold text-gray-500 mb-3 uppercase">Múltiples Roles del Sistema *</label>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                        {catalogoRoles.map(rol => (
                            <label key={rol.id} className="flex items-center space-x-2 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={formData.roles.includes(rol.id)}
                                    onChange={() => handleRolToggle(rol.id)}
                                    className="w-4 h-4 text-oltech-pink bg-white border-gray-300 rounded focus:ring-oltech-pink"
                                />
                                <span className="text-xs font-semibold text-gray-700 group-hover:text-oltech-pink transition-colors">{rol.nombre}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* SELECTOR DE SEDE / HOSPITAL */}
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <label className="block text-xs font-bold text-blue-500 mb-3 uppercase">Asignación Geográfica</label>
                    <p className="text-[10px] text-gray-500 mb-3 font-medium leading-tight">
                        Si seleccionas un hospital, el usuario <strong>solo podrá ver el inventario y remisiones de esa sede.</strong> Déjalo en "Acceso Nacional" para personal administrativo.
                    </p>
                    <select 
                        onChange={handleSedeChange}
                        value={formData.sedes.length > 0 ? formData.sedes[0].unidad_medica_id : ''}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-blue outline-none bg-white text-xs font-bold text-gray-800"
                    >
                        <option value="">🌎 Acceso Nacional (Ver todo)</option>
                        {catalogoHospitales.map(h => (
                            <option key={h.id} value={h.id}>🏥 {h.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 mt-auto">
            <button type="button" onClick={onClose} disabled={cargando}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center">
              Cancelar
            </button>
            <button type="submit" disabled={cargando}
              className="w-full sm:w-auto px-6 py-2.5 bg-oltech-black text-white rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-70 flex items-center justify-center shadow-md">
              {cargando ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ModalUsuario;