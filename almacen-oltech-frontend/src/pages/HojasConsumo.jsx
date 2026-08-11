// almacen-oltech-frontend/src/pages/HojasConsumo.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import Buscador from '../components/almacen/Buscador';
// NUEVO: Importamos el visualizador del PDF Oficial
import PDFHojaConsumo from '../components/licitaciones/PDFHojaConsumo'; 

function HojasConsumo() {
  const { token, usuario } = useAuth();
  const navigate = useNavigate();

  const [hojas, setHojas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 15;

  // Estados para el Modal de Autorización
  const [modalAutorizar, setModalAutorizar] = useState({ abierto: false, hoja: null });
  const [estadoCierre, setEstadoCierre] = useState('Finalizada');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [procesando, setProcesando] = useState(false);

  // NUEVO: Estados para el visualizador PDF
  const [modalPdfAbierto, setModalPdfAbierto] = useState(false);
  const [hojaIdSeleccionada, setHojaIdSeleccionada] = useState(null);

  // Normalizamos los roles del usuario para los permisos
  const limpiarTexto = (texto) => (texto ? texto.replace(/‚/g, 'é') : '');
  const rolesUsuario = Array.isArray(usuario?.roles) 
    ? usuario.roles.map(limpiarTexto) 
    : [limpiarTexto(usuario?.rol)].filter(Boolean);

  const puedeCrear = rolesUsuario.some(r => ['Sistemas', 'Biomédicos', 'Técnico'].includes(r));
  const puedeAutorizar = rolesUsuario.some(r => ['Sistemas', 'Operaciones', 'Encargado de almacén', 'Coordinador'].includes(r));

  const cargarHojas = async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await axios.get('http://localhost:4000/api/licitaciones/hojas-consumo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHojas(respuesta.data);
    } catch (err) {
      console.error('Error al cargar hojas de consumo:', err);
      setError('No se pudieron cargar las hojas de consumo.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHojas();
  }, [token]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  // Filtrado
  const hojasFiltradas = hojas.filter(h => 
    (h.folio && h.folio.toLowerCase().includes(busqueda.toLowerCase())) ||
    (h.paciente && h.paciente.toLowerCase().includes(busqueda.toLowerCase())) ||
    (h.tipo_cirugia && h.tipo_cirugia.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Paginación
  const totalPaginas = Math.ceil(hojasFiltradas.length / ITEMS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const hojasPaginadas = hojasFiltradas.slice(indiceInicio, indiceInicio + ITEMS_POR_PAGINA);

  // Utilidades visuales
  const getColorEstado = (nombreEstado) => {
    if (!nombreEstado) return 'bg-gray-100 text-gray-700 border-gray-200';
    const estado = nombreEstado.toLowerCase();
    if (estado.includes('pendiente')) return 'bg-amber-50 text-amber-700 border-amber-200'; 
    if (estado.includes('finalizada') || estado.includes('completad')) return 'bg-green-50 text-green-700 border-green-200'; 
    if (estado.includes('rechazada') || estado.includes('cancelad')) return 'bg-red-50 text-red-700 border-red-200'; 
    return 'bg-blue-50 text-oltech-blue border-blue-200';
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones).toUpperCase();
  };

  // Función para guardar la autorización
  const handleAutorizar = async (e) => {
    e.preventDefault();
    setProcesando(true);
    setError('');

    try {
      await axios.patch(`http://localhost:4000/api/licitaciones/hojas-consumo/${modalAutorizar.hoja.id}/autorizar`, {
        estado: estadoCierre,
        observaciones_cierre: observacionesCierre
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setModalAutorizar({ abierto: false, hoja: null });
      setObservacionesCierre('');
      cargarHojas();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al autorizar la hoja.');
    } finally {
      setProcesando(false);
    }
  };

  // NUEVO: Función para abrir el PDF
  const handleAbrirPdf = (id) => {
    setHojaIdSeleccionada(id);
    setModalPdfAbierto(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      
      {/* BARRA SUPERIOR */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <span>📑</span>
            <span>Hojas de Consumo</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Gestión y auditoría de materiales utilizados en quirófano.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
          <Buscador 
            valor={busqueda} 
            onBuscar={setBusqueda} 
            placeholder="Buscar por folio, paciente o cirugía..." 
          />
          {puedeCrear && (
            <button 
              onClick={() => navigate('/hojas-consumo/nueva')}
              className="w-full sm:w-auto bg-oltech-pink text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-pink-700 transition-colors shadow-md flex items-center justify-center space-x-2 shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              <span>Nueva Hoja</span>
            </button>
          )}
        </div>
      </div>

      {error && !modalAutorizar.abierto && !modalPdfAbierto && (
        <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-lg text-sm border border-red-100 font-medium">
          {error}
        </div>
      )}

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-sm sm:text-base">Registros Recientes</h3>
          <span className="bg-oltech-blue text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full shadow-sm">
            {hojasFiltradas.length} encontradas
          </span>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-200 text-gray-700 text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap">
                <th className="py-2 sm:py-3 px-3 sm:px-4 font-bold border-r border-gray-200 w-40">Folio / Fecha</th>
                <th className="py-2 sm:py-3 px-3 sm:px-4 font-bold border-r border-gray-200">Datos Clínicos</th>
                <th className="py-2 sm:py-3 px-3 sm:px-4 font-bold border-r border-gray-200 w-48">Ubicación / Personal</th>
                <th className="py-2 sm:py-3 px-3 sm:px-4 font-bold border-r border-gray-200 text-center w-32">Estado</th>
                <th className="py-2 sm:py-3 px-3 sm:px-4 font-bold text-center w-28 text-oltech-pink">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm text-gray-800 divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-500">
                    <svg className="animate-spin h-8 w-8 mx-auto text-oltech-pink mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Cargando hojas de consumo...
                  </td>
                </tr>
              ) : hojasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-500 bg-gray-50/50">
                    No se encontraron hojas de consumo registradas.
                  </td>
                </tr>
              ) : (
                hojasPaginadas.map((hoja) => {
                  const estaPendiente = hoja.estado?.toLowerCase().includes('pendiente');
                  
                  return (
                    <tr key={hoja.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-3 sm:px-4 border-r border-gray-200 whitespace-nowrap">
                        <span className="inline-block px-2 py-1 bg-oltech-black text-white text-[10px] sm:text-xs font-bold rounded shadow-sm tracking-wide">
                          {hoja.folio}
                        </span>
                        <div className="text-[9px] sm:text-[10px] text-gray-500 mt-2 font-bold uppercase">
                          {formatearFecha(hoja.fecha_creacion)}
                        </div>
                      </td>
                      
                      <td className="py-3 px-3 sm:px-4 border-r border-gray-200">
                        <div className="font-bold text-gray-900 uppercase truncate max-w-xs">{hoja.paciente}</div>
                        <div className="text-[10px] sm:text-xs font-medium text-oltech-blue mt-0.5 truncate max-w-xs">{hoja.tipo_cirugia || 'Cirugía no especificada'}</div>
                        <div className="text-[9px] sm:text-[10px] text-gray-500 mt-1 uppercase">CURP: {hoja.curp}</div>
                      </td>
                      
                      <td className="py-3 px-3 sm:px-4 border-r border-gray-200 whitespace-nowrap">
                        <div className="text-xs font-bold text-gray-700">{hoja.hospital_nombre || 'N/A'}</div>
                        <div className="text-[9px] sm:text-[10px] text-gray-500 mt-1">
                          <span className="font-bold uppercase">Técnico:</span> {hoja.tecnico_nombre || 'Desconocido'}
                        </div>
                      </td>
                      
                      <td className="py-3 px-3 sm:px-4 border-r border-gray-200 text-center whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border text-center shadow-sm ${getColorEstado(hoja.estado)}`}>
                          {hoja.estado || 'Desconocido'}
                        </span>
                        {hoja.fecha_validacion && (
                          <div className="text-[9px] text-gray-400 mt-1 font-medium italic">
                            Val: {new Date(hoja.fecha_validacion).toLocaleDateString('es-MX')}
                          </div>
                        )}
                      </td>
                      
                      <td className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center space-y-2">
                          
                          {/* BOTÓN ACTUALIZADO PARA ABRIR PDF OFICIAL */}
                          <button 
                            className="bg-gray-100 text-gray-600 hover:text-oltech-blue hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 transition-colors w-full shadow-sm flex justify-center items-center"
                            title="Ver e Imprimir PDF"
                            onClick={() => handleAbrirPdf(hoja.id)}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            Ver / PDF
                          </button>

                          {estaPendiente && puedeAutorizar && (
                            <button 
                              onClick={() => {
                                setModalAutorizar({ abierto: true, hoja: hoja });
                                setEstadoCierre('Finalizada');
                                setObservacionesCierre('');
                              }}
                              className="bg-oltech-black text-white hover:bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-900 transition-colors w-full shadow-sm flex justify-center items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              Validar
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

      {/* MODAL DE AUTORIZACIÓN */}
      {modalAutorizar.abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Validar Hoja de Consumo</h2>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 font-medium">
              Folio: <span className="font-bold">{modalAutorizar.hoja?.folio}</span><br />
              Paciente: <span className="font-bold">{modalAutorizar.hoja?.paciente}</span>
            </div>

            <form onSubmit={handleAutorizar} className="space-y-4">
              {error && <div className="bg-red-50 text-red-600 p-2 rounded text-xs font-bold border border-red-200">{error}</div>}
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Resolución Final *</label>
                <select 
                  value={estadoCierre} 
                  onChange={(e) => setEstadoCierre(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm bg-white font-bold outline-none focus:ring-2 focus:ring-oltech-black"
                >
                  <option value="Finalizada">✅ Finalizada (Aprobada)</option>
                  <option value="Rechazada">❌ Rechazada (Hay errores)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Observaciones / Motivo</label>
                <textarea 
                  value={observacionesCierre} 
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-oltech-black resize-none"
                  rows="3"
                  placeholder={estadoCierre === 'Rechazada' ? "Explica obligatoriamente por qué rechazas la hoja..." : "Observaciones adicionales (opcional)..."}
                  required={estadoCierre === 'Rechazada'}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" disabled={procesando} onClick={() => setModalAutorizar({ abierto: false, hoja: null })} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={procesando} className={`px-4 py-2 text-white rounded-lg text-sm font-bold shadow-md transition-colors flex items-center space-x-2 ${estadoCierre === 'Rechazada' ? 'bg-red-600 hover:bg-red-700' : 'bg-oltech-black hover:bg-gray-800'}`}>
                  {procesando && <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                  <span>Confirmar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NUEVO: RENDER DEL PDF OFICIAL */}
      {modalPdfAbierto && (
        <PDFHojaConsumo 
          hojaId={hojaIdSeleccionada} 
          onClose={() => {
            setModalPdfAbierto(false);
            setHojaIdSeleccionada(null);
          }} 
        />
      )}

    </div>
  );
}

export default HojasConsumo;