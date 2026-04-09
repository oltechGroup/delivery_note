// almacen-oltech-frontend/src/components/almacen/ModalSurtirPieza.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalSurtirPieza({ isOpen, onClose, onGuardado, piezaSet }) {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  // Catálogo de consumibles y buscador
  const [consumibles, setConsumibles] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [consumibleSeleccionado, setConsumibleSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setBusqueda('');
      setConsumibleSeleccionado(null);
      setCantidad(1);
      setError('');

      // Cargar el inventario (El backend ya devuelve la lista limpia por defecto)
      axios.get('http://localhost:4000/api/almacen/consumibles', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setConsumibles(res.data))
      .catch(err => console.error("Error al cargar consumibles:", err));
    }
  }, [isOpen, token]);

  if (!isOpen || !piezaSet) return null;

  // Filtrar consumibles según la búsqueda (ACTUALIZADO: Incluye nombre_comercial)
  const consumiblesFiltrados = consumibles.filter(c => 
    c.codigo_referencia.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.nombre_comercial && c.nombre_comercial.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const LIMITE_RESULTADOS = 10;
  const resultadosMostrados = consumiblesFiltrados.slice(0, LIMITE_RESULTADOS);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consumibleSeleccionado) {
      setError('Debes seleccionar un insumo del inventario para surtir.');
      return;
    }
    if (cantidad <= 0 || cantidad > consumibleSeleccionado.cantidad) {
      setError(`Cantidad inválida. Solo tienes ${consumibleSeleccionado.cantidad} en stock.`);
      return;
    }

    setCargando(true);
    setError('');

    try {
      await axios.post(`http://localhost:4000/api/almacen/composicion/${piezaSet.composicion_id}/surtir`, {
        consumible_id: consumibleSeleccionado.id,
        cantidad_a_surtir: parseInt(cantidad)
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      // Llamamos a onGuardado con un "true" para indicarle al padre que refresque sus datos
      onGuardado(true);
      onClose();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al procesar el reabastecimiento.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado */}
        <div className="bg-oltech-pink px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">Surtir Pieza</h2>
            <p className="text-pink-100 text-xs font-medium">Desde Inventario a Granel hacia el Set</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Info de la pieza destino */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col items-center text-center">
            <span className="text-xs font-bold text-gray-500 uppercase">Destino: {piezaSet.pieza_codigo}</span>
            <span className="text-sm font-bold text-gray-800">{piezaSet.pieza_descripcion}</span>
          </div>

          {!consumibleSeleccionado ? (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">1. Busca el insumo a utilizar:</label>
              <input 
                type="text" autoFocus
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-oltech-pink text-sm"
                placeholder="Escribe código o nombre para buscar..."
              />
              
              <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {resultadosMostrados.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">No hay insumos disponibles.</div>
                ) : (
                  <>
                    {resultadosMostrados.map(c => (
                      <button 
                        key={c.id} type="button" 
                        onClick={() => setConsumibleSeleccionado(c)}
                        className="w-full text-left p-3 hover:bg-pink-50 transition-colors flex justify-between items-center"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-oltech-blue">{c.codigo_referencia}</div>
                          <div className="text-sm font-medium text-gray-800 truncate">{c.nombre}</div>
                          {/* VISUALIZACIÓN: NOMBRE COMERCIAL */}
                          {c.nombre_comercial && <div className="text-[10px] text-gray-500 italic truncate">{c.nombre_comercial}</div>}
                        </div>
                        <div className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700 ml-2">
                          Stock: {c.cantidad}
                        </div>
                      </button>
                    ))}
                    
                    {consumiblesFiltrados.length > LIMITE_RESULTADOS && (
                      <div className="p-2 text-center text-[10px] text-gray-400 bg-gray-50 uppercase font-bold tracking-wider">
                        Sigue escribiendo para filtrar mas resultados...
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <label className="block text-sm font-bold text-gray-700">Insumo Seleccionado:</label>
              <div className="flex justify-between items-center bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-oltech-blue">{consumibleSeleccionado.codigo_referencia}</div>
                  <div className="text-sm font-medium text-gray-800 truncate">{consumibleSeleccionado.nombre}</div>
                  {consumibleSeleccionado.nombre_comercial && <div className="text-[10px] text-gray-500 italic">{consumibleSeleccionado.nombre_comercial}</div>}
                </div>
                <button type="button" onClick={() => setConsumibleSeleccionado(null)} className="text-xs text-red-500 font-bold hover:underline px-2 py-1 shrink-0">Cambiar</button>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 text-center mb-2">2. ¿Cuántas piezas vas a meter a la caja?</label>
                <div className="flex justify-center">
                  <input 
                    type="number" min="1" max={consumibleSeleccionado.cantidad} required autoFocus
                    value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-oltech-pink text-center font-bold text-2xl text-oltech-pink bg-pink-50 shadow-inner"
                  />
                </div>
                <p className="text-center text-xs font-medium text-gray-500 mt-2">Max disponible en inventario: {consumibleSeleccionado.cantidad}</p>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-between space-x-3 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={cargando} className="w-full py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200">
              Cancelar
            </button>
            <button type="submit" disabled={cargando || !consumibleSeleccionado} className="w-full py-2.5 text-white bg-oltech-pink hover:bg-pink-700 rounded-lg font-bold shadow-md transition-colors disabled:opacity-50 flex justify-center items-center space-x-2">
              {cargando && <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              <span>Confirmar Surtido</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ModalSurtirPieza;