// almacen-oltech-frontend/src/components/almacen/VistaInventarioConsumibles.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import Buscador from './Buscador';
import ModalConsumible from './ModalConsumible'; 
import ModalAjusteStock from './ModalAjusteStock';
import ModalEntradaMasiva from './carga-masiva/ModalEntradaMasiva';

// CORRECCIÓN: Volvemos al Hook (Vite no permite el default export en esta librería)
import { useReactToPrint } from 'react-to-print';
import ReporteConsumibles from './impresion/ReporteConsumibles';

function VistaInventarioConsumibles({ categoria, onVolver }) {
  const { token } = useAuth();
  const [consumibles, setConsumibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  
  // Estados para modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [modalAjuste, setModalAjuste] = useState({ abierto: false, consumible: null, tipo: '' });
  const [modalEntradaAbierto, setModalEntradaAbierto] = useState(false);

  // Referencia de impresión
  const componenteImpresionRef = useRef();
  
  // Lógica de impresión con el Hook
  const ejecutarImpresion = useReactToPrint({
    contentRef: componenteImpresionRef,
    documentTitle: `Inventario_${categoria?.nombre?.replace(/\s+/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}`,
    onBeforeGetContent: () => Promise.resolve()
  });

  // Envoltorio para depurar y asegurar que el ref existe
  const handleImprimir = () => {
    console.log("Verificando componente antes de imprimir:", componenteImpresionRef.current);
    if (componenteImpresionRef.current) {
      ejecutarImpresion();
    } else {
      console.error("El componente de impresión no está listo aún.");
    }
  };

  // Paginación y Ordenamiento
  const [paginaActual, setPaginaActual] = useState(1);
  const [ordenConfig, setOrdenConfig] = useState({ clave: 'nombre', direccion: 'asc' });
  const ITEMS_POR_PAGINA = 20;

  const abrirAjuste = (consumible, tipo) => {
    setModalAjuste({ abierto: true, consumible, tipo });
  };

  // Cargar consumibles SOLO de la categoría seleccionada
  const cargarConsumibles = async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await axios.get(`http://localhost:4000/api/almacen/consumibles?categoria_id=${categoria.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsumibles(respuesta.data);
    } catch (err) {
      console.error('Error al cargar consumibles:', err);
      setError('No se pudo cargar el inventario de esta categoría.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (categoria && categoria.id) {
      cargarConsumibles();
    }
  }, [categoria, token]);

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  // Filtrado
  const consumiblesFiltrados = consumibles.filter(c => 
    c.codigo_referencia.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.lote && c.lote.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Ordenamiento
  const ordenarDatos = (clave) => {
    let direccion = 'asc';
    if (ordenConfig.clave === clave && ordenConfig.direccion === 'asc') {
      direccion = 'desc';
    }
    setOrdenConfig({ clave, direccion });
    setPaginaActual(1);
  };

  // Ordenamos SOLO después de filtrar
  const consumiblesOrdenados = [...consumiblesFiltrados].sort((a, b) => {
    const valorA = a[ordenConfig.clave] || '';
    const valorB = b[ordenConfig.clave] || '';

    if (valorA < valorB) return ordenConfig.direccion === 'asc' ? -1 : 1;
    if (valorA > valorB) return ordenConfig.direccion === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginación
  const totalPaginas = Math.ceil(consumiblesOrdenados.length / ITEMS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const consumiblesPaginados = consumiblesOrdenados.slice(indiceInicio, indiceInicio + ITEMS_POR_PAGINA);

  const renderIconoOrden = (clave) => {
    if (ordenConfig.clave !== clave) return <span className="text-gray-300 ml-1">↕</span>;
    return ordenConfig.direccion === 'asc' ? <span className="text-oltech-blue ml-1 font-bold">↑</span> : <span className="text-oltech-pink ml-1 font-bold">↓</span>;
  };

  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Barra Superior */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
        
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
            <p className="text-xs text-gray-500 mt-0.5">{consumibles.length} insumos en esta categoría</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full xl:w-auto">
          <Buscador 
            valor={busqueda} 
            onBuscar={setBusqueda} 
            placeholder="Buscar por código, nombre o lote..." 
          />
          
          {/* BOTÓN DE IMPRESIÓN */}
          <button 
            onClick={handleImprimir}
            disabled={consumiblesOrdenados.length === 0}
            className="w-full sm:w-auto bg-white border-2 border-oltech-blue text-oltech-blue px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center space-x-2 whitespace-nowrap"
            title="Generar formato de Excel/Impresión para conteo físico"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            <span>Imprimir Formato</span>
          </button>

          <button 
            onClick={() => setModalEntradaAbierto(true)}
            className="w-full sm:w-auto bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-md flex items-center justify-center space-x-2 whitespace-nowrap"
            title="Registrar una entrada de mercancía"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            <span>Ingreso</span>
          </button>

          <button 
            onClick={() => setModalNuevoAbierto(true)}
            className="w-full sm:w-auto bg-oltech-black text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center space-x-2 whitespace-nowrap"
            title="Crear un nuevo producto en el catálogo"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>Crear Insumo</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 font-medium">
          {error}
        </div>
      )}

      {/* TABLA DE STOCK (Visible en pantalla) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                <th className="py-4 px-4 font-bold w-12 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => ordenarDatos('id')}>
                  ID {renderIconoOrden('id')}
                </th>
                <th className="py-4 px-4 font-bold w-40 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => ordenarDatos('codigo_referencia')}>
                  Cód. Ref. {renderIconoOrden('codigo_referencia')}
                </th>
                <th className="py-4 px-4 font-bold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => ordenarDatos('nombre')}>
                  Nombre / Descripción {renderIconoOrden('nombre')}
                </th>
                <th className="py-4 px-4 font-bold text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => ordenarDatos('lote')}>
                  Lote {renderIconoOrden('lote')}
                </th>
                <th className="py-4 px-4 font-bold text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => ordenarDatos('fecha_caducidad')}>
                  Caducidad {renderIconoOrden('fecha_caducidad')}
                </th>
                <th className="py-4 px-4 font-bold text-center w-24">
                  Unidad
                </th>
                <th className="py-4 px-4 font-bold text-center cursor-pointer hover:bg-gray-100 transition-colors w-28" onClick={() => ordenarDatos('cantidad')}>
                  Stock {renderIconoOrden('cantidad')}
                </th>
                <th className="py-4 px-4 font-bold text-center w-32">Ajustar</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-800 divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-gray-500">
                    <svg className="animate-spin h-8 w-8 mx-auto text-oltech-pink mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cargando inventario...
                  </td>
                </tr>
              ) : consumiblesPaginados.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-10 text-center text-gray-500">
                    No se encontraron insumos registrados en esta categoría.
                  </td>
                </tr>
              ) : (
                consumiblesPaginados.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-center text-gray-400 font-medium">#{item.id}</td>
                    
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-oltech-blue tracking-tight">
                        {item.codigo_referencia}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {item.nombre}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {item.lote ? (
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono text-xs border border-gray-200">
                          {item.lote}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs italic">-</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {item.fecha_caducidad ? (
                        <span className="text-xs font-bold text-gray-600">
                          {new Date(item.fecha_caducidad).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs italic">-</span>
                      )}
                    </td>
                    
                    <td className="py-3 px-4 text-center text-gray-500 text-xs font-bold uppercase tracking-wider">
                      {item.unidad_medida || 'N/A'}
                    </td>
                    
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-bold text-sm border ${
                        item.cantidad > 5 ? 'bg-green-50 text-green-700 border-green-200' :
                        item.cantidad > 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {item.cantidad}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => abrirAjuste(item, 'restar')} 
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 flex items-center justify-center transition-colors shadow-sm"
                          title="Ajuste Manual: Restar Stock"
                        >
                          <svg className="w-4 h-4 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"></path></svg>
                        </button>
                        
                        <button 
                          onClick={() => abrirAjuste(item, 'sumar')} 
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-300 hover:bg-green-50 flex items-center justify-center transition-colors shadow-sm"
                          title="Ajuste Manual: Sumar Stock"
                        >
                          <svg className="w-4 h-4 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        {!cargando && totalPaginas > 1 && (
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">
              Página <span className="font-bold text-gray-800">{paginaActual}</span> de {totalPaginas}
            </span>
            <div className="flex space-x-2">
              <button 
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Anterior
              </button>
              <button 
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- REPORTE DE IMPRESIÓN --- */}
      {/* SOLUCIÓN: Clases Tailwind para hacerlo invisible pero presente para react-to-print */}
      <div className="absolute opacity-0 pointer-events-none -z-50 left-[-9999px] top-[-9999px]">
        <ReporteConsumibles 
          ref={componenteImpresionRef} 
          categoria={categoria} 
          consumibles={consumiblesOrdenados} 
        />
      </div>

      {/* VENTANAS FLOTANTES (MODALES) */}
      <ModalConsumible 
        isOpen={modalNuevoAbierto} 
        onClose={() => setModalNuevoAbierto(false)} 
        onGuardado={cargarConsumibles} 
        categoriaId={categoria.id}
      />

      <ModalAjusteStock 
        isOpen={modalAjuste.abierto} 
        onClose={() => setModalAjuste({ ...modalAjuste, abierto: false })} 
        onGuardado={cargarConsumibles}
        consumible={modalAjuste.consumible}
        tipoAjuste={modalAjuste.tipo}
      />

      <ModalEntradaMasiva
       isOpen={modalEntradaAbierto}
        onClose={() => setModalEntradaAbierto(false)}
       onGuardado={cargarConsumibles}
        categoriaId={categoria.id}
      />

    </div>
  );
}

export default VistaInventarioConsumibles;