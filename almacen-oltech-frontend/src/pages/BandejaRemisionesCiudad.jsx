// almacen-oltech-frontend/src/pages/BandejaRemisionesCiudad.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import Buscador from '../components/almacen/Buscador';
// NUEVO: Importamos el modal de conciliación para la sede
import ModalContestarRemisionCiudad from '../components/remisiones/ModalContestarRemisionCiudad';

function BandejaRemisionesCiudad() {
  const { token, usuario } = useAuth();
  const navigate = useNavigate();

  const [remisiones, setRemisiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // NUEVO: Estados para controlar el modal de conciliación
  const [modalConciliarAbierto, setModalConciliarAbierto] = useState(false);
  const [remisionAConciliarId, setRemisionAConciliarId] = useState(null);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 15;

  // Normalizamos los roles del usuario para los permisos locales
  const limpiarTexto = (texto) => (texto ? texto.replace(/‚/g, 'é') : '');
  const rolesUsuario = Array.isArray(usuario?.roles) 
    ? usuario.roles.map(limpiarTexto) 
    : [limpiarTexto(usuario?.rol)].filter(Boolean);

  // Permisos según el nuevo enrutador de ciudad
  const puedeCrear = rolesUsuario.some(r => ['Sistemas', 'Técnico', 'Coordinador', 'Biomédicos'].includes(r));
  const puedeConciliar = rolesUsuario.some(r => ['Sistemas', 'Operaciones', 'Encargado de almacén', 'Coordinador'].includes(r));

  // Identificar la sede para la UI
  const sedeUsuario = usuario?.sedes && usuario.sedes.length > 0 
    ? usuario.sedes[0] 
    : null;

  const cargarRemisionesLocales = async () => {
    setCargando(true);
    setError('');
    try {
      // APUNTAMOS AL NUEVO ENDPOINT AISLADO GEOGRÁFICAMENTE
      const respuesta = await axios.get('http://localhost:4000/api/remisiones-ciudad', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRemisiones(respuesta.data);
    } catch (err) {
      console.error('Error al cargar remisiones de la sede:', err);
      setError('No se pudieron cargar las remisiones de tu unidad médica.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRemisionesLocales();
  }, [token]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  // Filtrado
  const remisionesFiltradas = remisiones.filter(r => 
    (r.no_solicitud && r.no_solicitud.toLowerCase().includes(busqueda.toLowerCase())) ||
    (r.paciente && r.paciente.toLowerCase().includes(busqueda.toLowerCase())) ||
    (r.procedimiento_nombre && r.procedimiento_nombre.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Paginación
  const totalPaginas = Math.ceil(remisionesFiltradas.length / ITEMS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const remisionesPaginadas = remisionesFiltradas.slice(indiceInicio, indiceInicio + ITEMS_POR_PAGINA);

  // Utilidades visuales
  const getColorEstado = (nombreEstado) => {
    if (!nombreEstado) return 'bg-gray-100 text-gray-700 border-gray-200';
    const estado = nombreEstado.toLowerCase();
    if (estado.includes('cread') || estado.includes('pendient')) return 'bg-blue-50 text-blue-700 border-blue-200'; 
    if (estado.includes('proces')) return 'bg-amber-50 text-amber-700 border-amber-200'; 
    if (estado.includes('finalizada') || estado.includes('completad') || estado.includes('cerrad')) return 'bg-green-50 text-green-700 border-green-200'; 
    if (estado.includes('cancelad')) return 'bg-red-50 text-red-700 border-red-200'; 
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones).toUpperCase();
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      
      {/* BARRA SUPERIOR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <span>📦</span>
            <span>Remisiones Locales</span>
          </h2>
          <p className="text-xs sm:text-sm font-medium mt-1 text-oltech-blue bg-blue-50 inline-block px-2 py-0.5 rounded border border-blue-100">
            Sede: {sedeUsuario ? `Hospital ID: ${sedeUsuario.unidad_medica_id}` : 'Múltiples Sedes / Nacional'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
          <Buscador 
            valor={busqueda} 
            onBuscar={setBusqueda} 
            placeholder="Buscar por solicitud, paciente o cirugía..." 
          />
          {puedeCrear && (
            <button 
              onClick={() => navigate('/red-hospitales/remisiones/nueva')}
              className="w-full sm:w-auto bg-oltech-black text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center space-x-2 shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              <span>Nueva Salida Sede</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-lg text-sm border border-red-100 font-medium">
          {error}
        </div>
      )}

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-sm sm:text-base">Historial de Movimientos de Sede</h3>
          <span className="bg-oltech-blue text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full shadow-sm">
            {remisionesFiltradas.length} encontradas
          </span>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-200 text-gray-700 text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap">
                <th className="py-2 sm:py-3 px-3 sm:px-4 font-bold border-r border-gray-200 w-40">Solicitud / Fecha</th>
                <th className="py-2 sm:py-3 px-3 sm:px-4 font-bold border-r border-gray-200">Paciente y Procedimiento</th>
                <th className="py-2 sm:py-3 px-3 sm:px-4 font-bold border-r border-gray-200 w-48">Creado por</th>
                <th className="py-2 sm:py-3 px-3 sm:px-4 font-bold border-r border-gray-200 text-center w-32">Estado</th>
                <th className="py-2 sm:py-3 px-3 sm:px-4 font-bold text-center w-28 text-oltech-pink">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm text-gray-800 divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-500">
                    <svg className="animate-spin h-8 w-8 mx-auto text-oltech-pink mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Cargando remisiones de la sede...
                  </td>
                </tr>
              ) : remisionesPaginadas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-500 bg-gray-50/50">
                    No se encontraron remisiones registradas en esta sede.
                  </td>
                </tr>
              ) : (
                remisionesPaginadas.map((remision) => {
                  const estaCerrada = remision.estado_nombre?.toLowerCase().includes('finalizada') || remision.estado_nombre?.toLowerCase().includes('cerrad');
                  
                  return (
                    <tr key={remision.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-3 sm:px-4 border-r border-gray-200 whitespace-nowrap">
                        <span className="inline-block px-2 py-1 bg-gray-800 text-white text-[10px] sm:text-xs font-bold rounded shadow-sm tracking-wide">
                          {remision.no_solicitud || `REM-${remision.id}`}
                        </span>
                        <div className="text-[9px] sm:text-[10px] text-gray-500 mt-2 font-bold uppercase">
                          {formatearFecha(remision.fecha_creacion)}
                        </div>
                      </td>
                      
                      <td className="py-3 px-3 sm:px-4 border-r border-gray-200">
                        <div className="font-bold text-gray-900 uppercase truncate max-w-xs">{remision.paciente || 'PACIENTE NO REGISTRADO'}</div>
                        <div className="text-[10px] sm:text-xs font-medium text-oltech-blue mt-0.5 truncate max-w-xs">{remision.procedimiento_nombre || 'Cirugía no especificada'}</div>
                        <div className="text-[9px] sm:text-[10px] text-gray-500 mt-1 uppercase">Médico: {remision.medico_nombre || 'No asignado'}</div>
                      </td>
                      
                      <td className="py-3 px-3 sm:px-4 border-r border-gray-200 whitespace-nowrap">
                        <div className="text-xs font-bold text-gray-700">{remision.creador_nombre}</div>
                        <div className="text-[9px] sm:text-[10px] text-gray-500 mt-1">
                          <span className="font-bold uppercase">Hospital:</span> {remision.unidad_medica_nombre || 'N/A'}
                        </div>
                      </td>
                      
                      <td className="py-3 px-3 sm:px-4 border-r border-gray-200 text-center whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border text-center shadow-sm ${getColorEstado(remision.estado_nombre)}`}>
                          {remision.estado_nombre || 'Desconocido'}
                        </span>
                        {remision.fecha_conciliacion && (
                          <div className="text-[9px] text-gray-400 mt-1 font-medium italic">
                            Conciliado: {new Date(remision.fecha_conciliacion).toLocaleDateString('es-MX')}
                          </div>
                        )}
                      </td>
                      
                      <td className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center space-y-2">
                          <button 
                            className="bg-gray-100 text-gray-600 hover:text-oltech-blue hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 transition-colors w-full shadow-sm flex justify-center items-center"
                            title="Ver Detalles"
                            onClick={() => alert('Próximamente: Detalle de Remisión de Sede y PDF')}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            Detalles
                          </button>

                          {!estaCerrada && puedeConciliar && (
                            <button 
                              onClick={() => {
                                setRemisionAConciliarId(remision.id);
                                setModalConciliarAbierto(true);
                              }}
                              className="bg-oltech-pink text-white hover:bg-pink-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors w-full shadow-sm flex justify-center items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              Conciliar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        {!cargando && totalPaginas > 1 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between shrink-0">
            <span className="text-xs sm:text-sm text-gray-500 font-medium">
              Página <span className="font-bold text-gray-800">{paginaActual}</span> de {totalPaginas}
            </span>
            <div className="flex space-x-2">
              <button 
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 shadow-sm"
              >
                Anterior
              </button>
              <button 
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 shadow-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CONCILIACIÓN LOCAL */}
      <ModalContestarRemisionCiudad 
        isOpen={modalConciliarAbierto}
        onClose={() => {
          setModalConciliarAbierto(false);
          setRemisionAConciliarId(null);
        }}
        remisionId={remisionAConciliarId}
        onGuardado={cargarRemisionesLocales}
      />

    </div>
  );
}

export default BandejaRemisionesCiudad;