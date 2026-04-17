// almacen-oltech-frontend/src/components/historial/ModalDetalleEntrada.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

// IMPORTACIONES PARA IMPRESIÓN
import ReporteEntrada from '../almacen/impresion/ReporteEntrada';

function ModalDetalleEntrada({ isOpen, onClose, entrada }) {
  const { token } = useAuth();
  const [detalles, setDetalles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // NUEVO: Estado para controlar la Vista Previa de Impresión
  const [mostrarModalImpresion, setMostrarModalImpresion] = useState(false);

  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 10;

  useEffect(() => {
    if (isOpen && entrada) {
      const cargarDetalles = async () => {
        setCargando(true);
        setError('');
        try {
          const respuesta = await axios.get(`http://localhost:4000/api/almacen/entradas/${entrada.id}/detalles`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setDetalles(respuesta.data);
        } catch (err) {
          console.error('Error al cargar los detalles:', err);
          setError('No se pudo cargar la lista de productos de este folio.');
        } finally {
          setCargando(false);
        }
      };

      cargarDetalles();
      setBusqueda('');
      setPaginaActual(1);
    }
  }, [isOpen, entrada, token]);

  if (!isOpen || !entrada) return null;

  // Filtrado interno
  const detallesFiltrados = detalles.filter(d => 
    d.codigo_referencia.toLowerCase().includes(busqueda.toLowerCase()) ||
    d.consumible_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (d.nombre_comercial && d.nombre_comercial.toLowerCase().includes(busqueda.toLowerCase())) ||
    (d.lote_ingresado && d.lote_ingresado.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const totalPaginas = Math.ceil(detallesFiltrados.length / ITEMS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const detallesPaginados = detallesFiltrados.slice(indiceInicio, indiceInicio + ITEMS_POR_PAGINA);

  // Esta se queda igual porque se usa para la fecha de creación del ticket
  const formatearFechaHora = (fechaString) => {
    if (!fechaString) return '--';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones).toUpperCase();
  };

  // Esta ya no se usa para la caducidad, pero la dejamos por si acaso
  const formatearSoloFecha = (fechaString) => {
    if (!fechaString) return '--';
    const opciones = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones);
  };

  return (
    // RESPONSIVO: p-2 sm:p-4
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado del Modal */}
        {/* RESPONSIVO: flex-col sm:flex-row para apilar, p-4 sm:p-6 */}
        <div className="bg-green-600 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 shrink-0 rounded-t-2xl">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
              <span>Detalles: {entrada.folio}</span>
            </h2>
            <p className="text-green-100 text-xs sm:text-sm font-medium mt-1 flex flex-wrap items-center gap-2">
              <span>👤 {entrada.usuario_nombre}</span>
              <span className="hidden sm:inline">•</span>
              <span>📅 {formatearFechaHora(entrada.fecha_entrada)}</span>
            </p>
          </div>
          
          {/* RESPONSIVO: w-full sm:w-auto */}
          <div className="flex items-center w-full sm:w-auto space-x-2">
            {/* BOTÓN VISIBLE: ABRE LA VISTA PREVIA DE IMPRESIÓN */}
            <button 
              onClick={() => setMostrarModalImpresion(true)}
              disabled={cargando || detalles.length === 0}
              className="flex-1 sm:flex-none flex justify-center items-center space-x-2 px-4 py-2 sm:py-2 bg-white text-green-700 hover:bg-green-50 rounded-lg font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
              <span>Imprimir</span>
            </button>

            <button onClick={onClose} className="text-green-100 hover:text-white bg-green-700 hover:bg-green-800 transition-colors p-2 sm:p-2 rounded-lg shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>

        {/* Resumen y Buscador */}
        {/* RESPONSIVO: flex-col sm:flex-row, p-4 sm:p-6 */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:space-x-4 w-full sm:w-auto">
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm text-center shrink-0 w-full sm:w-auto">
              <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">Total Artículos</p>
              <p className="text-lg sm:text-xl font-black text-oltech-blue">{entrada.total_articulos}</p>
            </div>
            {entrada.observaciones && (
              <div className="text-xs sm:text-sm text-gray-600 italic border-l-2 border-green-500 pl-3 w-full sm:max-w-md">
                "{entrada.observaciones}"
              </div>
            )}
          </div>
          
          {/* RESPONSIVO: w-full siempre en móvil */}
          <div className="w-full sm:w-64 relative shrink-0">
            {/* RESPONSIVO: text-base evita auto-zoom en iOS */}
            <input 
              type="text" 
              value={busqueda} 
              onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
              className="w-full pl-9 pr-3 py-2.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-base sm:text-sm"
              placeholder="Buscar en este ticket..."
            />
            <svg className="w-4 h-4 sm:w-4 sm:h-4 text-gray-400 absolute left-3 top-3 sm:top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        {/* Tabla de Productos */}
        {/* RESPONSIVO: overflow-x-auto, p-3 sm:p-6 */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-3 sm:p-6 bg-white">
          {cargando ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 min-h-[200px]">
              <svg className="animate-spin h-8 w-8 sm:h-10 sm:w-10 text-green-500 mb-3 sm:mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="text-sm sm:text-base font-medium">Cargando desglose del ticket...</p>
            </div>
          ) : detallesPaginados.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[200px]">
              <p className="text-base sm:text-lg font-medium text-gray-500">No se encontraron productos</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  {/* RESPONSIVO: whitespace-nowrap */}
                  <tr className="bg-gray-100 border-b border-gray-200 text-[10px] sm:text-xs uppercase tracking-wider text-gray-600 whitespace-nowrap">
                    <th className="p-2 sm:p-3 font-bold w-12 text-center">#</th>
                    <th className="p-2 sm:p-3 font-bold w-32">Código</th>
                    <th className="p-2 sm:p-3 font-bold">Descripción</th>
                    <th className="p-2 sm:p-3 font-bold w-40">Nombre Com.</th>
                    <th className="p-2 sm:p-3 font-bold text-center w-24">Precio Unit.</th>
                    <th className="p-2 sm:p-3 font-bold text-center w-24 bg-green-50 text-green-800 border-x border-gray-200">Cant.</th>
                    <th className="p-2 sm:p-3 font-bold w-28">Lote</th>
                    <th className="p-2 sm:p-3 font-bold w-28">Caducidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                  {detallesPaginados.map((item, idx) => (
                    <tr key={item.detalle_id} className="hover:bg-gray-50 transition-colors">
                      {/* RESPONSIVO: whitespace-nowrap */}
                      <td className="p-2 sm:p-3 text-center text-gray-400 font-bold whitespace-nowrap">{indiceInicio + idx + 1}</td>
                      <td className="p-2 sm:p-3 font-mono font-bold text-oltech-blue whitespace-nowrap">{item.codigo_referencia}</td>
                      <td className="p-2 sm:p-3 font-medium text-gray-800 whitespace-nowrap">{item.consumible_nombre}</td>
                      
                      {/* DATO: NOMBRE COMERCIAL */}
                      <td className="p-2 sm:p-3 text-gray-500 italic text-[10px] sm:text-xs whitespace-nowrap">
                        {item.nombre_comercial || <span className="text-gray-300">-</span>}
                      </td>

                      {/* DATO: PRECIO INGRESADO */}
                      <td className="p-2 sm:p-3 text-center font-bold text-gray-600 whitespace-nowrap">
                        {item.precio_ingresado ? `$${Number(item.precio_ingresado).toFixed(2)}` : <span className="text-gray-300">-</span>}
                      </td>

                      <td className="p-2 sm:p-3 text-center font-black text-green-700 bg-green-50/30 border-x border-green-100 text-sm sm:text-base whitespace-nowrap">
                        {item.cantidad_ingresada} <span className="text-[9px] sm:text-[10px] text-green-600/70 font-bold uppercase ml-1">{item.unidad_medida}</span>
                      </td>
                      
                      <td className="p-2 sm:p-3 whitespace-nowrap">
                        {item.lote_ingresado ? (
                          <span className="font-mono text-[10px] sm:text-xs bg-gray-100 border border-gray-200 px-2 py-1 rounded text-gray-700">{item.lote_ingresado}</span>
                        ) : (
                          <span className="text-gray-300 italic text-[10px] sm:text-xs">-</span>
                        )}
                      </td>
                      
                      <td className="p-2 sm:p-3 whitespace-nowrap">
                        {/* MODIFICADO: Ya no intentamos parsearlo con Date, lo mostramos como texto plano */}
                        {item.fecha_caducidad_ingresada ? (
                          <span className="text-[10px] sm:text-xs font-bold text-gray-600">{item.fecha_caducidad_ingresada}</span>
                        ) : (
                          <span className="text-gray-300 italic text-[10px] sm:text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Controles de Paginación */}
        {/* RESPONSIVO: flex-col sm:flex-row para apilar, p-3 sm:p-4 */}
        {!cargando && totalPaginas > 1 && (
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 shrink-0 rounded-b-2xl">
            <span className="text-xs sm:text-sm text-gray-500 font-medium text-center sm:text-left">
              Página <span className="font-bold text-gray-800">{paginaActual}</span> de {totalPaginas}
            </span>
            <div className="flex space-x-2 w-full sm:w-auto justify-center sm:justify-end">
              <button 
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className="px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                Anterior
              </button>
              <button 
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* --- EL COMPONENTE DE IMPRESIÓN (SE MUESTRA COMO VISTA PREVIA) --- */}
        {mostrarModalImpresion && (
          <ReporteEntrada 
            entrada={entrada}
            detalles={detalles} 
            onClose={() => setMostrarModalImpresion(false)}
          />
        )}

      </div>
    </div>
  );
}

export default ModalDetalleEntrada;