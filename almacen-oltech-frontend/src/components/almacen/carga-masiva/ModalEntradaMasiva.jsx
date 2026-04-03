// almacen-oltech-frontend/src/components/almacen/carga-masiva/ModalEntradaMasiva.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../../hooks/useAuth';
import ModalCreacionRapida from './ModalCreacionRapida';

function ModalEntradaMasiva({ isOpen, onClose, onGuardado, categoriaId }) {
  const { token, usuario } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para el buscador
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const buscadorRef = useRef(null);

  // Estados del Carrito de Entrada
  const [carrito, setCarrito] = useState([]);
  const [observaciones, setObservaciones] = useState('');

  // Estado para el modal de Creación Rápida
  const [modalRapidoAbierto, setModalRapidoAbierto] = useState(false);

  // Efecto para cerrar sugerencias si das clic afuera
  useEffect(() => {
    const handleClickFuera = (event) => {
      if (buscadorRef.current && !buscadorRef.current.contains(event.target)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  // Limpiar el modal cuando se abre
  useEffect(() => {
    if (isOpen) {
      setCarrito([]);
      setObservaciones('');
      setBusqueda('');
      setError('');
    }
  }, [isOpen]);

  // Buscador en tiempo real de consumibles (FILTRADO POR CATEGORÍA)
  useEffect(() => {
    if (busqueda.length > 2) {
      const buscar = async () => {
        try {
          // El query_param categoria_id asegura que solo traiga de ESTA categoría
          const res = await axios.get(`http://localhost:4000/api/almacen/consumibles?categoria_id=${categoriaId || ''}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const filtrados = res.data.filter(c => 
            c.codigo_referencia.toLowerCase().includes(busqueda.toLowerCase()) ||
            c.nombre.toLowerCase().includes(busqueda.toLowerCase())
          );
          setResultados(filtrados.slice(0, 8)); // Mostrar máximo 8 sugerencias
          setMostrarSugerencias(true);
        } catch (err) {
          console.error("Error buscando insumos:", err);
        }
      };
      buscar();
    } else {
      setResultados([]);
      setMostrarSugerencias(false);
    }
  }, [busqueda, token, categoriaId]);

  if (!isOpen) return null;

  // Formatear fecha para el input type="date" (YYYY-MM-DD)
  const formatearFechaParaInput = (fechaISO) => {
    if (!fechaISO) return '';
    return new Date(fechaISO).toISOString().split('T')[0];
  };

  // Agregar un producto al carrito
  const agregarAlCarrito = (producto, esNuevo = false) => {
    if (carrito.find(item => item.consumible_id === producto.id)) {
      setError(`El producto ${producto.codigo_referencia} ya está en la lista.`);
      setMostrarSugerencias(false);
      return;
    }

    setCarrito([{
      consumible_id: producto.id,
      codigo: producto.codigo_referencia,
      nombre: producto.nombre,
      unidad: producto.unidad_medida,
      cantidad_actual: producto.cantidad || 0, 
      cantidad_ingreso: 1, 
      // Si el producto ya tenía lote, lo marcamos como "traiaLoteOriginal" para bloquear el input
      lote: producto.lote || '', 
      traiaLoteOriginal: !!producto.lote, 
      
      // Mismo caso para la caducidad
      fecha_caducidad: formatearFechaParaInput(producto.fecha_caducidad),
      traiaCaducidadOriginal: !!producto.fecha_caducidad,
      
      esNuevo: esNuevo
    }, ...carrito]);
    
    setBusqueda('');
    setMostrarSugerencias(false);
    setError('');
  };

  // Actualizar valores de una fila del carrito
  const actualizarFila = (index, campo, valor) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito[index][campo] = valor;
    setCarrito(nuevoCarrito);
  };

  // Quitar del carrito
  const eliminarDelCarrito = (index) => {
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  // Enviar todo al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (carrito.length === 0) {
      setError('Debes agregar al menos un producto para registrar la entrada.');
      return;
    }

    const cantidadesValidas = carrito.every(item => item.cantidad_ingreso !== '' && item.cantidad_ingreso > 0);
    if (!cantidadesValidas) {
      setError('Todas las cantidades ingresadas deben ser mayores a cero.');
      return;
    }

    setCargando(true);
    setError('');

    const detallesParaBackend = carrito.map(item => ({
      consumible_id: item.consumible_id,
      cantidad: parseInt(item.cantidad_ingreso),
      lote: item.lote,
      fecha_caducidad: item.fecha_caducidad
    }));

    try {
      await axios.post('http://localhost:4000/api/almacen/entradas', {
        observaciones: observaciones,
        detalles: detallesParaBackend
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      onGuardado(); 
      onClose();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al procesar la entrada masiva.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* ENCABEZADO */}
        <div className="bg-oltech-black px-6 py-4 flex justify-between items-center shrink-0 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>📥</span>
              <span>Recepción de Mercancía (Inbound)</span>
            </h2>
            <p className="text-gray-400 text-sm mt-1">Usuario receptor: <span className="text-oltech-pink font-bold">{usuario?.nombre}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col lg:flex-row gap-6">
          
          {/* LADO IZQUIERDO: Buscador y Detalles */}
          <div className="w-full lg:w-1/3 flex flex-col space-y-4">
            
            {/* Buscador */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative" ref={buscadorRef}>
              <label className="block text-sm font-bold text-gray-800 mb-2">1. Buscar producto de esta categoría</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={busqueda} 
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-oltech-pink outline-none text-sm"
                  placeholder="Código o nombre..."
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>

              {/* Sugerencias Flotantes */}
              {mostrarSugerencias && resultados.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                  {resultados.map(prod => (
                    <button 
                      key={prod.id} type="button"
                      onClick={() => agregarAlCarrito(prod)}
                      className="w-full text-left p-3 hover:bg-pink-50 border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <div className="text-xs font-bold text-oltech-blue">{prod.codigo_referencia}</div>
                      <div className="text-sm font-medium text-gray-700 truncate">{prod.nombre}</div>
                      <div className="text-[10px] text-gray-400 mt-1">Stock actual: {prod.cantidad}</div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Botón de Crear Nuevo SIEMPRE VISIBLE */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2 text-center">¿El producto no está en el catálogo?</p>
                <button 
                  type="button"
                  onClick={() => setModalRapidoAbierto(true)}
                  className="w-full py-2 bg-blue-50 text-oltech-blue border border-blue-200 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  <span>Crear Insumo Nuevo</span>
                </button>
              </div>
            </div>

            {/* Observaciones */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex-1">
              <label className="block text-sm font-bold text-gray-800 mb-2">2. Observaciones de Recepción</label>
              <textarea 
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-oltech-pink resize-none text-sm"
                rows="4"
                placeholder="Ej. Factura #1234, entregado por FedEx..."
              ></textarea>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 font-bold">
                {error}
              </div>
            )}
          </div>

          {/* LADO DERECHO: El Carrito Ampliado */}
          <div className="w-full lg:w-2/3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">3. Lista de Ingreso (Carrito)</h3>
              <span className="bg-oltech-blue text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                {carrito.length} productos listos
              </span>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[600px] p-0">
              {carrito.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-gray-400">
                  <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                  <p className="text-lg font-medium text-gray-500">El carrito de entrada está vacío</p>
                  <p className="text-sm mt-1">Busca y selecciona productos a la izquierda para agregarlos a la lista de recepción.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-600">
                      <th className="p-3 font-bold w-48">Producto</th>
                      <th className="p-3 font-bold text-center w-20 border-l border-gray-200">Stock Actual</th>
                      <th className="p-3 font-bold text-center w-24 bg-blue-50 text-blue-800 border-x border-gray-200">+ Ingreso</th>
                      <th className="p-3 font-bold text-center w-24 bg-green-50 text-green-800 border-r border-gray-200">= Final</th>
                      <th className="p-3 font-bold w-32">Lote</th>
                      <th className="p-3 font-bold w-36">Caducidad</th>
                      <th className="p-3 font-bold text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    {carrito.map((item, idx) => {
                      const cantidadIngreso = item.cantidad_ingreso === '' ? 0 : parseInt(item.cantidad_ingreso);
                      const stockFinal = item.cantidad_actual + cantidadIngreso;

                      return (
                        <tr key={idx} className={`transition-colors ${item.esNuevo ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}>
                          <td className="p-3">
                            <div className="font-bold text-oltech-blue text-xs flex items-center space-x-1">
                              {item.esNuevo && <span className="w-2 h-2 rounded-full bg-blue-500 inline-block mr-1" title="Producto Nuevo"></span>}
                              {item.codigo}
                            </div>
                            <div className="font-medium text-gray-800 line-clamp-2 text-xs mt-0.5">{item.nombre}</div>
                          </td>
                          
                          <td className="p-3 text-center font-medium text-gray-500 border-l border-gray-100 bg-gray-50/50">
                            {item.cantidad_actual}
                          </td>

                          <td className="p-3 border-x border-blue-100 bg-blue-50/30">
                            <input 
                              type="number" min="1" required
                              value={item.cantidad_ingreso}
                              onChange={(e) => actualizarFila(idx, 'cantidad_ingreso', e.target.value === '' ? '' : e.target.value)}
                              className="w-full px-2 py-1.5 border border-blue-300 rounded text-center font-bold text-oltech-blue focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </td>

                          <td className="p-3 text-center font-bold text-green-700 bg-green-50/30 border-r border-green-100 text-base">
                            {stockFinal}
                          </td>

                          <td className="p-3">
                            <input 
                              type="text" placeholder="Lote (Opcional)"
                              value={item.lote}
                              disabled={item.traiaLoteOriginal} // BLOQUEADO SI YA TENÍA LOTE
                              onChange={(e) => actualizarFila(idx, 'lote', e.target.value.toUpperCase())}
                              className={`w-full px-2 py-1.5 border rounded outline-none text-xs uppercase font-mono ${item.traiaLoteOriginal ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 focus:ring-1 focus:ring-oltech-pink bg-white'}`}
                              title={item.traiaLoteOriginal ? "El lote ya está registrado en sistema." : ""}
                            />
                          </td>
                          
                          <td className="p-3">
                            <input 
                              type="date"
                              value={item.fecha_caducidad}
                              disabled={item.traiaCaducidadOriginal} // BLOQUEADO SI YA TENÍA FECHA
                              onChange={(e) => actualizarFila(idx, 'fecha_caducidad', e.target.value)}
                              className={`w-full px-2 py-1.5 border rounded outline-none text-[11px] ${item.traiaCaducidadOriginal ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'border-gray-300 focus:ring-1 focus:ring-oltech-pink bg-white text-gray-700'}`}
                              title={item.traiaCaducidadOriginal ? "La fecha ya está registrada en sistema." : ""}
                            />
                          </td>
                          
                          <td className="p-3 text-center">
                            <button type="button" onClick={() => eliminarDelCarrito(idx)} className="text-gray-400 hover:text-red-600 bg-gray-100 hover:bg-red-50 p-1.5 rounded transition-colors" title="Quitar de la lista">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* PIE DEL MODAL */}
        <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 shrink-0 rounded-b-2xl">
          <button type="button" onClick={onClose} disabled={cargando} className="px-6 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200">
            Cancelar Entrada
          </button>
          <button 
            type="button" onClick={handleSubmit} 
            disabled={cargando || carrito.length === 0} 
            className="px-8 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2 shadow-md"
          >
            {cargando ? 'Procesando...' : 'Confirmar Ingreso a Stock'}
          </button>
        </div>

      </div>

      {/* MODAL SOBRE MODAL: Creador Rápido */}
      <ModalCreacionRapida 
        isOpen={modalRapidoAbierto}
        onClose={() => setModalRapidoAbierto(false)}
        categoriaId={categoriaId} // Le pasamos la categoría actual para que lo guarde ahí
        onProductoCreado={(nuevoProducto) => {
          agregarAlCarrito(nuevoProducto, true); // true = esNuevo, se pintará azul
        }}
      />
    </div>
  );
}

export default ModalEntradaMasiva;