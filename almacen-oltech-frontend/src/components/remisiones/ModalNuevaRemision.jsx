// almacen-oltech-frontend/src/components/remisiones/ModalNuevaRemision.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import PDFRemision from './PDFRemision'; // <-- IMPORTAMOS EL FORMATO ISO

function ModalNuevaRemision({ isOpen, onClose, onGuardado }) {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  // 1. Estados del Formulario Principal
  const [noSolicitud, setNoSolicitud] = useState('');
  const [fechaCirugia, setFechaCirugia] = useState('');
  const [paciente, setPaciente] = useState('');
  const [procedimientoId, setProcedimientoId] = useState('');
  const [medicoId, setMedicoId] = useState('');
  const [unidadMedicaId, setUnidadMedicaId] = useState('');

  // 2. Estados de los Catálogos (Para los <select>)
  const [procedimientos, setProcedimientos] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [unidadesMedicas, setUnidadesMedicas] = useState([]);

  // 3. Estados para la Búsqueda y Explosión de Materiales
  const [detalles, setDetalles] = useState([]);
  const [tipoBusqueda, setTipoBusqueda] = useState('set'); 
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscandoMaterial, setBuscandoMaterial] = useState(false);

  // 4. Estados para la VISTA PREVIA (PDF)
  const [vistaPreviaActiva, setVistaPreviaActiva] = useState(false);
  const [datosVistaPrevia, setDatosVistaPrevia] = useState(null);

  useEffect(() => {
    if (isOpen) {
      limpiarFormulario();
      cargarCatalogosBase();
      generarFolioAutomatico();
    }
  }, [isOpen, token]);

  const limpiarFormulario = () => {
    setPaciente('');
    setProcedimientoId('');
    setMedicoId('');
    setUnidadMedicaId('');
    setDetalles([]);
    setBusquedaTexto('');
    setResultadosBusqueda([]);
    setError('');
    setVistaPreviaActiva(false);
    setDatosVistaPrevia(null);
  };

  const generarFolioAutomatico = () => {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = String(hoy.getFullYear()).slice(-2);
    setNoSolicitud(`OLTAL${dia}${mes}${anio}-01`);
    setFechaCirugia(hoy.toISOString().split('T')[0]);
  };

  const cargarCatalogosBase = async () => {
    try {
      const resProc = await axios.get('http://localhost:4000/api/remisiones/procedimientos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProcedimientos(resProc.data);

      const resMed = await axios.get('http://localhost:4000/api/remisiones/medicos', {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: [] })); 
      setMedicos(resMed.data);

      const resUni = await axios.get('http://localhost:4000/api/remisiones/unidades-medicas', {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => ({ data: [] }));
      setUnidadesMedicas(resUni.data);

    } catch (err) {
      console.error("Error al cargar catálogos:", err);
    }
  };

  // Buscar en la BD cuando el usuario teclea
  useEffect(() => {
    if (busquedaTexto.length < 3) {
      setResultadosBusqueda([]);
      return;
    }
    
    const buscarMaterial = async () => {
      setBuscandoMaterial(true);
      try {
        const url = tipoBusqueda === 'set' 
          ? 'http://localhost:4000/api/almacen/sets' 
          : 'http://localhost:4000/api/almacen/consumibles';
          
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        
        const filtrados = res.data.filter(item => {
          const texto = tipoBusqueda === 'set' 
            ? `${item.codigo} ${item.descripcion}`.toLowerCase()
            : `${item.codigo_referencia} ${item.nombre}`.toLowerCase();
          return texto.includes(busquedaTexto.toLowerCase());
        });
        
        setResultadosBusqueda(filtrados.slice(0, 5)); 
      } catch (err) {
        console.error(err);
      } finally {
        setBuscandoMaterial(false);
      }
    };

    const timeoutId = setTimeout(() => buscarMaterial(), 300);
    return () => clearTimeout(timeoutId);
  }, [busquedaTexto, tipoBusqueda, token]);

  const agregarAlTicket = async (item) => {
    setBusquedaTexto(''); 
    setResultadosBusqueda([]);

    if (tipoBusqueda === 'consumible') {
      const nuevoDetalle = {
        id_temp: Date.now() + Math.random(),
        set_id: null,
        pieza_id: null,
        consumible_id: item.id,
        codigo: item.codigo_referencia,
        descripcion: item.nombre,
        origen: 'Consumible Extra',
        cantidad_maxima: item.cantidad,
        cantidad_despachada: 1
      };
      setDetalles(prev => [...prev, nuevoDetalle]);
    } else {
      try {
        setCargando(true);
        const res = await axios.get(`http://localhost:4000/api/almacen/sets/${item.id}/composicion`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const piezasDelSet = res.data.map(comp => ({
          id_temp: Date.now() + Math.random(),
          set_id: item.id,
          pieza_id: comp.pieza_id,
          consumible_id: null,
          codigo: comp.pieza_codigo,
          descripcion: comp.pieza_descripcion,
          origen: `Set: ${item.codigo}`,
          cantidad_maxima: comp.cantidad_pieza, 
          cantidad_despachada: comp.cantidad_pieza 
        }));

        setDetalles(prev => [...prev, ...piezasDelSet]);
      } catch (err) {
        setError('Error al extraer las piezas del Set seleccionado.');
      } finally {
        setCargando(false);
      }
    }
  };

  const actualizarCantidadDespacho = (id_temp, nuevaCantidad) => {
    setDetalles(prev => prev.map(d => 
      d.id_temp === id_temp ? { ...d, cantidad_despachada: parseInt(nuevaCantidad) || 0 } : d
    ));
  };

  const quitarDelTicket = (id_temp) => {
    setDetalles(prev => prev.filter(d => d.id_temp !== id_temp));
  };

  // ========================================================
  // PASO 1: ABRIR VISTA PREVIA (No guarda en BD todavía)
  // ========================================================
  const handleGenerarVistaPrevia = (e) => {
    e.preventDefault();
    if (detalles.length === 0) {
      setError('Debes agregar al menos un Set o Consumible a la remisión.');
      return;
    }

    const cantidadesValidas = detalles.every(d => d.cantidad_despachada > 0);
    if (!cantidadesValidas) {
      setError('Todas las piezas deben tener una cantidad de despacho mayor a 0.');
      return;
    }

    // Buscamos los nombres reales para mostrarlos en el PDF
    const procNombre = procedimientos.find(p => p.id === parseInt(procedimientoId))?.nombre || '';
    const medNombre = medicos.find(m => m.id === parseInt(medicoId))?.nombre_completo || '';
    const uniNombre = unidadesMedicas.find(u => u.id === parseInt(unidadMedicaId))?.nombre || '';

    setDatosVistaPrevia({
      noSolicitud,
      fechaCirugia,
      paciente: paciente.toUpperCase(),
      procedimientoNombre: procNombre.toUpperCase(),
      medicoNombre: medNombre.toUpperCase(),
      unidadMedicaNombre: uniNombre.toUpperCase()
    });

    setVistaPreviaActiva(true);
  };

  // ========================================================
  // PASO 2: GUARDAR EN BD (Se llama desde adentro del PDF)
  // ========================================================
  const realizarGuardadoEnBD = async () => {
    setCargando(true);
    setError('');

    try {
      await axios.post('http://localhost:4000/api/remisiones', {
        no_solicitud: noSolicitud,
        fecha_cirugia: fechaCirugia,
        paciente: paciente.toUpperCase(),
        procedimiento_id: procedimientoId ? parseInt(procedimientoId) : null,
        medico_id: medicoId ? parseInt(medicoId) : null,
        unidad_medica_id: unidadMedicaId ? parseInt(unidadMedicaId) : null,
        detalles: detalles.map(d => ({
          set_id: d.set_id,
          pieza_id: d.pieza_id,
          consumible_id: d.consumible_id,
          cantidad_despachada: d.cantidad_despachada
        }))
      }, { headers: { Authorization: `Bearer ${token}` } });

      return true; // Retorna true si se guardó con éxito
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar la remisión.');
      setVistaPreviaActiva(false); // Cierra el PDF si hay error para mostrar la alerta
      return false; // Retorna false si falló
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  // Si la vista previa está activa, mostramos EL PDF ENCIMA DEL MODAL
  if (vistaPreviaActiva) {
    return (
      <PDFRemision 
        datosVistaPrevia={datosVistaPrevia} 
        detalles={detalles} 
        onClose={(cerrarTodo) => {
          setVistaPreviaActiva(false); // Oculta el PDF
          if (cerrarTodo) {
            onGuardado(); // Actualiza la tabla principal
            onClose();    // Cierra el formulario grande
          }
        }} 
        onGuardarEImprimir={realizarGuardadoEnBD} 
      />
    );
  }

  // SI NO HAY VISTA PREVIA, MOSTRAMOS EL FORMULARIO
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        <div className="bg-oltech-black px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>🚀</span>
              <span>Crear Nueva Remisión</span>
            </h2>
            <p className="text-oltech-pink text-sm font-medium">Despacho de Material ISO 9001</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col lg:flex-row gap-6">
          
          {/* COLUMNA IZQUIERDA: Datos de la Cirugía */}
          <div className="w-full lg:w-1/3 space-y-5">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2 mb-4 text-oltech-blue">1. Datos Generales</h3>
              
              <form id="form-remision" onSubmit={handleGenerarVistaPrevia} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">No. Solicitud</label>
                    <input type="text" required value={noSolicitud} onChange={e => setNoSolicitud(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-oltech-pink font-mono text-sm uppercase bg-blue-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">Fecha CX</label>
                    <input type="date" required value={fechaCirugia} onChange={e => setFechaCirugia(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-oltech-pink text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Paciente *</label>
                  <input type="text" required value={paciente} onChange={e => setPaciente(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-oltech-pink text-sm uppercase" placeholder="Nombre completo" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Procedimiento *</label>
                  <select required value={procedimientoId} onChange={e => setProcedimientoId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-oltech-pink text-sm bg-white">
                    <option value="">-- Seleccionar --</option>
                    {procedimientos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Médico Tratante *</label>
                  <select required value={medicoId} onChange={e => setMedicoId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-oltech-pink text-sm bg-white">
                    <option value="">-- Seleccionar --</option>
                    {medicos.length > 0 ? medicos.map(m => <option key={m.id} value={m.id}>{m.nombre_completo}</option>) : <option disabled>Cargando médicos...</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">Hospital / Unidad Médica *</label>
                  <select required value={unidadMedicaId} onChange={e => setUnidadMedicaId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-oltech-pink text-sm bg-white">
                    <option value="">-- Seleccionar --</option>
                    {unidadesMedicas.length > 0 ? unidadesMedicas.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>) : <option disabled>Cargando hospitales...</option>}
                  </select>
                </div>
              </form>
            </div>
          </div>

          {/* COLUMNA DERECHA: Despacho de Material */}
          <div className="w-full lg:w-2/3 flex flex-col space-y-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md shrink-0">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Buscador Inteligente con Bloqueo de Disponibilidad */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm shrink-0 z-20">
               <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center space-x-2">
                  <span className="text-oltech-pink">2.</span> <span>Agregar Material a Vistas</span>
               </h3>
               <div className="flex space-x-2 relative">
                 <select value={tipoBusqueda} onChange={(e) => setTipoBusqueda(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 outline-none font-bold text-gray-700">
                    <option value="set">📦 Buscar SET Completo</option>
                    <option value="consumible">💉 Buscar Consumible Suelto</option>
                 </select>
                 <div className="relative flex-1">
                   <input 
                      type="text" 
                      value={busquedaTexto} 
                      onChange={(e) => setBusquedaTexto(e.target.value)} 
                      placeholder={tipoBusqueda === 'set' ? "Escribe código de caja..." : "Escribe código de insumo..."}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-oltech-pink text-sm"
                   />
                   
                   {/* Menú Flotante de Resultados */}
                   {busquedaTexto.length >= 3 && (
                     <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
                       {buscandoMaterial ? (
                         <div className="p-3 text-center text-xs text-gray-500">Buscando...</div>
                       ) : resultadosBusqueda.length === 0 ? (
                         <div className="p-3 text-center text-xs text-gray-500">No se encontraron coincidencias.</div>
                       ) : (
                         <ul className="divide-y divide-gray-100">
                           {resultadosBusqueda.map(res => {
                             const esSet = tipoBusqueda === 'set';
                             const estaNoDisponible = esSet && res.estado_nombre && !['activo', 'disponible'].includes(res.estado_nombre.toLowerCase());
                             const sinStock = !esSet && res.cantidad <= 0;
                             const deshabilitado = estaNoDisponible || sinStock;

                             return (
                               <li key={res.id}>
                                 <button 
                                   type="button" 
                                   onClick={() => agregarAlTicket(res)} 
                                   disabled={deshabilitado}
                                   className={`w-full text-left p-3 hover:bg-pink-50 transition-colors flex flex-col ${deshabilitado ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                                 >
                                   <div className="flex justify-between items-center w-full">
                                     <span className="text-xs font-bold text-oltech-blue">{esSet ? res.codigo : res.codigo_referencia}</span>
                                     
                                     {esSet ? (
                                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${estaNoDisponible ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                         {res.estado_nombre || 'ACTIVO'}
                                       </span>
                                     ) : (
                                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${sinStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                         Stock: {res.cantidad}
                                       </span>
                                     )}
                                   </div>
                                   <span className="text-sm text-gray-700 line-clamp-1 mt-1">{esSet ? res.descripcion : res.nombre}</span>
                                 </button>
                               </li>
                             );
                           })}
                         </ul>
                       )}
                     </div>
                   )}
                 </div>
               </div>
            </div>

            {/* Tabla de Explosión / Ticket */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden z-10">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Desglose de Despacho</span>
                <span className="bg-oltech-blue text-white text-xs font-bold px-2 py-1 rounded-full">{detalles.length} Ítems</span>
              </div>
              <div className="flex-1 overflow-y-auto p-0">
                {detalles.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-10 text-gray-400">
                    <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    <p className="text-sm font-medium text-center">Busca y selecciona material arriba para iniciar la remisión.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 shadow-sm">
                      <tr className="border-b border-gray-200 text-[10px] text-gray-500 uppercase tracking-wider">
                        <th className="p-3 w-10 text-center"></th>
                        <th className="p-3 w-40">Ref / Lote</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3 w-28 text-center bg-blue-50 border-l border-blue-100">CANT. DESPACHO</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-gray-700 divide-y divide-gray-100">
                      {detalles.map((d) => (
                        <tr key={d.id_temp} className="hover:bg-gray-50 group">
                          <td className="p-2 text-center">
                            <button type="button" onClick={() => quitarDelTicket(d.id_temp)} className="text-gray-300 hover:text-red-500 transition-colors" title="Quitar">
                              <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </td>
                          <td className="p-2">
                            <span className="font-bold text-oltech-blue">{d.codigo}</span>
                            <div className="text-[9px] text-gray-400 mt-0.5 line-clamp-1">{d.origen}</div>
                          </td>
                          <td className="p-2 font-medium line-clamp-2">{d.descripcion}</td>
                          <td className="p-2 bg-blue-50/50 border-l border-blue-100 text-center">
                            <input 
                              type="number" min="1" max={d.cantidad_maxima} 
                              value={d.cantidad_despachada} 
                              onChange={(e) => actualizarCantidadDespacho(d.id_temp, e.target.value)}
                              className="w-16 px-2 py-1 text-center border border-blue-200 rounded font-bold text-oltech-blue focus:ring-2 focus:ring-oltech-pink outline-none"
                            />
                            {d.set_id && (
                              <div className="text-[9px] text-gray-500 mt-1">Receta: {d.cantidad_maxima}</div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Pie del Modal (Botones) */}
        <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-between items-center shrink-0">
          <p className="text-xs text-gray-400 italic hidden sm:block">Revisa los datos antes de generar el formato ISO.</p>
          <div className="flex space-x-3 w-full sm:w-auto">
            <button type="button" onClick={onClose} disabled={cargando} className="w-full sm:w-auto px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200">
              Cancelar
            </button>
            <button type="submit" form="form-remision" disabled={cargando || detalles.length === 0} className="w-full sm:w-auto px-6 py-2 bg-oltech-black text-white rounded-lg font-bold shadow-md hover:bg-gray-800 transition-colors disabled:opacity-50 flex justify-center items-center space-x-2">
              <span>Generar Vista Previa</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ModalNuevaRemision;