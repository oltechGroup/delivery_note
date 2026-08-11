// almacen-oltech-frontend/src/components/remisiones/ModalSurtirPiezaRetornoCiudad.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalSurtirPiezaRetornoCiudad({ isOpen, onClose, onGuardado, pieza }) {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  const [consumibles, setConsumibles] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [consumibleSeleccionado, setConsumibleSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [tipoSurtido, setTipoSurtido] = useState('consumible'); 
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && pieza) {
      setBusqueda('');
      setConsumibleSeleccionado(null);
      setCantidad(pieza.cantidad_consumo || 1);
      setError('');
      setTipoSurtido('consumible'); 

      // APUNTAMOS AL INVENTARIO DE LA SEDE
      axios.get('http://localhost:4000/api/licitaciones/inventario', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setConsumibles(res.data.consumibles || []))
      .catch(err => console.error("Error al cargar inventario local:", err));
      
      setTimeout(() => {
          if(inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen, pieza, token]);

  if (!isOpen || !pieza) return null;

  const consumiblesFiltrados = consumibles.filter(c => 
    c.codigo_referencia.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const resultadosMostrados = consumiblesFiltrados.slice(0, 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tipoSurtido === 'consumible') {
      if (!consumibleSeleccionado) {
        setError('Debes seleccionar un insumo del inventario local para surtir.');
        return;
      }
      if (cantidad <= 0 || cantidad > consumibleSeleccionado.cantidad) {
        setError(`Cantidad inválida. Solo tienes ${consumibleSeleccionado.cantidad} en tu stock local.`);
        return;
      }
    } else {
      if (cantidad <= 0) {
        setError('Debes especificar una cantidad mayor a cero.');
        return;
      }
    }

    onGuardado({
        detalle_id: pieza.id,
        consumible_id: tipoSurtido === 'consumible' ? consumibleSeleccionado.id : null,
        cantidad_a_surtir: parseInt(cantidad),
        tipo: tipoSurtido
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="bg-oltech-black px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
              <svg className="w-5 h-5 text-oltech-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              <span>Reponer desde Sede</span>
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors shrink-0 ml-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 bg-gray-50">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md">
              <p className="text-xs sm:text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col text-left">
            <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Caja requiere reposición de:</span>
            <div className="flex justify-between items-center">
                <div>
                    <span className="text-sm sm:text-base font-bold text-oltech-blue block">{pieza.pieza_codigo}</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-800 block mt-0.5">{pieza.pieza_descripcion}</span>
                </div>
                <div className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold flex flex-col items-center border border-red-200 shadow-sm">
                    <span className="text-[10px] uppercase">Faltan</span>
                    <span className="text-lg leading-none">{pieza.cantidad_consumo}</span>
                </div>
            </div>
          </div>

          <div className="flex bg-gray-200 p-1 rounded-lg border border-gray-300 shadow-inner">
            <button
              type="button"
              onClick={() => { setTipoSurtido('consumible'); setCantidad(pieza.cantidad_consumo); setError(''); setTimeout(() => {if(inputRef.current) inputRef.current.focus()}, 50); }}
              className={`flex-1 py-2 sm:py-2.5 text-xs font-bold rounded-md transition-all ${
                tipoSurtido === 'consumible' ? 'bg-white text-oltech-black shadow border border-gray-100' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-300/50'
              }`}
            >
              📦 Desde Inventario Sede
            </button>
            <button
              type="button"
              onClick={() => { setTipoSurtido('instrumental'); setCantidad(pieza.cantidad_consumo); setError(''); }}
              className={`flex-1 py-2 sm:py-2.5 text-xs font-bold rounded-md transition-all ${
                tipoSurtido === 'instrumental' ? 'bg-white text-oltech-black shadow border border-gray-100' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-300/50'
              }`}
            >
              ✂️ Físico / Directo
            </button>
          </div>

          {tipoSurtido === 'consumible' && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              {!consumibleSeleccionado ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Buscar en Sede Local:</label>
                  <input 
                    ref={inputRef} type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-oltech-pink text-sm bg-gray-50"
                    placeholder="Escanea o busca material..."
                  />
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {resultadosMostrados.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-500 bg-gray-50">Busca material con stock local.</div>
                    ) : (
                        resultadosMostrados.map(c => (
                          <button 
                            key={c.id} type="button" onClick={() => setConsumibleSeleccionado(c)}
                            className="w-full text-left p-3 hover:bg-pink-50 transition-colors flex justify-between items-center group"
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="text-[10px] sm:text-xs font-bold text-oltech-blue group-hover:text-pink-600 transition-colors">{c.codigo_referencia}</div>
                              <div className="text-xs font-bold text-gray-800 truncate">{c.nombre}</div>
                            </div>
                            <div className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200 group-hover:bg-pink-100 group-hover:text-pink-700">
                              Stock: {c.cantidad}
                            </div>
                          </button>
                        ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex justify-between items-start bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <div className="min-w-0 pr-2">
                        <p className="text-[10px] font-bold text-blue-500 uppercase mb-1">Insumo a descontar (Sede):</p>
                        <div className="text-xs font-bold text-oltech-blue">{consumibleSeleccionado.codigo_referencia}</div>
                        <div className="text-sm font-bold text-gray-800 line-clamp-2">{consumibleSeleccionado.nombre}</div>
                    </div>
                    <button type="button" onClick={() => {setConsumibleSeleccionado(null); setTimeout(() => {if(inputRef.current) inputRef.current.focus()}, 50);}} className="text-[10px] text-red-500 font-bold hover:bg-red-100 px-2 py-1 rounded transition-colors shrink-0">Cambiar</button>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 text-center mb-2">Cantidad a utilizar:</label>
                    <div className="flex justify-center">
                      <input 
                        type="number" min="1" max={consumibleSeleccionado.cantidad} required
                        value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                        className="w-24 px-2 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-oltech-pink text-center font-bold text-xl text-oltech-pink bg-pink-50 shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tipoSurtido === 'instrumental' && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4 animate-in fade-in">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                <p className="text-xs text-amber-800 font-bold flex items-center mb-1">
                  <svg className="w-4 h-4 mr-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  Aviso
                </p>
                <p className="text-[10px] sm:text-xs text-amber-700 leading-tight">
                  Se registrará que esta pieza se repuso físicamente en la caja local. <strong>No se descontará del inventario.</strong>
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 text-center mb-2">Cantidad de piezas encontradas:</label>
                <div className="flex justify-center">
                  <input 
                    type="number" min="1" required value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                    className="w-24 px-2 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-oltech-black text-center font-bold text-xl text-oltech-black bg-gray-50 shadow-inner"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-2">
            <button type="button" onClick={onClose} disabled={cargando} className="w-full sm:w-auto px-4 py-2.5 rounded-lg font-bold text-gray-500 hover:bg-gray-200 border border-gray-300 text-sm">Cancelar</button>
            <button type="submit" disabled={cargando || (tipoSurtido === 'consumible' && !consumibleSeleccionado)} className={`w-full sm:w-auto px-6 py-2.5 text-white rounded-lg font-bold shadow-md disabled:opacity-50 text-sm flex justify-center items-center ${tipoSurtido === 'instrumental' ? 'bg-oltech-black hover:bg-gray-800' : 'bg-oltech-pink hover:bg-pink-700'}`}>Confirmar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalSurtirPiezaRetornoCiudad;