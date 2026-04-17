// almacen-oltech-frontend/src/components/almacen/VistaInventarioConsumibles.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import Buscador from './Buscador';
import ModalConsumible from './ModalConsumible'; 
import ModalAjusteStock from './ModalAjusteStock';
import ModalEntradaMasiva from './carga-masiva/ModalEntradaMasiva';
import ReporteConsumibles from './impresion/ReporteConsumibles';
import ModalEditarConsumible from './ModalEditarConsumible'; 

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
  
  // NUEVOS ESTADOS: Edición y Eliminación
  const [modalEditar, setModalEditar] = useState({ abierto: false, consumible: null });

  // NUEVO: Estado para controlar la Vista Previa de Impresión
  const [mostrarModalImpresion, setMostrarModalImpresion] = useState(false);

  // Paginación y Ordenamiento
  const [paginaActual, setPaginaActual] = useState(1);
  const [ordenConfig, setOrdenConfig] = useState({ clave: 'nombre', direccion: 'asc' });
  const ITEMS_POR_PAGINA = 20;

  const abrirAjuste = (consumible, tipo) => {
    setModalAjuste({ abierto: true, consumible, tipo });
  };

  // Función para abrir edición
  const abrirEdicion = (consumible) => {
    setModalEditar({ abierto: true, consumible });
  };

  // Función para eliminar (Con validación estética)
  const ejecutarEliminacion = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.')) return;

    try {
      await axios.delete(`http://localhost:4000/api/almacen/consumibles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Insumo eliminado correctamente.');
      cargarConsumibles();
    } catch (err) {
      console.error(err);
      // Mostramos el mensaje de error amigable que configuramos en el backend
      alert(err.response?.data?.mensaje || 'Error al intentar eliminar el insumo.');
    }
  };

  /**
   * CARGA DE DATOS: El backend ya devuelve la lista "Limpia" por defecto
   * (Filtra stock 0 con lote, pero deja stock 0 genéricos)
   */
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

  // Filtrado (Incluye nombre_comercial)
  const consumiblesFiltrados = consumibles.filter(c => 
    c.codigo_referencia.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.nombre_comercial && c.nombre_comercial.toLowerCase().includes(busqueda.toLowerCase())) ||
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
    // RESPONSIVO: Ajuste del margen global
    <div className="space-y-4 sm:space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Barra Superior */}
      {/* RESPONSIVO: padding ajustado y elementos apilados en móvil */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button 
            onClick={onVolver} 
            className="p-2 bg-gray-50 text-gray-500 hover:text-oltech-pink hover:bg-pink-50 rounded-lg transition-colors border border-gray-200 hover:border-pink-200 shadow-sm shrink-0"
            title="Volver a Categorías"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              <span className="text-gray-400 font-medium mr-2">Inventario:</span>
              {categoria?.nombre}
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{consumibles.length} insumos visibles en esta categoría</p>
          </div>
        </div>

        {/* RESPONSIVO: Botones al 100% de ancho en móvil y apilados con gap */}
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full xl:w-auto">
          <Buscador 
            valor={busqueda} 
            onBuscar={setBusqueda} 
            placeholder="Buscar por código, nombre o lote..." 
          />
          
          <button 
            onClick={() => setMostrarModalImpresion(true)}
            disabled={consumiblesOrdenados.length === 0}
            className="w-full sm:w-auto bg-white border-2 border-oltech-blue text-oltech-blue px-4 py-2.5 sm:py-2 rounded-lg text-sm font-bold hover:bg-blue-50 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center space-x-2 whitespace-nowrap"
            title="Generar formato de Impresión (Vista Previa)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            <span>Imprimir Formato</span>
          </button>

          <button 
            onClick={() => setModalEntradaAbierto(true)}
            className="w-full sm:w-auto bg-green-600 text-white px-4 py-2.5 sm:py-2.5 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors shadow-md flex items-center justify-center space-x-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            <span>Ingreso</span>
          </button>

          <button 
            onClick={() => setModalNuevoAbierto(true)}
            className="w-full sm:w-auto bg-oltech-black text-white px-4 py-2.5 sm:py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center space-x-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>Crear Insumo</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-lg text-sm border border-red-100 font-medium">
          {error}
        </div>
      )}

      {/* TABLA DE STOCK (Vista Digital) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* RESPONSIVO: whitespace-nowrap y ajuste de tamaño de fuente en cabeceras */}
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap">
                <th className="py-3 sm:py-4 px-3 sm:px-4 font-bold w-12 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => ordenarDatos('id')}>
                  ID {renderIconoOrden('id')}
                </th>
                <th className="py-3 sm:py-4 px-3 sm:px-4 font-bold w-32 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => ordenarDatos('codigo_referencia')}>
                  Cód. Ref. {renderIconoOrden('codigo_referencia')}
                </th>
                <th className="py-3 sm:py-4 px-3 sm:px-4 font-bold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => ordenarDatos('nombre')}>
                  Descripción {renderIconoOrden('nombre')}
                </th>
                <th className="py-3 sm:py-4 px-3 sm:px-4 font-bold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => ordenarDatos('nombre_comercial')}>
                  Nombre Com. {renderIconoOrden('nombre_comercial')}
                </th>
                <th className="py-3 sm:py-4 px-3 sm:px-4 font-bold text-center cursor-pointer hover:bg-gray-100 transition-colors w-24" onClick={() => ordenarDatos('precio')}>
                  Precio {renderIconoOrden('precio')}
                </th>
                <th className="py-3 sm:py-4 px-3 sm:px-4 font-bold text-center cursor-pointer hover:bg-gray-100 transition-colors w-24" onClick={() => ordenarDatos('lote')}>
                  Lote {renderIconoOrden('lote')}
                </th>
                <th className="py-3 sm:py-4 px-3 sm:px-4 font-bold text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => ordenarDatos('fecha_caducidad')}>
                  Caducidad {renderIconoOrden('fecha_caducidad')}
                </th>
                <th className="py-3 sm:py-4 px-3 sm:px-4 font-bold text-center w-24">Unidad</th>
                <th className="py-3 sm:py-4 px-3 sm:px-4 font-bold text-center cursor-pointer hover:bg-gray-100 transition-colors w-24" onClick={() => ordenarDatos('cantidad')}>
                  Stock {renderIconoOrden('cantidad')}
                </th>
                <th className="py-3 sm:py-4 px-3 sm:px-4 font-bold text-center w-36">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm text-gray-800 divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="10" className="p-8 sm:p-10 text-center text-gray-500">
                    <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 mx-auto text-oltech-pink mb-2 sm:mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Cargando inventario actualizado...
                  </td>
                </tr>
              ) : consumiblesPaginados.length === 0 ? (
                <tr>
                  <td colSpan="10" className="p-8 sm:p-10 text-center text-gray-500 font-medium">
                    No hay insumos vigentes para mostrar.
                  </td>
                </tr>
              ) : (
                consumiblesPaginados.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    {/* RESPONSIVO: whitespace-nowrap en todas las celdas de datos */}
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center text-gray-400 font-medium whitespace-nowrap">#{item.id}</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-mono font-bold text-oltech-blue tracking-tight whitespace-nowrap">{item.codigo_referencia}</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 font-medium text-gray-900 whitespace-nowrap">{item.nombre}</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-gray-500 italic text-[10px] sm:text-xs whitespace-nowrap">{item.nombre_comercial || '-'}</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center font-bold text-gray-700 whitespace-nowrap">{item.precio ? `$${Number(item.precio).toFixed(2)}` : '-'}</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                      {item.lote ? <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono text-[10px] sm:text-xs border border-gray-200">{item.lote}</span> : <span className="text-gray-300 italic">-</span>}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                      {item.fecha_caducidad ? <span className="text-[10px] sm:text-xs font-bold text-gray-600">{item.fecha_caducidad}</span> : <span className="text-gray-300 italic">-</span>}
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center text-gray-500 text-[10px] sm:text-xs font-bold uppercase whitespace-nowrap">{item.unidad_medida || 'N/A'}</td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center px-2 sm:px-3 py-1 rounded-full font-bold text-xs sm:text-sm border ${
                        item.cantidad > 5 ? 'bg-green-50 text-green-700 border-green-200' :
                        item.cantidad > 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>{item.cantidad}</span>
                    </td>
                    <td className="py-2.5 sm:py-3 px-3 sm:px-4 whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* BOTÓN EDITAR (Lápiz) */}
                        <button 
                          onClick={() => abrirEdicion(item)} 
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-oltech-blue hover:border-blue-200 hover:bg-blue-50 flex items-center justify-center transition-all shadow-sm"
                          title="Editar información"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        </button>

                        {/* BOTONES DE AJUSTE (Existentes) */}
                        <button onClick={() => abrirAjuste(item, 'restar')} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors shadow-sm"><svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"></path></svg></button>
                        <button onClick={() => abrirAjuste(item, 'sumar')} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-green-600 hover:bg-green-50 flex items-center justify-center transition-colors shadow-sm"><svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg></button>

                        {/* BOTÓN ELIMINAR (Bote) */}
                        <button 
                          onClick={() => ejecutarEliminacion(item.id)} 
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-700 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all shadow-sm"
                          title="Eliminar registro"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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
        {/* RESPONSIVO: flex-col en móvil, ajuste de márgenes */}
        {!cargando && totalPaginas > 1 && (
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between shrink-0">
            <span className="text-xs sm:text-sm text-gray-500 font-medium mb-3 sm:mb-0 text-center sm:text-left">
              Página <span className="font-bold text-gray-800">{paginaActual}</span> de {totalPaginas}
            </span>
            <div className="flex space-x-2 w-full sm:w-auto justify-center sm:justify-end">
              <button onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))} disabled={paginaActual === 1} className="px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 shadow-sm">Anterior</button>
              <button onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))} disabled={paginaActual === totalPaginas} className="px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 shadow-sm">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {/* --- EL COMPONENTE DE IMPRESIÓN (SE MUESTRA COMO VISTA PREVIA) --- */}
      {mostrarModalImpresion && (
        <ReporteConsumibles 
          categoria={categoria} 
          consumibles={consumiblesOrdenados} 
          onClose={() => setMostrarModalImpresion(false)}
        />
      )}

      {/* VENTANAS FLOTANTES */}
      <ModalConsumible isOpen={modalNuevoAbierto} onClose={() => setModalNuevoAbierto(false)} onGuardado={cargarConsumibles} categoriaId={categoria.id} />
      
      {/* NUEVO MODAL DE EDICIÓN */}
      <ModalEditarConsumible 
        isOpen={modalEditar.abierto} 
        onClose={() => setModalEditar({ abierto: false, consumible: null })} 
        onGuardado={cargarConsumibles} 
        consumible={modalEditar.consumible}
      />

      <ModalAjusteStock isOpen={modalAjuste.abierto} onClose={() => setModalAjuste({ ...modalAjuste, abierto: false })} onGuardado={cargarConsumibles} consumible={modalAjuste.consumible} tipoAjuste={modalAjuste.tipo} />
      <ModalEntradaMasiva isOpen={modalEntradaAbierto} onClose={() => setModalEntradaAbierto(false)} onGuardado={cargarConsumibles} categoriaId={categoria.id} />

    </div>
  );
}

export default VistaInventarioConsumibles;