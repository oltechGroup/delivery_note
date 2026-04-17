// almacen-oltech-frontend/src/components/catalogos/ModalCatalogo.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalCatalogo({ isOpen, onClose, onGuardado, pestanaActiva, itemEditando }) {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  // Lista de unidades médicas (solo la usamos si estamos creando/editando un médico)
  const [unidades, setUnidades] = useState([]);

  // Estado unificado para todos los posibles campos
  const [formData, setFormData] = useState({
    nombre: '',
    nombre_completo: '',
    email: '',
    telefono: '',
    unidad_medica_id: ''
  });

  // Efecto 1: Cargar la lista de Hospitales (Unidades) si estamos en la pestaña de Médicos
  useEffect(() => {
    if (isOpen && pestanaActiva === 'medicos') {
      axios.get('http://localhost:4000/api/catalogos/unidades', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setUnidades(res.data))
      .catch(err => console.error("Error al cargar unidades:", err));
    }
  }, [isOpen, pestanaActiva, token]);

  // Efecto 2: Preparar el formulario (Limpiar si es Nuevo, Llenar si es Editar)
  useEffect(() => {
    if (isOpen) {
      if (itemEditando) {
        // Modo Edición
        setFormData({
          nombre: itemEditando.nombre || '',
          nombre_completo: itemEditando.nombre_completo || '',
          email: itemEditando.email || '',
          telefono: itemEditando.telefono || '',
          unidad_medica_id: itemEditando.unidad_medica_id || ''
        });
      } else {
        // Modo Nuevo
        setFormData({ nombre: '', nombre_completo: '', email: '', telefono: '', unidad_medica_id: '' });
      }
      setError('');
    }
  }, [isOpen, itemEditando]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    // 1. Decidir la URL base dependiendo de la pestaña
    let url = `http://localhost:4000/api/catalogos/${pestanaActiva}`;
    
    // Si estamos editando, le agregamos el ID a la URL
    if (itemEditando) {
      url += `/${itemEditando.id}`;
    }

    // 2. Decidir qué datos mandar dependiendo de la pestaña
    let datosAEnviar = {};
    if (pestanaActiva === 'medicos') {
      datosAEnviar = {
        nombre_completo: formData.nombre_completo,
        email: formData.email,
        telefono: formData.telefono,
        unidad_medica_id: formData.unidad_medica_id ? parseInt(formData.unidad_medica_id) : null
      };
    } else {
      datosAEnviar = { nombre: formData.nombre };
    }

    // 3. Hacer la petición (POST si es nuevo, PUT si es editar)
    try {
      if (itemEditando) {
        await axios.put(url, datosAEnviar, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(url, datosAEnviar, { headers: { Authorization: `Bearer ${token}` } });
      }
      
      onGuardado(); // Le avisamos a la tabla que recargue
      onClose();    // Cerramos el modal
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar el registro.');
    } finally {
      setCargando(false);
    }
  };

  // Textos dinámicos para el título
  const tituloModal = itemEditando ? 'Editar Registro' : 'Nuevo Registro';
  const subtituloModal = pestanaActiva === 'unidades' ? 'Unidad Médica' 
                         : pestanaActiva === 'medicos' ? 'Médico Especialista' 
                         : 'Procedimiento Quirúrgico';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      {/* RESPONSIVO: max-h-[90vh] y flex-col aseguran que el modal pueda escrollear si el teclado lo tapa */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado */}
        {/* RESPONSIVO: shrink-0 protege el header y ajuste de paddings */}
        <div className="bg-oltech-black px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{tituloModal}</h2>
            <p className="text-oltech-pink text-xs sm:text-sm font-medium">{subtituloModal}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors shrink-0 ml-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Formulario */}
        {/* RESPONSIVO: overflow-y-auto habilitado en el cuerpo del form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-md">
              <p className="text-xs sm:text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* CAMPOS DINÁMICOS DEPENDIENDO DE LA PESTAÑA */}
          
          {/* Si NO son médicos (es decir, Unidades o Procedimientos) */}
          {pestanaActiva !== 'medicos' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange}
                className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none text-base sm:text-sm" 
                placeholder={`Ej. ${pestanaActiva === 'unidades' ? 'Hospital Ángeles' : 'Artroscopia de rodilla'}`} 
              />
            </div>
          )}

          {/* Si SÍ son médicos */}
          {pestanaActiva === 'medicos' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
                <input type="text" name="nombre_completo" required value={formData.nombre_completo} onChange={handleChange}
                  className="w-full px-4 py-2.5 sm:py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none text-base sm:text-sm" placeholder="Ej. Dr. Juan Pérez" />
              </div>
              
              {/* RESPONSIVO: grid-cols-1 en móvil para que los campos no queden muy angostos, grid-cols-2 en PC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input type="text" name="telefono" value={formData.telefono} onChange={handleChange}
                    className="w-full px-4 py-2.5 sm:py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none text-base sm:text-sm" placeholder="Opcional" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    className="w-full px-4 py-2.5 sm:py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none text-base sm:text-sm" placeholder="Opcional" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hospital (Unidad Médica)</label>
                <select name="unidad_medica_id" value={formData.unidad_medica_id} onChange={handleChange}
                  className="w-full px-4 py-2.5 sm:py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none bg-white text-base sm:text-sm">
                  <option value="">-- Sin asignar --</option>
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Botones */}
          {/* RESPONSIVO: Apilado vertical (flex-col-reverse) en móviles, w-full para los botones */}
          <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 mt-auto">
            <button type="button" onClick={onClose} disabled={cargando}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors flex justify-center items-center">
              Cancelar
            </button>
            <button type="submit" disabled={cargando}
              className="w-full sm:w-auto px-6 py-2.5 bg-oltech-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 flex justify-center items-center">
              {cargando ? 'Guardando...' : 'Guardar Datos'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ModalCatalogo;