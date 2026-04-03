// almacen-oltech-frontend/src/pages/HistorialRemisiones.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import Buscador from '../components/almacen/Buscador'; 
import ModalDetalleEntrada from '../components/historial/ModalDetalleEntrada'; // Importamos el modal

function HistorialRemisiones() {
  const { token } = useAuth();
  
  // Estado para controlar qué pestaña vemos
  const [pestanaActiva, setPestañaActiva] = useState('remisiones'); 
  
  // Estados para los datos
  const [remisiones, setRemisiones] = useState([]);
  const [entradas, setEntradas] = useState([]);
  
  // Estados de UI
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Estados para la paginación principal
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 15;

  // Estado para controlar el modal de detalles
  const [entradaSeleccionada, setEntradaSeleccionada] = useState(null);

  // 1. Cargar Historial de Remisiones (Salidas)
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
      setError('No se pudo cargar el historial de remisiones.');
    } finally {
      setCargando(false);
    }
  };

  // 2. Cargar Historial de Entradas (Inbound)
  const cargarEntradas = async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await axios.get('http://localhost:4000/api/almacen/entradas/historial', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEntradas(respuesta.data);
    } catch (err) {
      console.error('Error al cargar entradas:', err);
      setError('No se pudo cargar el historial de ingresos de almacén.');
    } finally {
      setCargando(false);
    }
  };

  // Efecto principal: Carga los datos dependiendo de la pestaña activa
  useEffect(() => {
    setBusqueda(''); 
    setPaginaActual(1); // Reiniciar paginación al cambiar de pestaña
    if (pestanaActiva === 'remisiones') {
      cargarRemisiones();
    } else {
      cargarEntradas();
    }
  }, [pestanaActiva, token]);

  // Efecto secundario: Reiniciar paginación al buscar
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  // Filtros inteligentes
  const remisionesFiltradas = remisiones.filter(r => 
    (r.no_solicitud && r.no_solicitud.toLowerCase().includes(busqueda.toLowerCase())) ||
    (r.paciente && r.paciente.toLowerCase().includes(busqueda.toLowerCase())) ||
    (r.unidad_medica_nombre && r.unidad_medica_nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
    (r.creador_nombre && r.creador_nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
    (r.conciliador_nombre && r.conciliador_nombre.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const entradasFiltradas = entradas.filter(e => 
    (e.folio && e.folio.toLowerCase().includes(busqueda.toLowerCase())) ||
    (e.usuario_nombre && e.usuario_nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
    (e.observaciones && e.observaciones.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Lógica de Paginación para la tabla activa
  const datosActivos = pestanaActiva === 'remisiones' ? remisionesFiltradas : entradasFiltradas;
  const totalPaginas = Math.ceil(datosActivos.length / ITEMS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const datosPaginados = datosActivos.slice(indiceInicio, indiceInicio + ITEMS_POR_PAGINA);

  // Utilidades visuales
  const getColorEstado = (nombreEstado) => {
    if (!nombreEstado) return 'bg-gray-100 text-gray-700';
    const estado = nombreEstado.toLowerCase();
    if (estado.includes('proceso') || estado.includes('calle') || estado.includes('pendiente')) {
      return 'bg-amber-100 text-amber-800'; 
    }
    if (estado.includes('completad') || estado.includes('cerrad')) {
      return 'bg-green-100 text-green-800'; 
    }
    if (estado.includes('cancelad')) {
      return 'bg-red-100 text-red-800'; 
    }
    return 'bg-blue-100 text-blue-800';
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones).toUpperCase();
  };

  const formatearFechaHora = (fechaString) => {
    if (!fechaString) return '--';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones).toUpperCase();
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Barra Superior con Título y Buscador */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <span>🗄️</span>
            <span>Centro de Auditoría</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Registro detallado de movimientos de entrada y salida del almacén.
          </p>
        </div>

        <div className="w-full lg:w-96">
          <Buscador 
            valor={busqueda} 
            onBuscar={setBusqueda} 
            placeholder={pestanaActiva === 'remisiones' ? "Buscar por folio, paciente, usuario..." : "Buscar por folio o usuario..."} 
          />
        </div>
      </div>

      {/* Navegación de Pestañas (Tabs) */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <button
          onClick={() => setPestañaActiva('remisiones')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
            pestanaActiva === 'remisiones' 
              ? 'bg-oltech-black text-white shadow-md' 
              : 'bg-transparent text-gray-500 hover:bg-gray-50'
          }`}
        >
          📤 Historial de Remisiones (Salidas)
        </button>
        <button
          onClick={() => setPestañaActiva('entradas')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
            pestanaActiva === 'entradas' 
              ? 'bg-oltech-black text-white shadow-md' 
              : 'bg-transparent text-gray-500 hover:bg-gray-50'
          }`}
        >
          📥 Auditoría de Ingresos (Entradas)
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 font-medium">
          {error}
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL DE TABLAS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[400px]">
        {cargando ? (
          <div className="flex-1 p-20 text-center flex flex-col items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-oltech-pink mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-gray-500 font-medium">Cargando registros de auditoría...</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            {/* =========================================================================
                TABLA 1: REMISIONES
                ========================================================================= */}
            {pestanaActiva === 'remisiones' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                    <th className="p-4 w-40">Remisión</th>
                    <th className="p-4">Detalles Médicos</th>
                    <th className="p-4 w-56">Auditoría Despacho</th>
                    <th className="p-4 w-56">Auditoría Retorno</th>
                    <th className="p-4 text-center w-32">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {datosPaginados.length > 0 ? (
                    datosPaginados.map((rem) => (
                      <tr key={rem.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 align-top">
                          <span className="inline-block px-2 py-1 bg-oltech-black text-white text-xs font-bold rounded shadow-sm">
                            {rem.no_solicitud || `ID-${rem.id}`}
                          </span>
                          <div className="text-xs text-gray-500 mt-2 font-medium">
                            CX: <span className="text-gray-800 font-bold">{formatearFecha(rem.fecha_cirugia)}</span>
                          </div>
                        </td>
                        <td className="p-4 align-top max-w-xs">
                          <p className="font-bold text-gray-800 line-clamp-1">{rem.paciente || 'Sin paciente'}</p>
                          <p className="text-xs text-oltech-pink font-medium line-clamp-1 mt-0.5">{rem.procedimiento_nombre}</p>
                          <div className="mt-2 text-[11px] text-gray-500">
                            <p><span className="font-bold text-gray-400">HOSP:</span> {rem.unidad_medica_nombre}</p>
                            <p><span className="font-bold text-gray-400">DR:</span> {rem.medico_nombre}</p>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800">{rem.creador_nombre || 'Sistema'}</span>
                            <span className="text-xs text-gray-500 mt-1">{formatearFechaHora(rem.fecha_creacion)}</span>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          {rem.conciliador_nombre ? (
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-800">{rem.conciliador_nombre}</span>
                              <span className="text-xs text-gray-500 mt-1">{formatearFechaHora(rem.fecha_conciliacion)}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Pendiente de retorno</span>
                          )}
                        </td>
                        <td className="p-4 align-top text-center">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getColorEstado(rem.estado_nombre)}`}>
                            {rem.estado_nombre || 'Desconocido'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        No se encontraron registros de remisiones.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* =========================================================================
                TABLA 2: ENTRADAS MASIVAS
                ========================================================================= */}
            {pestanaActiva === 'entradas' && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-green-50 border-b border-green-100 text-xs uppercase tracking-wider text-green-800 font-bold">
                    <th className="p-4 w-40">Folio Ingreso</th>
                    <th className="p-4 w-56">Auditoría (Receptor)</th>
                    <th className="p-4 text-center w-32">Volumen</th>
                    <th className="p-4">Observaciones Registradas</th>
                    <th className="p-4 text-center w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {datosPaginados.length > 0 ? (
                    datosPaginados.map((ent) => (
                      <tr key={ent.id} className="hover:bg-green-50/30 transition-colors">
                        <td className="p-4 align-top">
                          <span className="inline-block px-3 py-1.5 bg-green-600 text-white text-sm font-bold rounded shadow-sm">
                            {ent.folio}
                          </span>
                        </td>
                        <td className="p-4 align-top">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 flex items-center space-x-1">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                              <span>{ent.usuario_nombre}</span>
                            </span>
                            <span className="text-xs text-gray-500 mt-1 font-medium ml-5">
                              {formatearFechaHora(ent.fecha_entrada)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-top text-center">
                          <div className="inline-flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-2 min-w-[80px]">
                            <span className="text-xl font-bold text-oltech-blue">{ent.total_articulos || 0}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Piezas</span>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          {ent.observaciones ? (
                            <p className="text-sm text-gray-700 italic border-l-2 border-green-400 pl-3">"{ent.observaciones}"</p>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Sin observaciones</span>
                          )}
                        </td>
                        <td className="p-4 align-top text-center">
                          <button 
                            onClick={() => setEntradaSeleccionada(ent)}
                            className="p-2 bg-gray-100 text-gray-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors border border-transparent hover:border-green-200 shadow-sm"
                            title="Ver detalles del ticket"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-12 text-center text-gray-500">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                        No hay registros de entradas masivas en el historial.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* CONTROLES DE PAGINACIÓN PRINCIPAL */}
        {!cargando && totalPaginas > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between shrink-0">
            <span className="text-sm text-gray-500 font-medium">
              Página <span className="font-bold text-gray-800">{paginaActual}</span> de {totalPaginas}
            </span>
            <div className="flex space-x-2">
              <button 
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                Anterior
              </button>
              <button 
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DETALLES */}
      <ModalDetalleEntrada 
        isOpen={!!entradaSeleccionada} 
        onClose={() => setEntradaSeleccionada(null)} 
        entrada={entradaSeleccionada} 
      />

    </div>
  );
}

export default HistorialRemisiones;