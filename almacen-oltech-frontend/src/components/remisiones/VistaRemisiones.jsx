// almacen-oltech-frontend/src/components/remisiones/VistaRemisiones.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import Buscador from '../almacen/Buscador';
import ModalNuevaRemision from './ModalNuevaRemision';
import ModalContestarRemision from './ModalContestarRemision';

function VistaRemisiones() {
  const { token, usuario } = useAuth();
  const [remisiones, setRemisiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [modalConciliarAbierto, setModalConciliarAbierto] = useState(false);
const [remisionAConciliarId, setRemisionAConciliarId] = useState(null);

  // Cargar todas las remisiones desde el backend
  const cargarRemisiones = async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await axios.get('http://localhost:4000/api/remisiones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRemisiones(respuesta.data);
    } catch (err) {
      console.error('Error al cargar remisiones:', err);
      setError('No se pudieron cargar las remisiones.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRemisiones();
  }, [token]);

  // Filtro inteligente para las tarjetas
  const remisionesFiltradas = remisiones.filter(r => 
    (r.no_solicitud && r.no_solicitud.toLowerCase().includes(busqueda.toLowerCase())) ||
    (r.paciente && r.paciente.toLowerCase().includes(busqueda.toLowerCase())) ||
    (r.unidad_medica_nombre && r.unidad_medica_nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
    (r.medico_nombre && r.medico_nombre.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Función auxiliar para dar color a la tarjeta según el estado
  const getColorEstado = (nombreEstado) => {
    if (!nombreEstado) return 'bg-gray-100 text-gray-700 border-gray-200';
    const estado = nombreEstado.toLowerCase();
    if (estado.includes('proceso') || estado.includes('calle') || estado.includes('pendiente')) {
      return 'bg-amber-50 text-amber-700 border-amber-200'; // Amarillo/Naranja para las que no han regresado
    }
    if (estado.includes('completad') || estado.includes('cerrad')) {
      return 'bg-green-50 text-green-700 border-green-200'; // Verde para las ya conciliadas
    }
    if (estado.includes('cancelad')) {
      return 'bg-red-50 text-red-700 border-red-200'; // Rojo para las canceladas
    }
    return 'bg-blue-50 text-oltech-blue border-blue-200';
  };

  // Función para formatear fechas (de YYYY-MM-DD a DD/MMM/YYYY)
  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones).toUpperCase();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Barra Superior */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <span>📋</span>
            <span>Bandeja de Remisiones</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Control de despachos a cirugía y retornos de material.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
          <Buscador 
            valor={busqueda} 
            onBuscar={setBusqueda} 
            placeholder="Buscar solicitud, paciente, hospital..." 
          />
          <button 
            onClick={() => setModalNuevoAbierto(true)}
            className="w-full sm:w-auto bg-oltech-pink text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-pink-700 transition-colors shadow-md flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            <span>Nueva Remisión</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 font-medium">
          {error}
        </div>
      )}

      {/* Grid de Tarjetas de Remisión */}
      {cargando ? (
        <div className="p-20 text-center flex flex-col items-center justify-center bg-white rounded-xl border border-gray-100">
          <svg className="animate-spin h-10 w-10 text-oltech-pink mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p className="text-gray-500 font-medium">Cargando bandeja de remisiones...</p>
        </div>
      ) : remisionesFiltradas.length === 0 ? (
        <div className="p-20 text-center bg-white rounded-xl border border-gray-100 border-dashed">
          <p className="text-gray-500 font-medium text-lg">No se encontraron remisiones.</p>
          <p className="text-gray-400 text-sm mt-1">Crea una nueva remisión para que aparezca aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {remisionesFiltradas.map((rem) => (
            <div key={rem.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              
              {/* Cabecera de la Tarjeta */}
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                <div>
                  <span className="inline-block px-2.5 py-1 bg-oltech-black text-white text-xs font-bold rounded shadow-sm tracking-wide">
                    {rem.no_solicitud || `PENDIENTE-${rem.id}`}
                  </span>
                  <div className="text-xs text-gray-500 mt-2 font-medium flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    CX: <span className="ml-1 text-gray-700 font-bold">{formatearFecha(rem.fecha_cirugia)}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getColorEstado(rem.estado_nombre)} text-center text-wrap w-24 leading-tight`}>
                  {rem.estado_nombre || 'Desconocido'}
                </span>
              </div>

              {/* Cuerpo de la Tarjeta */}
              <div className="p-5 flex-1 space-y-4">
                
                {/* Paciente y Procedimiento */}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Paciente</p>
                  <p className="text-sm font-bold text-gray-800 line-clamp-1">{rem.paciente || 'Sin registro'}</p>
                  <p className="text-xs font-medium text-oltech-pink mt-1 line-clamp-1">{rem.procedimiento_nombre || 'Procedimiento no especificado'}</p>
                </div>

                {/* Hospital y Médico */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Hospital</p>
                    <p className="text-xs font-semibold text-gray-700 line-clamp-2 leading-snug">{rem.unidad_medica_nombre || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Médico</p>
                    <p className="text-xs font-semibold text-gray-700 line-clamp-2 leading-snug">{rem.medico_nombre || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Pie de la Tarjeta (Botón de Acción) */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0">
              <button 
               onClick={() => {
                 setRemisionAConciliarId(rem.id);
                 setModalConciliarAbierto(true);
               }}
               className="w-full py-2 bg-white border border-gray-200 text-oltech-blue font-bold text-sm rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors flex justify-center items-center space-x-2"
             >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  <span>Ver / Conciliar</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* MODAL PARA CREAR REMISIÓN */}
      <ModalNuevaRemision 
        isOpen={modalNuevoAbierto} 
        onClose={() => setModalNuevoAbierto(false)} 
        onGuardado={cargarRemisiones} 
      />

      <ModalContestarRemision 
     isOpen={modalConciliarAbierto}
     onClose={() => {
       setModalConciliarAbierto(false);
       setRemisionAConciliarId(null);
     }}
     remisionId={remisionAConciliarId}
     onGuardado={cargarRemisiones}
   />

    </div>
  );
}

export default VistaRemisiones;