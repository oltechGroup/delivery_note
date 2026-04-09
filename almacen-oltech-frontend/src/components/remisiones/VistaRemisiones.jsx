// almacen-oltech-frontend/src/components/remisiones/VistaRemisiones.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import Buscador from '../almacen/Buscador';
import ModalContestarRemision from './ModalContestarRemision';
import PDFRemisionSoloLectura from './PDFRemisionSoloLectura'; 

function VistaRemisiones() {
  const { token } = useAuth();
  const navigate = useNavigate(); 
  
  const [remisiones, setRemisiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  
  const [modalConciliarAbierto, setModalConciliarAbierto] = useState(false);
  const [remisionAConciliarId, setRemisionAConciliarId] = useState(null);

  const [pdfAbierto, setPdfAbierto] = useState(false);
  const [remisionParaImprimir, setRemisionParaImprimir] = useState(null);

  // NUEVO: Estados para la paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 12; // Mostramos 12 tarjetas (cabrán 4 filas de 3 en pantallas grandes)

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

  // NUEVO: Si el usuario escribe en el buscador, lo regresamos a la página 1
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  // PASO 1: Filtrar todas las remisiones según la búsqueda
  const remisionesFiltradas = remisiones.filter(r => 
    (r.no_solicitud && r.no_solicitud.toLowerCase().includes(busqueda.toLowerCase())) ||
    (r.paciente && r.paciente.toLowerCase().includes(busqueda.toLowerCase())) ||
    (r.unidad_medica_nombre && r.unidad_medica_nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
    (r.medico_nombre && r.medico_nombre.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // PASO 2: Paginar SOLAMENTE las remisiones que ya pasaron el filtro
  const totalPaginas = Math.ceil(remisionesFiltradas.length / ITEMS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const remisionesPaginadas = remisionesFiltradas.slice(indiceInicio, indiceInicio + ITEMS_POR_PAGINA);

  // Función auxiliar para dar color a la tarjeta según el estado
  const getColorEstado = (nombreEstado) => {
    if (!nombreEstado) return 'bg-gray-100 text-gray-700 border-gray-200';
    const estado = nombreEstado.toLowerCase();
    if (estado.includes('proceso') || estado.includes('calle') || estado.includes('pendiente')) {
      return 'bg-amber-50 text-amber-700 border-amber-200'; 
    }
    if (estado.includes('finalizada') || estado.includes('completad') || estado.includes('cerrad')) {
      return 'bg-green-50 text-green-700 border-green-200'; 
    }
    if (estado.includes('cancelad')) {
      return 'bg-red-50 text-red-700 border-red-200'; 
    }
    return 'bg-blue-50 text-oltech-blue border-blue-200';
  };

  // Función para formatear fechas (de YYYY-MM-DD a DD/MMM/YYYY)
  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones).toUpperCase();
  };

  const handleAbrirImpresion = (remision) => {
    setRemisionParaImprimir(remision);
    setPdfAbierto(true);
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
            onClick={() => navigate('/nueva-remision')}
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

      {/* CONTENEDOR PRINCIPAL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Encabezado del contenedor de tarjetas */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Remisiones Recientes</h3>
          <span className="bg-oltech-blue text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {remisionesFiltradas.length} encontradas
          </span>
        </div>

        {/* Grid de Tarjetas de Remisión */}
        <div className="flex-1 p-6 bg-gray-50/30">
          {cargando ? (
            <div className="h-full flex flex-col items-center justify-center">
              <svg className="animate-spin h-10 w-10 text-oltech-pink mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="text-gray-500 font-medium">Cargando bandeja de remisiones...</p>
            </div>
          ) : remisionesFiltradas.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-10">
              <p className="text-gray-500 font-medium text-lg">No se encontraron remisiones.</p>
              <p className="text-gray-400 text-sm mt-1">Prueba con otra búsqueda o crea una nueva remisión.</p>
            </div>
          ) : (
            // NUEVO: Usamos remisionesPaginadas en lugar de remisionesFiltradas
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {remisionesPaginadas.map((rem) => {
                // ACTUALIZADO: Buscamos explícitamente "finalizada"
                const estaCompletada = rem.estado_nombre?.toLowerCase().includes('finalizada') || rem.estado_nombre?.toLowerCase().includes('completad') || rem.estado_nombre?.toLowerCase().includes('cerrad');
                
                return (
                  <div key={rem.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-oltech-blue transition-all flex flex-col">
                    
                    {/* Cabecera de la Tarjeta */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                      <div>
                        <span className="inline-block px-2.5 py-1 bg-oltech-black text-white text-xs font-bold rounded shadow-sm tracking-wide">
                          {rem.no_solicitud || `PENDIENTE-${rem.id}`}
                        </span>
                        <div className="text-xs text-gray-500 mt-2 font-medium flex items-center">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          CX: <span className="ml-1 text-gray-700 font-bold">{formatearFecha(rem.fecha_cirugia)}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getColorEstado(rem.estado_nombre)} text-center text-wrap w-24 leading-tight shadow-sm`}>
                        {rem.estado_nombre || 'Desconocido'}
                      </span>
                    </div>

                    {/* Cuerpo de la Tarjeta */}
                    <div className="p-5 flex-1 space-y-4">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-0.5 flex items-center"><svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> Paciente</p>
                        <p className="text-sm font-bold text-gray-800 line-clamp-1">{rem.paciente || 'Sin registro'}</p>
                        <p className="text-xs font-medium text-oltech-pink mt-1 line-clamp-1">{rem.procedimiento_nombre || 'Procedimiento no especificado'}</p>
                      </div>

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

                    {/* Pie de la Tarjeta */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0 flex space-x-2">
                      <button 
                        onClick={() => {
                          setRemisionAConciliarId(rem.id);
                          setModalConciliarAbierto(true);
                        }}
                        className="flex-1 py-2 bg-white border border-gray-200 text-oltech-blue font-bold text-sm rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors flex justify-center items-center space-x-1.5 shadow-sm"
                      >
                        {estaCompletada ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                        )}
                        <span>{estaCompletada ? 'Ver Resumen' : 'Conciliar'}</span>
                      </button>

                      <button 
                        onClick={() => handleAbrirImpresion(rem)}
                        className="px-3 py-2 bg-white border border-gray-200 text-gray-500 hover:text-oltech-black rounded-lg hover:bg-gray-100 transition-colors flex justify-center items-center shadow-sm"
                        title={estaCompletada ? "Imprimir Formato con Consumos" : "Reimprimir Formato de Salida"}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* NUEVO: CONTROLES DE PAGINACIÓN */}
        {!cargando && totalPaginas > 1 && (
          <div className="bg-white px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between shrink-0">
            <span className="text-sm text-gray-500 font-medium mb-4 sm:mb-0">
              Mostrando página <span className="font-bold text-oltech-black">{paginaActual}</span> de <span className="font-bold text-oltech-black">{totalPaginas}</span>
            </span>
            <div className="flex space-x-2">
              <button 
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                <span>Anterior</span>
              </button>
              <button 
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center space-x-1"
              >
                <span>Siguiente</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* MODAL DE CONCILIACIÓN */}
      <ModalContestarRemision 
        isOpen={modalConciliarAbierto}
        onClose={() => {
          setModalConciliarAbierto(false);
          setRemisionAConciliarId(null);
        }}
        remisionId={remisionAConciliarId}
        onGuardado={cargarRemisiones}
      />

      {/* MODAL DE REIMPRESIÓN */}
      {pdfAbierto && remisionParaImprimir && (
        <PDFRemisionSoloLectura
          remisionMaestra={remisionParaImprimir}
          onClose={() => {
            setPdfAbierto(false);
            setRemisionParaImprimir(null);
          }}
        />
      )}

    </div>
  );
}

export default VistaRemisiones;