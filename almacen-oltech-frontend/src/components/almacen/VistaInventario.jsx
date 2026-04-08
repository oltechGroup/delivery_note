// almacen-oltech-frontend/src/components/almacen/VistaInventario.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import Buscador from './Buscador';
import ModalSet from './ModalSet';
import ModalDetalleSet from './ModalDetalleSet';
import ReporteSets from './impresion/ReporteSets'; // Importamos la nueva vista de impresión

function VistaInventario({ categoria, onVolver }) {
  const { token } = useAuth();
  const [sets, setSets] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Variables de estado
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  
  // Estado para saber qué Set vamos a "abrir"
  const [setSeleccionadoParaVer, setSetSeleccionadoParaVer] = useState(null);

  // Estados para la paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 15; 

  // NUEVO: Estados para manejar la apertura del modal de impresión
  const [preparandoReporte, setPreparandoReporte] = useState(false);
  const [dataParaImprimir, setDataParaImprimir] = useState(null);
  const [mostrarModalImpresion, setMostrarModalImpresion] = useState(false);

  // FUNCIÓN: Obtener composiciones y abrir la vista previa
  const prepararYAbrirImpresion = async () => {
    if (setsFiltrados.length === 0) return;
    
    setPreparandoReporte(true);
    setError('');

    try {
      // Usamos Promise.all para hacer las peticiones en paralelo
      const promesas = setsFiltrados.map(async (set) => {
        const res = await axios.get(`http://localhost:4000/api/almacen/sets/${set.id}/composicion`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        return {
          setId: set.id,
          setCodigo: set.codigo,
          setDescripcion: set.descripcion,
          piezas: res.data // Array de piezas
        };
      });

      const resultados = await Promise.all(promesas);
      
      // Ordenamos los resultados alfabéticamente
      resultados.sort((a, b) => a.setCodigo.localeCompare(b.setCodigo));
      
      // Actualizamos el estado con los datos y abrimos el modal
      setDataParaImprimir(resultados);
      setMostrarModalImpresion(true);

    } catch (err) {
      console.error('Error al preparar reporte de sets:', err);
      setError('Hubo un problema al extraer la información de las cajas. Inténtalo de nuevo.');
    } finally {
      setPreparandoReporte(false);
    }
  };

  // Cargar todos los sets/piezas que pertenecen a esta categoría
  const cargarSets = async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await axios.get(`http://localhost:4000/api/almacen/categorias/${categoria.id}/sets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSets(respuesta.data);
    } catch (err) {
      console.error('Error al cargar inventario:', err);
      setError('No se pudo cargar el inventario de esta categoría.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (categoria && categoria.id) {
      cargarSets();
    }
  }, [categoria, token]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  // PASO 1: Filtro local
  const setsFiltrados = sets.filter(s => 
    s.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  // PASO 2: Paginar
  const totalPaginas = Math.ceil(setsFiltrados.length / ITEMS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const setsPaginados = setsFiltrados.slice(indiceInicio, indiceInicio + ITEMS_POR_PAGINA);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* Barra Superior: Botón Volver, Título y Buscador Local */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={onVolver} 
            className="p-2 bg-gray-50 text-gray-500 hover:text-oltech-pink hover:bg-pink-50 rounded-lg transition-colors border border-gray-200 hover:border-pink-200 shadow-sm"
            title="Volver a Categorías"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              <span className="text-gray-400 font-medium mr-2">Inventario:</span>
              {categoria?.nombre}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{sets.length} registros en esta categoría</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
          <Buscador 
            valor={busqueda} 
            onBuscar={setBusqueda} 
            placeholder="Buscar código o descripción..." 
          />
          
          {/* BOTÓN VISIBLE: Lanza la preparación y ABRE LA VISTA PREVIA */}
          <button 
            onClick={prepararYAbrirImpresion}
            disabled={setsFiltrados.length === 0 || preparandoReporte}
            className="w-full sm:w-auto bg-white border-2 border-oltech-blue text-oltech-blue px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center space-x-2 whitespace-nowrap"
            title="Generar formato de conteo con desglose de piezas"
          >
            {preparandoReporte ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Cargando Contenido...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                <span>Generar Reporte (Sets)</span>
              </>
            )}
          </button>

          <button 
            onClick={() => setModalAbierto(true)}
            className="bg-oltech-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm flex items-center space-x-2 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>Nuevo Set / Pieza</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL: TABLA Y PAGINACIÓN */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-200 text-gray-700 text-xs uppercase tracking-wider">
                <th className="py-3 px-4 font-bold border-r border-gray-200 w-16 text-center">ID</th>
                <th className="py-3 px-4 font-bold border-r border-gray-200 w-56">Código (SKU)</th>
                <th className="py-3 px-4 font-bold border-r border-gray-200">Descripción / Nombre del Equipo</th>
                <th className="py-3 px-4 font-bold border-r border-gray-200 w-32 text-center">Estado</th>
                <th className="py-3 px-4 font-bold w-24 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-800">
              {cargando ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    <svg className="animate-spin h-6 w-6 mx-auto text-oltech-pink mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cargando registros...
                  </td>
                </tr>
              ) : setsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 bg-gray-50/50">
                    No hay equipos registrados en esta categoría que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                setsPaginados.map((set) => {
                  const nombreEstado = set.estado_nombre || 'ACTIVO';
                  const esEstadoVerde = nombreEstado.toLowerCase() === 'activo' || nombreEstado.toLowerCase() === 'disponible';
                  
                  return (
                    <tr key={set.id} className="border-b border-gray-200 hover:bg-blue-50/50 transition-colors even:bg-gray-50/50">
                      <td className="py-2.5 px-4 border-r border-gray-200 text-center text-gray-400 font-medium">
                        {set.id}
                      </td>
                      <td className="py-2.5 px-4 border-r border-gray-200">
                        <span className="font-mono font-bold text-oltech-blue bg-blue-50 px-2 py-1 rounded border border-blue-100 tracking-tight">
                          {set.codigo}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 border-r border-gray-200 font-medium">
                        {set.descripcion}
                      </td>
                      <td className="py-2.5 px-4 border-r border-gray-200 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border ${
                          esEstadoVerde
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {nombreEstado}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button 
                          onClick={() => setSetSeleccionadoParaVer(set)}
                          className="text-gray-400 hover:text-oltech-pink transition-colors p-1.5 rounded hover:bg-pink-50 shadow-sm border border-transparent hover:border-pink-200"
                          title="Ver / Editar Contenido"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        {!cargando && totalPaginas > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between shrink-0">
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

      {/* --- EL COMPONENTE DE IMPRESIÓN (AHORA SE MUESTRA COMO VISTA PREVIA) --- */}
      {mostrarModalImpresion && dataParaImprimir && (
        <ReporteSets 
          categoria={categoria}
          dataReporte={dataParaImprimir}
          onClose={() => setMostrarModalImpresion(false)}
        />
      )}

      {/* --- VENTANAS FLOTANTES (MODALES) --- */}
      <ModalSet 
        isOpen={modalAbierto} 
        onClose={() => setModalAbierto(false)} 
        onGuardado={cargarSets} 
        categoriaId={categoria.id} 
      />

      <ModalDetalleSet 
        isOpen={!!setSeleccionadoParaVer}
        onClose={() => setSetSeleccionadoParaVer(null)}
        setMaestro={setSeleccionadoParaVer}
      />

    </div>
  );
}

export default VistaInventario;