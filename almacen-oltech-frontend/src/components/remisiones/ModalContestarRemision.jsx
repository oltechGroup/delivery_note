// almacen-oltech-frontend/src/components/remisiones/ModalContestarRemision.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalContestarRemision({ isOpen, onClose, remisionId, onGuardado }) {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  const [remision, setRemision] = useState(null);
  const [detalles, setDetalles] = useState([]);
  // NUEVO: Estado para las observaciones de la remisión
  const [observaciones, setObservaciones] = useState('');
  
  // Estados para el Paso 2 (Reposición de Sets)
  const [paso, setPaso] = useState(1); 
  const [consumibles, setConsumibles] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [consumibleSeleccionado, setConsumibleSeleccionado] = useState(null);
  const [cantidadReposicion, setCantidadReposicion] = useState(1);
  const [reposiciones, setReposiciones] = useState([]);

  const isCompletada = remision?.estado_nombre?.toLowerCase().includes('finalizada') || remision?.estado_nombre?.toLowerCase().includes('completad') || remision?.estado_nombre?.toLowerCase().includes('cerrad');
  const piezasSetConsumidas = detalles.filter(d => d.set_id && d.cantidad_consumo > 0);
  const necesitaReposicion = piezasSetConsumidas.length > 0;

  useEffect(() => {
    if (isOpen && remisionId) {
      cargarDatosRemision();
      setPaso(1);
      setReposiciones([]);
      setBusqueda('');
      setConsumibleSeleccionado(null);
      setObservaciones(''); // Limpiamos observaciones al abrir nueva
    }
  }, [isOpen, remisionId, token]);

  const cargarDatosRemision = async () => {
    setCargando(true);
    setError('');
    try {
      const resRemision = await axios.get(`http://localhost:4000/api/remisiones/${remisionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRemision(resRemision.data);
      // NUEVO: Cargar observaciones si la remisión ya las tiene
      if (resRemision.data.observaciones) {
          setObservaciones(resRemision.data.observaciones);
      }

      const resDetalles = await axios.get(`http://localhost:4000/api/remisiones/${remisionId}/detalles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const esCerrada = resRemision.data.estado_nombre?.toLowerCase().includes('finalizada') || resRemision.data.estado_nombre?.toLowerCase().includes('completad') || resRemision.data.estado_nombre?.toLowerCase().includes('cerrad');
      
      const detallesReales = resDetalles.data.filter(d => !d.es_total && (d.pieza_id || d.consumible_id));

      const detallesFormateados = detallesReales.map(d => ({
        ...d,
        cantidad_consumo: esCerrada ? d.cantidad_consumo : 0,
        cantidad_retorno: esCerrada ? d.cantidad_retorno : d.cantidad_despachada
      }));
      setDetalles(detallesFormateados);

    } catch (err) {
      console.error('Error al cargar datos de conciliación:', err);
      setError('No se pudo cargar la información de la remisión.');
    } finally {
      setCargando(false);
    }
  };

  const cargarConsumibles = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/almacen/consumibles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConsumibles(res.data);
    } catch (err) {
      console.error("Error al cargar consumibles:", err);
      setError('Error al cargar el inventario a granel para la reposición.');
    }
  };

  const handleConsumoChange = (detalleId, nuevoConsumoStr) => {
    if (isCompletada) return;

    const nuevoConsumo = parseInt(nuevoConsumoStr) || 0;
    setDetalles(prev => prev.map(d => {
      if (d.id === detalleId) {
        let consumoFinal = nuevoConsumo;
        if (consumoFinal < 0) consumoFinal = 0;
        if (consumoFinal > d.cantidad_despachada) consumoFinal = d.cantidad_despachada;

        return {
          ...d,
          cantidad_consumo: consumoFinal,
          cantidad_retorno: d.cantidad_despachada - consumoFinal 
        };
      }
      return d;
    }));
  };

  const handleSiguientePaso = () => {
    if (necesitaReposicion) {
      cargarConsumibles();
      setPaso(2);
    } else {
      // Si no hubo consumo en sets, pasamos directamente a poner observaciones si se quiere
      setPaso(2); 
    }
  };

  const consumiblesFiltrados = consumibles.filter(c => 
    c.codigo_referencia.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.nombre_comercial && c.nombre_comercial.toLowerCase().includes(busqueda.toLowerCase()))
  ).slice(0, 5); 

  const agregarAReposicion = () => {
    if (!consumibleSeleccionado) return;
    if (cantidadReposicion <= 0 || cantidadReposicion > consumibleSeleccionado.cantidad) {
      setError(`Cantidad inválida. Solo tienes ${consumibleSeleccionado.cantidad} en stock.`);
      return;
    }

    setReposiciones(prev => [...prev, {
      id_temp: Date.now(),
      consumible_id: consumibleSeleccionado.id,
      codigo: consumibleSeleccionado.codigo_referencia,
      nombre: consumibleSeleccionado.nombre,
      nombre_comercial: consumibleSeleccionado.nombre_comercial,
      cantidad_a_surtir: parseInt(cantidadReposicion)
    }]);

    setBusqueda('');
    setConsumibleSeleccionado(null);
    setCantidadReposicion(1);
    setError('');
  };

  const quitarDeReposicion = (id_temp) => {
    setReposiciones(prev => prev.filter(r => r.id_temp !== id_temp));
  };

  const handleConciliarGuardar = async () => {
    let mensajeConfirmacion = '¿Estás seguro de finalizar? El inventario se ajustará y la remisión se cerrará.';
    if (necesitaReposicion && reposiciones.length === 0) {
        mensajeConfirmacion = 'No has repuesto el material consumido. Los Sets afectados se marcarán como INCOMPLETOS. ¿Deseas continuar?';
    }

    if (!window.confirm(mensajeConfirmacion)) {
      return;
    }

    setCargando(true);
    setError('');

    try {
      await axios.post(`http://localhost:4000/api/remisiones/${remisionId}/conciliar`, {
        detalles: detalles,
        observaciones: observaciones, // <--- NUEVO: Mandamos observaciones al backend
        reposiciones: reposiciones.map(r => ({
          consumible_id: r.consumible_id,
          cantidad_a_surtir: r.cantidad_a_surtir
        }))
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert('¡Remisión conciliada con éxito!');
      onGuardado(); 
      onClose(); 
    } catch (err) {
      console.error('Error al conciliar:', err);
      setError(err.response?.data?.mensaje || 'Ocurrió un error al intentar conciliar la remisión.');
    } finally {
      setError(''); 
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* ENCABEZADO */}
        <div className={`px-6 py-4 flex justify-between items-center shrink-0 ${isCompletada ? 'bg-green-700' : 'bg-oltech-black'}`}>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              {isCompletada ? <span>📁</span> : <span>✅</span>}
              <span>{isCompletada ? 'Resumen Histórico de Remisión' : 'Conciliar Remisión (Retorno)'}</span>
            </h2>
            {remision && (
              <p className="text-white/80 text-sm font-medium mt-0.5">
                Solicitud: {remision.no_solicitud} | {remision.unidad_medica_nombre}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-black/20 p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 font-medium mb-6 shrink-0">
              {error}
            </div>
          )}

          {cargando && detalles.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
              <svg className="animate-spin h-10 w-10 text-oltech-pink mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="text-gray-500 font-medium">Cargando datos...</p>
            </div>
          ) : paso === 1 ? (
            <div className="space-y-6">
              
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Paciente</p>
                  <p className="text-sm font-bold text-gray-800">{remision?.paciente}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Médico</p>
                  <p className="text-sm font-bold text-gray-800">{remision?.medico_nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Estado</p>
                  <p className={`text-sm font-bold ${isCompletada ? 'text-green-600' : 'text-amber-600'}`}>{remision?.estado_nombre}</p>
                </div>
              </div>

              {isCompletada && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded text-sm text-blue-800 font-medium">
                  Esta remisión ya fue procesada y cerrada. Los inventarios fueron actualizados.
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100">
                    <tr className="border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-wider">
                      <th className="p-3 w-40">Ref / Lote</th>
                      <th className="p-3">Descripción</th>
                      <th className="p-3 w-24 text-center bg-blue-50 border-l border-blue-100">DESPACHO</th>
                      <th className="p-3 w-28 text-center bg-red-50 border-l border-red-100">CONSUMO</th>
                      <th className="p-3 w-24 text-center bg-green-50 border-l border-green-100">RETORNO</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-700 divide-y divide-gray-100">
                    {detalles.map((d) => {
                      const esConsumible = d.consumible_id && !d.set_id;
                      return (
                        <tr key={d.id} className="hover:bg-gray-50">
                          <td className="p-3">
                            <span className="font-bold text-oltech-blue">{d.pieza_codigo || d.consumible_codigo}</span>
                            <div className="text-[9px] text-gray-400 mt-0.5">
                              {esConsumible ? 'Consumible Extra' : `De Set: ${d.set_codigo || ''}`}
                            </div>
                          </td>
                          <td className="p-3 font-medium text-gray-800">
                            {d.pieza_descripcion || d.consumible_nombre}
                          </td>
                          
                          <td className="p-3 bg-blue-50/30 border-l border-blue-100 text-center font-bold text-blue-700 text-sm">
                            {d.cantidad_despachada}
                          </td>
                          
                          <td className="p-3 bg-red-50/50 border-l border-red-100 text-center">
                            {isCompletada ? (
                              <span className="font-bold text-red-600 text-sm">{d.cantidad_consumo}</span>
                            ) : (
                              <input 
                                type="number" 
                                min="0" max={d.cantidad_despachada}
                                value={d.cantidad_consumo}
                                onChange={(e) => handleConsumoChange(d.id, e.target.value)}
                                className="w-16 px-2 py-1.5 text-center border border-red-200 rounded font-bold text-red-600 focus:ring-2 focus:ring-red-400 outline-none bg-white shadow-inner"
                              />
                            )}
                          </td>

                          <td className="p-3 bg-green-50/30 border-l border-green-100 text-center font-bold text-green-700 text-sm">
                            {d.cantidad_retorno}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* NUEVO: Campo de Observaciones en Modo Lectura (Si ya está completada) */}
              {isCompletada && (
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mt-4">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Observaciones de la Cirugía:</p>
                  <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-100">
                    {observaciones || <span className="text-gray-400 italic">No se registraron observaciones.</span>}
                  </p>
                </div>
              )}

            </div>
          ) : (
            <div className="space-y-6 flex-1 flex flex-col">
              
              {necesitaReposicion ? (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-md">
                  <h3 className="font-bold text-amber-800 flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    <span>Sets Incompletos Detectados</span>
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Se ha detectado consumo en los Sets. Puedes reponer el material ahora o continuar y los Sets quedarán en estado "Incompleto".
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
                  <h3 className="font-bold text-blue-800 flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span>Todo Completo</span>
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    No hubo consumo de piezas pertenecientes a Sets. Puedes agregar observaciones (opcional) y finalizar.
                  </p>
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-6">
                
                {/* LADO IZQUIERDO: Resumen Faltantes o Cero Consumo */}
                <div className="w-full lg:w-1/2 flex flex-col space-y-4">
                  {necesitaReposicion && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex-1">
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Piezas Faltantes:</h4>
                      <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                        {piezasSetConsumidas.map(p => (
                          <li key={p.id} className="p-3 bg-red-50/30 flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold text-oltech-blue">{p.pieza_codigo}</p>
                              <p className="text-sm text-gray-700">{p.pieza_descripcion}</p>
                            </div>
                            <div className="bg-red-100 text-red-700 px-3 py-1 rounded font-bold text-sm">Faltan {p.cantidad_consumo}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* NUEVO: Cajita de texto para las observaciones de la cirugía */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                     <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Observaciones Generales (Opcional):</h4>
                     <textarea 
                        rows="3"
                        placeholder="Ej. Se perdió una pinza Kelly, o el doctor solicitó X material extra..."
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-oltech-pink text-sm text-gray-800 bg-gray-50"
                     />
                  </div>
                </div>

                {/* LADO DERECHO: Reposición de Inventario (Solo si aplica) */}
                {necesitaReposicion && (
                  <div className="w-full lg:w-1/2 bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Surtido desde Inventario:</h4>
                    
                    {!consumibleSeleccionado ? (
                      <div className="relative mb-4">
                        <input 
                          type="text" 
                          value={busqueda} 
                          onChange={(e) => setBusqueda(e.target.value)} 
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-oltech-pink text-sm"
                          placeholder="Buscar por código, nombre o marca..."
                        />
                        {busqueda.length >= 3 && (
                          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-10 overflow-hidden divide-y divide-gray-100">
                            {consumiblesFiltrados.length === 0 ? (
                              <div className="p-3 text-center text-xs text-gray-500">Sin resultados disponibles.</div>
                            ) : (
                              consumiblesFiltrados.map(c => (
                                <button 
                                  key={c.id} type="button" onClick={() => setConsumibleSeleccionado(c)}
                                  className="w-full text-left p-3 hover:bg-pink-50 transition-colors flex justify-between items-center"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-bold text-oltech-blue">{c.codigo_referencia}</div>
                                    <div className="text-sm font-medium text-gray-800 truncate">{c.nombre}</div>
                                    {c.nombre_comercial && <div className="text-[10px] text-gray-500 italic truncate">{c.nombre_comercial}</div>}
                                  </div>
                                  <div className="text-xs font-bold px-2 py-1 rounded-full bg-green-100 text-green-700 ml-2">Stock: {c.cantidad}</div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-oltech-blue">{consumibleSeleccionado.codigo_referencia}</div>
                            <div className="text-sm font-medium text-gray-800 truncate">{consumibleSeleccionado.nombre}</div>
                            {consumibleSeleccionado.nombre_comercial && <div className="text-[10px] text-gray-500 italic">{consumibleSeleccionado.nombre_comercial}</div>}
                          </div>
                          <button type="button" onClick={() => setConsumibleSeleccionado(null)} className="text-xs text-red-500 font-bold hover:underline shrink-0 ml-2">Cambiar</button>
                        </div>
                        <div className="flex items-center space-x-3 mt-3">
                          <input 
                            type="number" min="1" max={consumibleSeleccionado.cantidad} 
                            value={cantidadReposicion} onChange={(e) => setCantidadReposicion(e.target.value)}
                            className="w-20 px-2 py-1 text-center border border-blue-300 rounded font-bold focus:ring-2 focus:ring-oltech-pink outline-none"
                          />
                          <button type="button" onClick={agregarAReposicion} className="px-3 py-1 bg-oltech-pink text-white font-bold rounded text-xs hover:bg-pink-700">Añadir</button>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 flex flex-col border border-gray-100 rounded-lg overflow-hidden bg-gray-50">
                      <div className="bg-gray-200 px-3 py-2 text-[10px] font-bold text-gray-600 uppercase">Material a Extraer</div>
                      <div className="flex-1 p-2 overflow-y-auto">
                        {reposiciones.length === 0 ? (
                          <div className="text-center text-xs text-gray-400 mt-4 italic">No se han añadido reposiciones.</div>
                        ) : (
                          <ul className="space-y-2">
                            {reposiciones.map(r => (
                              <li key={r.id_temp} className="bg-white border border-green-200 p-2 rounded flex justify-between items-center shadow-sm">
                                <div className="min-w-0 flex-1">
                                  <span className="text-[10px] font-bold text-green-700">Cantidad: {r.cantidad_a_surtir}</span>
                                  <p className="text-xs font-bold text-gray-800 truncate">{r.codigo}</p>
                                  {r.nombre_comercial && <p className="text-[9px] text-gray-500 italic truncate">{r.nombre_comercial}</p>}
                                </div>
                                <button type="button" onClick={() => quitarDeReposicion(r.id_temp)} className="text-gray-400 hover:text-red-500 ml-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                  </div>
                )}

              </div>
            </div>
          )}
        </div>

        <div className="bg-white px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center shrink-0 gap-4">
          <div className="flex space-x-3 w-full sm:w-auto ml-auto">
            {isCompletada ? (
              <button type="button" onClick={onClose} className="w-full sm:w-auto px-8 py-2.5 bg-oltech-black text-white rounded-lg font-bold shadow-md hover:bg-gray-800 transition-colors">Cerrar Ventana</button>
            ) : (
              <>
                <button type="button" onClick={paso === 2 ? () => setPaso(1) : onClose} disabled={cargando} className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200">{paso === 2 ? 'Regresar' : 'Cancelar'}</button>
                {paso === 1 ? (
                  <button type="button" onClick={handleSiguientePaso} disabled={cargando || detalles.length === 0} className="w-full sm:w-auto px-6 py-2.5 bg-oltech-black text-white rounded-lg font-bold shadow-md hover:bg-gray-800 transition-colors flex items-center space-x-2">
                    <span>{necesitaReposicion ? 'Siguiente: Revisar Faltantes' : 'Siguiente: Confirmar'}</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                  </button>
                ) : (
                  <button type="button" onClick={handleConciliarGuardar} disabled={cargando} className={`w-full sm:w-auto px-6 py-2.5 text-white rounded-lg font-bold shadow-md transition-colors flex items-center justify-center space-x-2 ${reposiciones.length === 0 && necesitaReposicion ? 'bg-amber-600 hover:bg-amber-700' : 'bg-oltech-pink hover:bg-pink-700'}`}>
                    {cargando && <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    <span>{reposiciones.length === 0 && necesitaReposicion ? 'Cerrar con Faltantes' : 'Confirmar y Finalizar'}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ModalContestarRemision;