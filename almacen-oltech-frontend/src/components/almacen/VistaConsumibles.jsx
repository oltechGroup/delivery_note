// almacen-oltech-frontend/src/components/almacen/VistaConsumibles.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import Buscador from './Buscador';
import ModalConsumible from './ModalConsumible'; 
import ModalAjusteStock from './ModalAjusteStock';

function VistaConsumibles() {
  const { token } = useAuth();
  const [consumibles, setConsumibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');
  
  // Estados para controlar las ventanas flotantes
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
  const [modalAjuste, setModalAjuste] = useState({ abierto: false, consumible: null, tipo: '' });

  // NUEVO: Estados para Paginación y Ordenamiento
  const [paginaActual, setPaginaActual] = useState(1);
  const [ordenConfig, setOrdenConfig] = useState({ clave: 'nombre', direccion: 'asc' });
  const ITEMS_POR_PAGINA = 20;

  const abrirAjuste = (consumible, tipo) => {
    setModalAjuste({ abierto: true, consumible, tipo });
  };

  const cargarConsumibles = async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await axios.get('http://localhost:4000/api/almacen/consumibles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsumibles(respuesta.data);
    } catch (err) {
      console.error('Error al cargar consumibles:', err);
      setError('No se pudo cargar el inventario de insumos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarConsumibles();
  }, [token]);

  // Si el usuario escribe en el buscador, regresamos a la página 1
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  // 1. Filtrado por búsqueda
  const consumiblesFiltrados = consumibles.filter(c => 
    c.codigo_referencia.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // 2. Ordenamiento de la A-Z o Z-A
  const ordenarDatos = (clave) => {
    let direccion = 'asc';
    if (ordenConfig.clave === clave && ordenConfig.direccion === 'asc') {
      direccion = 'desc';
    }
    setOrdenConfig({ clave, direccion });
    setPaginaActual(1); // Regresamos a la pag 1 al cambiar el orden
  };

  const consumiblesOrdenados = [...consumiblesFiltrados].sort((a, b) => {
    if (a[ordenConfig.clave] < b[ordenConfig.clave]) {
      return ordenConfig.direccion === 'asc' ? -1 : 1;
    }
    if (a[ordenConfig.clave] > b[ordenConfig.clave]) {
      return ordenConfig.direccion === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // 3. Paginación (Cortar el arreglo en bloques de 20)
  const totalPaginas = Math.ceil(consumiblesOrdenados.length / ITEMS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const consumiblesPaginados = consumiblesOrdenados.slice(indiceInicio, indiceInicio + ITEMS_POR_PAGINA);

  // Icono dinámico para las cabeceras de la tabla
  const renderIconoOrden = (clave) => {
    if (ordenConfig.clave !== clave) return <span className="text-gray-300 ml-1">↕</span>;
    return ordenConfig.direccion === 'asc' ? <span className="text-oltech-blue ml-1 font-bold">↑</span> : <span className="text-oltech-pink ml-1 font-bold">↓</span>;
  };

  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Barra Superior */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <span>⚙️</span>
            <span>Inventario de Insumos</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Total en catálogo: {consumiblesFiltrados.length} insumos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
          <Buscador 
            valor={busqueda} 
            onBuscar={setBusqueda} 
            placeholder="Buscar por código o nombre..." 
          />
          <button 
            onClick={() => setModalNuevoAbierto(true)}
            className="w-full sm:w-auto bg-oltech-black text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center space-x-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>Nuevo Insumo</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 font-medium">
          {error}
        </div>
      )}

      {/* TABLA DE STOCK CON PAGINACIÓN Y ORDENAMIENTO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                <th className="py-4 px-6 font-bold w-16 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => ordenarDatos('id')}>
                  ID {renderIconoOrden('id')}
                </th>
                <th className="py-4 px-6 font-bold w-48 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => ordenarDatos('codigo_referencia')}>
                  Código de Ref. {renderIconoOrden('codigo_referencia')}
                </th>
                <th className="py-4 px-6 font-bold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => ordenarDatos('nombre')}>
                  Nombre del Insumo {renderIconoOrden('nombre')}
                </th>
                <th className="py-4 px-6 font-bold text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => ordenarDatos('unidad_medida')}>
                  Unidad {renderIconoOrden('unidad_medida')}
                </th>
                <th className="py-4 px-6 font-bold text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => ordenarDatos('cantidad')}>
                  Stock Actual {renderIconoOrden('cantidad')}
                </th>
                <th className="py-4 px-6 font-bold text-center w-36">Ajustar Stock</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-800 divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-500">
                    <svg className="animate-spin h-8 w-8 mx-auto text-oltech-pink mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Cargando inventario...
                  </td>
                </tr>
              ) : consumiblesPaginados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-500">
                    No se encontraron insumos registrados en esta vista.
                  </td>
                </tr>
              ) : (
                consumiblesPaginados.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6 text-center text-gray-400 font-medium">#{item.id}</td>
                    
                    <td className="py-3 px-6">
                      <span className="font-mono font-bold text-oltech-blue tracking-tight">
                        {item.codigo_referencia}
                      </span>
                    </td>
                    
                    <td className="py-3 px-6 font-medium text-gray-900">
                      {item.nombre}
                    </td>
                    
                    <td className="py-3 px-6 text-center text-gray-500 text-xs font-bold uppercase tracking-wider">
                      {item.unidad_medida || 'N/A'} {/* MEJORA: Corregido a unidad_medida */}
                    </td>
                    
                    <td className="py-3 px-6 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-bold text-sm border ${
                        item.cantidad > 5 ? 'bg-green-50 text-green-700 border-green-200' :
                        item.cantidad > 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {item.cantidad}
                      </span>
                    </td>
                    
                    <td className="py-3 px-6">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => abrirAjuste(item, 'restar')} 
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 flex items-center justify-center transition-colors shadow-sm"
                          title="Restar Stock"
                        >
                          <svg className="w-4 h-4 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4"></path></svg>
                        </button>
                        
                        <button 
                          onClick={() => abrirAjuste(item, 'sumar')} 
                          className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-300 hover:bg-green-50 flex items-center justify-center transition-colors shadow-sm"
                          title="Sumar Stock"
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

      {/* VENTANAS FLOTANTES (MODALES) */}
      <ModalConsumible 
        isOpen={modalNuevoAbierto} 
        onClose={() => setModalNuevoAbierto(false)} 
        onGuardado={cargarConsumibles} 
      />

      <ModalAjusteStock 
        isOpen={modalAjuste.abierto} 
        onClose={() => setModalAjuste({ ...modalAjuste, abierto: false })} 
        onGuardado={cargarConsumibles}
        consumible={modalAjuste.consumible}
        tipoAjuste={modalAjuste.tipo}
      />

    </div>
  );
}

export default VistaConsumibles;