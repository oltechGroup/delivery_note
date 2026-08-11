// almacen-oltech-frontend/src/components/remisiones/ModalContestarRemisionCiudad.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import ModalSurtirPiezaRetornoCiudad from './ModalSurtirPiezaRetornoCiudad';

function ModalContestarRemisionCiudad({ isOpen, onClose, remisionId, onGuardado }) {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  const [remision, setRemision] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [observaciones, setObservaciones] = useState('');
  const [codigoEscaneadoRetorno, setCodigoEscaneadoRetorno] = useState('');
  const inputEscanerRef = useRef(null);

  const [paso, setPaso] = useState(1); 
  const [modalSurtirAbierto, setModalSurtirAbierto] = useState(false);
  const [piezaAReponer, setPiezaAReponer] = useState(null);
  const [reposiciones, setReposiciones] = useState([]);

  const isCompletada = remision?.estado_nombre?.toLowerCase().includes('finalizada') || remision?.estado_nombre?.toLowerCase().includes('completad') || remision?.estado_nombre?.toLowerCase().includes('cerrad');
  const piezasSetConsumidas = detalles.filter(d => d.set_id && d.cantidad_consumo > 0);
  const necesitaReposicion = piezasSetConsumidas.length > 0;

  useEffect(() => {
    if (isOpen && remisionId) {
      cargarDatosRemision();
      setPaso(1);
      setReposiciones([]);
      setObservaciones(''); 
      setCodigoEscaneadoRetorno('');
    }
  }, [isOpen, remisionId, token]);

  useEffect(() => {
    if (isOpen && !isCompletada && paso === 1 && inputEscanerRef.current) {
        setTimeout(() => inputEscanerRef.current.focus(), 100);
    }
  }, [isOpen, isCompletada, paso]);

  const cargarDatosRemision = async () => {
    setCargando(true);
    setError('');
    try {
      // APUNTAMOS A LOS ENDPOINTS DE CIUDAD
      const resRemision = await axios.get(`http://localhost:4000/api/remisiones-ciudad/${remisionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRemision(resRemision.data);
      if (resRemision.data.observaciones) setObservaciones(resRemision.data.observaciones);

      const resDetalles = await axios.get(`http://localhost:4000/api/remisiones-ciudad/${remisionId}/detalles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const esCerrada = resRemision.data.estado_nombre?.toLowerCase().includes('finalizada') || resRemision.data.estado_nombre?.toLowerCase().includes('completad') || resRemision.data.estado_nombre?.toLowerCase().includes('cerrad');
      const detallesReales = resDetalles.data.filter(d => !d.es_total);

      const detallesFormateados = detallesReales.map(d => ({
        ...d,
        cantidad_consumo: esCerrada ? d.cantidad_consumo : d.cantidad_despachada, 
        cantidad_retorno: esCerrada ? d.cantidad_retorno : 0 
      }));
      setDetalles(detallesFormateados);
    } catch (err) {
      setError('No se pudo cargar la información de la remisión local.');
    } finally {
      setCargando(false);
    }
  };

  const handleConsumoChange = (detalleId, nuevoConsumoStr) => {
    if (isCompletada) return;
    const nuevoConsumo = parseInt(nuevoConsumoStr) || 0;
    setDetalles(prev => prev.map(d => {
      if (d.id === detalleId) {
        let consumoFinal = nuevoConsumo < 0 ? 0 : nuevoConsumo > d.cantidad_despachada ? d.cantidad_despachada : nuevoConsumo;
        return { ...d, cantidad_consumo: consumoFinal, cantidad_retorno: d.cantidad_despachada - consumoFinal };
      }
      return d;
    }));
  };

  const handleKeyDownEscaneoRetorno = (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        setError('');
        const codigoBuscado = codigoEscaneadoRetorno.trim().toLowerCase();
        if (!codigoBuscado) return;

        const setEncontrado = detalles.find(d => !d.pieza_id && !d.consumible_id && d.set_codigo && d.set_codigo.toLowerCase() === codigoBuscado);
        if (setEncontrado) {
            if (window.confirm(`¿El Set "${setEncontrado.set_codigo}" llegó completamente lleno (Sin faltantes)?`)) {
                setDetalles(prev => prev.map(d => d.set_id === setEncontrado.set_id ? { ...d, cantidad_retorno: d.cantidad_despachada, cantidad_consumo: 0 } : d));
            }
            setCodigoEscaneadoRetorno('');
            return;
        }

        const indicesFilas = [];
        detalles.forEach((d, idx) => {
            if ((d.pieza_codigo && d.pieza_codigo.toLowerCase() === codigoBuscado) || (d.consumible_codigo && d.consumible_codigo.toLowerCase() === codigoBuscado)) {
                indicesFilas.push(idx);
            }
        });

        if (indicesFilas.length > 0) {
            let filaActualizada = false;
            const nuevosDetalles = [...detalles];
            for (let idx of indicesFilas) {
                const fila = nuevosDetalles[idx];
                if (fila.cantidad_retorno < fila.cantidad_despachada) {
                    nuevosDetalles[idx] = { ...fila, cantidad_retorno: fila.cantidad_retorno + 1, cantidad_consumo: fila.cantidad_consumo - 1 };
                    filaActualizada = true;
                    break; 
                }
            }
            if (filaActualizada) setDetalles(nuevosDetalles);
            else setError(`El código ${codigoBuscado.toUpperCase()} ya fue retornado completamente en todas sus filas.`);
        } else {
            setError(`El código escaneado (${codigoBuscado.toUpperCase()}) NO pertenece a esta remisión local.`);
        }
        setCodigoEscaneadoRetorno('');
    }
  };

  const handleSiguientePaso = () => {
    setReposiciones([]);
    setPaso(2); 
  };

  const abrirSurtidoPieza = (pieza) => {
      setPiezaAReponer(pieza);
      setModalSurtirAbierto(true);
  };

  const handleGuardarReposicion = (datosReposicion) => {
      setReposiciones(prev => [...prev, datosReposicion]);
      setModalSurtirAbierto(false);
      setPiezaAReponer(null);
  };

  const quitarReposicion = (detalle_id) => {
      setReposiciones(prev => prev.filter(r => r.detalle_id !== detalle_id));
  };

  const handleConciliarGuardar = async () => {
    let mensajeConfirmacion = '¿Estás seguro de finalizar? El inventario de tu Sede se ajustará.';
    const piezasSinReponer = piezasSetConsumidas.filter(p => !reposiciones.some(r => r.detalle_id === p.id));
    if (necesitaReposicion && piezasSinReponer.length > 0) {
        mensajeConfirmacion = 'Hay material faltante que NO has repuesto. Los Sets de tu Sede quedarán INCOMPLETOS. ¿Continuar?';
    }

    if (!window.confirm(mensajeConfirmacion)) return;

    setCargando(true);
    setError('');
    try {
      // APUNTAMOS AL ENDPOINT DE CONCILIACIÓN LOCAL
      await axios.post(`http://localhost:4000/api/remisiones-ciudad/${remisionId}/conciliar`, {
        detalles: detalles,
        observaciones: observaciones,
        reposiciones: reposiciones 
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert('¡Remisión local conciliada con éxito!');
      onGuardado(); 
      onClose(); 
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al intentar conciliar la remisión local.');
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        <div className={`px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-start sm:items-center shrink-0 ${isCompletada ? 'bg-green-700' : 'bg-oltech-black'}`}>
          <div className="pr-4">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
              {isCompletada ? <span>📁</span> : <span>✅</span>}
              <span>{isCompletada ? 'Resumen de Sede' : 'Conciliar Retorno Local'}</span>
            </h2>
            {remision && <p className="text-white/80 text-xs sm:text-sm font-medium mt-1">Solicitud: {remision.no_solicitud} | {remision.unidad_medica_nombre}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-black/20 p-1.5 sm:p-2 rounded-lg shrink-0">✖</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 flex flex-col">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-lg text-xs sm:text-sm border border-red-100 font-medium mb-4 sm:mb-6 shrink-0 flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-500 font-bold ml-2">✖</button>
            </div>
          )}

          {cargando && detalles.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 min-h-[200px]">
              <p className="text-gray-500 font-medium text-sm sm:text-base">Cargando datos locales...</p>
            </div>
          ) : paso === 1 ? (
            <div className="space-y-4 sm:space-y-6">
              
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="w-full sm:w-auto"><p className="text-[10px] sm:text-xs text-gray-500 uppercase font-bold tracking-wide">Paciente</p><p className="text-xs sm:text-sm font-bold text-gray-800">{remision?.paciente}</p></div>
                <div className="w-full sm:text-center sm:w-auto"><p className="text-[10px] sm:text-xs text-gray-500 uppercase font-bold tracking-wide">Médico</p><p className="text-xs sm:text-sm font-bold text-gray-800">{remision?.medico_nombre}</p></div>
                <div className="w-full sm:text-right sm:w-auto"><p className="text-[10px] sm:text-xs text-gray-500 uppercase font-bold tracking-wide">Estado</p><p className={`text-xs sm:text-sm font-bold ${isCompletada ? 'text-green-600' : 'text-amber-600'}`}>{remision?.estado_nombre}</p></div>
              </div>

              {!isCompletada && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full flex-1">
                    <p className="text-xs font-bold text-green-800 mb-1 uppercase tracking-wide">Escanear retorno a Sede</p>
                    <input 
                      ref={inputEscanerRef} type="text" value={codigoEscaneadoRetorno} onChange={(e) => setCodigoEscaneadoRetorno(e.target.value)} onKeyDown={handleKeyDownEscaneoRetorno}
                      placeholder="Escanea la caja completa o pieza por pieza..."
                      className="w-full px-4 py-2 border border-green-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 bg-white font-mono text-sm shadow-inner text-gray-800"
                    />
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100">
                      <tr className="border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        <th className="p-2 sm:p-3 w-40">Ref / Lote</th>
                        <th className="p-2 sm:p-3">Descripción</th>
                        <th className="p-2 sm:p-3 w-24 text-center bg-blue-50 border-l border-blue-100">DESPACHO</th>
                        <th className="p-2 sm:p-3 w-28 text-center bg-red-50 border-l border-red-100">CONSUMO</th>
                        <th className="p-2 sm:p-3 w-24 text-center bg-green-50 border-l border-green-100">RETORNO</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-gray-700 divide-y divide-gray-100">
                      {detalles.map((d) => {
                        const esConsumible = d.consumible_id && !d.set_id;
                        const esSetPadre = !d.pieza_id && !d.consumible_id && d.set_codigo;
                        const filaCompletada = !isCompletada && d.cantidad_retorno === d.cantidad_despachada && !esSetPadre;

                        return (
                          <tr key={d.id} className={`${filaCompletada ? 'bg-green-50/40' : 'hover:bg-gray-50'} ${esSetPadre ? 'bg-gray-100' : ''} transition-colors`}>
                            <td className="p-2 sm:p-3 whitespace-nowrap">
                              <span className={`font-bold text-oltech-blue block ${esSetPadre ? 'text-sm' : ''}`}>{d.pieza_codigo || d.consumible_codigo || d.set_codigo}</span>
                            </td>
                            <td className={`p-2 sm:p-3 font-medium text-gray-800 whitespace-nowrap ${esSetPadre ? 'font-black uppercase' : ''}`}>
                              {d.pieza_descripcion || d.consumible_nombre || d.set_descripcion}
                            </td>
                            <td className={`p-2 sm:p-3 bg-blue-50/30 border-l border-blue-100 text-center font-bold text-blue-700 whitespace-nowrap ${esSetPadre ? 'text-transparent bg-transparent border-transparent' : 'text-sm'}`}>
                              {!esSetPadre && d.cantidad_despachada}
                            </td>
                            <td className={`p-2 sm:p-3 bg-red-50/50 border-l border-red-100 text-center whitespace-nowrap ${esSetPadre ? 'bg-transparent border-transparent' : ''}`}>
                              {!esSetPadre && (
                                isCompletada ? <span className="font-bold text-red-600 text-sm">{d.cantidad_consumo}</span> : (
                                  <input 
                                    type="number" min="0" max={d.cantidad_despachada} value={d.cantidad_consumo} onChange={(e) => handleConsumoChange(d.id, e.target.value)}
                                    className={`w-14 sm:w-16 px-1 sm:px-2 py-1 sm:py-1.5 text-center border rounded font-bold outline-none shadow-inner text-base sm:text-xs transition-colors ${d.cantidad_consumo > 0 ? 'border-red-400 text-red-600 bg-red-50 focus:ring-red-400' : 'border-gray-200 text-gray-400 bg-white focus:ring-gray-300'}`}
                                  />
                                )
                              )}
                            </td>
                            <td className={`p-2 sm:p-3 border-l text-center font-bold text-sm whitespace-nowrap transition-colors ${esSetPadre ? 'bg-transparent border-transparent text-transparent' : d.cantidad_retorno > 0 ? 'bg-green-100/50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                              {!esSetPadre && d.cantidad_retorno}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {isCompletada && (
                <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm mt-4">
                  <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-2">Observaciones:</p>
                  <p className="text-xs sm:text-sm text-gray-800 bg-gray-50 p-2 sm:p-3 rounded border border-gray-100">{observaciones || <span className="text-gray-400 italic">Sin observaciones.</span>}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col">
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm">
                 <h4 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-2">Observaciones (Opcional):</h4>
                 <textarea rows="2" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-oltech-pink text-base sm:text-sm text-gray-800 bg-gray-50"/>
              </div>

              {necesitaReposicion ? (
                <div className="flex flex-col space-y-4">
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-3 sm:p-4 rounded-md">
                    <h3 className="font-bold text-amber-800 flex items-center space-x-2 text-sm sm:text-base"><span>Sets Incompletos - Reposición</span></h3>
                    <p className="text-xs sm:text-sm text-amber-700 mt-1">Selecciona cómo reponer el material faltante a las cajas de la sede.</p>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4 flex-1">
                    <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                      {piezasSetConsumidas.map(p => {
                        const reposicionHecha = reposiciones.find(r => r.detalle_id === p.id);
                        return (
                          <li key={p.id} className={`p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${reposicionHecha ? 'bg-green-50/30' : 'bg-red-50/30'}`}>
                            <div className="min-w-0">
                              <p className="text-[10px] sm:text-xs font-bold text-oltech-blue truncate">{p.pieza_codigo}</p>
                              <p className="text-sm sm:text-base font-bold text-gray-800 truncate">{p.pieza_descripcion}</p>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <div className="bg-white border border-red-200 text-red-700 px-3 py-1.5 rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap shadow-sm text-center">
                                Faltan {p.cantidad_consumo}
                              </div>
                              {reposicionHecha ? (
                                <div className="flex items-center gap-2 bg-green-100 border border-green-300 px-3 py-1.5 rounded-lg w-full sm:w-auto">
                                    <span className="text-xs sm:text-sm font-bold text-green-800">✓ Repuesto</span>
                                    <button onClick={() => quitarReposicion(p.id)} className="text-green-600 hover:text-red-500 font-bold ml-2">✖</button>
                                </div>
                              ) : (
                                <button onClick={() => abrirSurtidoPieza(p)} className="flex-1 sm:flex-none px-4 py-2 bg-oltech-black text-white text-xs sm:text-sm font-bold rounded-lg hover:bg-gray-800 shadow-md">Reponer</button>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-md">
                  <h3 className="font-bold text-blue-800 flex items-center space-x-2 text-sm sm:text-base"><span>Todo Completo</span></h3>
                  <p className="text-xs sm:text-sm text-blue-700 mt-1">No hubo consumos de Sets. Puedes finalizar el retorno.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center shrink-0 gap-3 sm:gap-4">
          <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto ml-auto">
            {isCompletada ? (
              <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-2.5 bg-oltech-black text-white rounded-lg font-bold shadow-md hover:bg-gray-800 transition-colors text-sm">Cerrar Ventana</button>
            ) : (
              <>
                <button type="button" onClick={paso === 2 ? handleSiguientePaso : onClose} disabled={cargando} className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200 text-sm">{paso === 2 ? 'Regresar' : 'Cancelar'}</button>
                {paso === 1 ? (
                  <button type="button" onClick={handleSiguientePaso} disabled={cargando || detalles.length === 0} className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2.5 bg-oltech-black text-white rounded-lg font-bold shadow-md hover:bg-gray-800 transition-colors text-sm">{necesitaReposicion ? 'Revisar Faltantes' : 'Confirmar'}</button>
                ) : (
                  <button type="button" onClick={handleConciliarGuardar} disabled={cargando} className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-2.5 text-white rounded-lg font-bold shadow-md transition-colors text-sm ${piezasSetConsumidas.some(p => !reposiciones.some(r => r.detalle_id === p.id)) ? 'bg-amber-600 hover:bg-amber-700' : 'bg-oltech-pink hover:bg-pink-700'}`}>
                    {cargando ? 'Procesando...' : (piezasSetConsumidas.some(p => !reposiciones.some(r => r.detalle_id === p.id)) ? 'Cerrar con Faltantes' : 'Finalizar Retorno Local')}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ModalSurtirPiezaRetornoCiudad 
        isOpen={modalSurtirAbierto} onClose={() => setModalSurtirAbierto(false)} pieza={piezaAReponer} onGuardado={handleGuardarReposicion}
      />
    </div>
  );
}

export default ModalContestarRemisionCiudad;