// almacen-oltech-frontend/src/pages/Catalogos.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import ModalCatalogo from '../components/catalogos/ModalCatalogo';

function Catalogos() {
  const { token } = useAuth();
  
  // Estados de la interfaz
  const [pestanaActiva, setPestanaActiva] = useState('unidades'); // unidades, medicos, procedimientos
  const [datos, setDatos] = useState([]); // Aquí guardamos lo que llegue del backend
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Control de ventanas flotantes
  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null); // Guardará si le diste clic al lapicito

  // Función para abrir el modal limpio (Nuevo)
  const handleNuevo = () => {
    setItemEditando(null);
    setModalAbierto(true);
  };

  // Función para abrir el modal con datos (Editar)
  const handleEditar = (item) => {
    setItemEditando(item);
    setModalAbierto(true);
  };

  // Función dinámica: Dependiendo de la pestaña, va a una ruta distinta del backend
  const cargarDatos = async () => {
    setCargando(true);
    setError('');
    setDatos([]); // Limpiamos la tabla mientras carga

    try {
      let endpoint = '';
      if (pestanaActiva === 'unidades') endpoint = 'http://localhost:4000/api/catalogos/unidades';
      else if (pestanaActiva === 'medicos') endpoint = 'http://localhost:4000/api/catalogos/medicos';
      else if (pestanaActiva === 'procedimientos') endpoint = 'http://localhost:4000/api/catalogos/procedimientos';

      const respuesta = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDatos(respuesta.data);
    } catch (err) {
      console.error('Error al cargar catálogo:', err);
      setError('No se pudieron cargar los datos. Revisa tu conexión.');
    } finally {
      setCargando(false);
    }
  };

  // Cada vez que cambias de pestaña, mandamos a traer los datos nuevos
  useEffect(() => {
    cargarDatos();
  }, [pestanaActiva]);

  // Nombres bonitos para el botón de "Agregar"
  const nombreBotonNuevo = 
    pestanaActiva === 'unidades' ? 'Nueva Unidad Médica' : 
    pestanaActiva === 'medicos' ? 'Nuevo Médico' : 'Nuevo Procedimiento';

  return (
    // RESPONSIVO: Ajuste del margen vertical global
    <div className="space-y-4 sm:space-y-6">
      
      {/* 1. Encabezado y Botón Principal */}
      {/* RESPONSIVO: p-4 en móvil, textos ajustados */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Catálogos del Sistema</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Administra los hospitales, médicos y procedimientos para tus remisiones.</p>
        </div>
        
        {/* RESPONSIVO: w-full y justify-center en móvil para mejor toque */}
        <button 
          className="mt-4 sm:mt-0 w-full sm:w-auto bg-oltech-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center space-x-2 shrink-0"
          onClick={handleNuevo} 
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span>{nombreBotonNuevo}</span>
        </button>
      </div>

      {/* 2. Las Pestañas (Tabs) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50 px-0 sm:px-6 pt-2 overflow-x-auto">
          <button 
            onClick={() => setPestanaActiva('unidades')}
            className={`py-3 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${pestanaActiva === 'unidades' ? 'border-oltech-pink text-oltech-pink' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            🏥 Unidades Médicas
          </button>
          <button 
            onClick={() => setPestanaActiva('medicos')}
            className={`py-3 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${pestanaActiva === 'medicos' ? 'border-oltech-pink text-oltech-pink' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            👨‍⚕️ Médicos
          </button>
          <button 
            onClick={() => setPestanaActiva('procedimientos')}
            className={`py-3 px-4 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${pestanaActiva === 'procedimientos' ? 'border-oltech-pink text-oltech-pink' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            ⚕️ Procedimientos Quirúrgicos
          </button>
        </div>

        {error && (
          <div className="p-3 sm:p-4 m-3 sm:m-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* 3. Área de la Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* RESPONSIVO: whitespace-nowrap para que las columnas no se aplasten */}
              <tr className="bg-white border-b border-gray-200 text-gray-500 text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap">
                <th className="p-3 sm:p-4 font-semibold w-16 text-center">ID</th>
                
                {/* Cabeceras dinámicas dependiendo de la pestaña */}
                {pestanaActiva === 'medicos' ? (
                  <>
                    <th className="p-3 sm:p-4 font-semibold">Nombre del Médico</th>
                    <th className="p-3 sm:p-4 font-semibold">Hospital (Unidad)</th>
                    <th className="p-3 sm:p-4 font-semibold">Contacto</th>
                  </>
                ) : (
                  <th className="p-3 sm:p-4 font-semibold">Nombre</th>
                )}
                
                <th className="p-3 sm:p-4 font-semibold text-center w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="5" className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">Cargando datos...</td>
                </tr>
              ) : datos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">
                    Aún no hay registros en este catálogo.
                  </td>
                </tr>
              ) : (
                datos.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 sm:p-4 text-center text-gray-500 font-medium text-xs sm:text-sm whitespace-nowrap">#{item.id}</td>
                    
                    {/* Filas dinámicas dependiendo de la pestaña */}
                    {pestanaActiva === 'medicos' ? (
                      <>
                        <td className="p-3 sm:p-4 font-medium text-gray-900 text-sm sm:text-base whitespace-nowrap">{item.nombre_completo}</td>
                        <td className="p-3 sm:p-4 text-gray-600 whitespace-nowrap">
                          <span className="bg-blue-50 text-blue-700 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold border border-blue-100">
                            {item.unidad_medica_nombre || 'Sin asignar'}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-500 whitespace-nowrap">
                          {item.telefono && <div className="flex items-center space-x-1"><span>📞</span><span>{item.telefono}</span></div>}
                          {item.email && <div className="flex items-center space-x-1 mt-1"><span>✉️</span><span>{item.email}</span></div>}
                          {(!item.telefono && !item.email) && <span className="italic text-gray-400">Sin datos</span>}
                        </td>
                      </>
                    ) : (
                      <td className="p-3 sm:p-4 font-medium text-gray-900 text-sm sm:text-base whitespace-nowrap">{item.nombre}</td>
                    )}

                    <td className="p-3 sm:p-4 text-center whitespace-nowrap">
                      <button 
                        onClick={() => handleEditar(item)}
                        className="text-gray-400 hover:text-oltech-blue transition-colors p-2 rounded-full hover:bg-blue-50"
                        title="Editar Registro"
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

      <ModalCatalogo 
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardado={cargarDatos}
        pestanaActiva={pestanaActiva}
        itemEditando={itemEditando}
      />

    </div>
  );
}

export default Catalogos;