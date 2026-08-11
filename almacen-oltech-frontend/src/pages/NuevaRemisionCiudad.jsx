// almacen-oltech-frontend/src/pages/NuevaRemisionCiudad.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import LogoOltech from '../assets/Logo acostado.png';

function NuevaRemisionCiudad() {
  const { token, usuario } = useAuth();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  // 1. Estados del Encabezado
  const [noSolicitud, setNoSolicitud] = useState('');
  const [fechaCirugia, setFechaCirugia] = useState('');
  const [paciente, setPaciente] = useState('');
  const [cliente, setCliente] = useState(''); 
  const [procedimientoId, setProcedimientoId] = useState('');
  const [medicoId, setMedicoId] = useState('');

  // 2. Estados de los Catálogos Base (Compartidos)
  const [procedimientos, setProcedimientos] = useState([]);
  const [medicos, setMedicos] = useState([]);

  // 3. Inventario Local de la Sede
  const [inventarioLocal, setInventarioLocal] = useState({ consumibles: [], sets: [] });

  // 4. Estado de la Tabla de Remisión (Live Preview)
  const [detalles, setDetalles] = useState([]);
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [tipoBusqueda, setTipoBusqueda] = useState('set'); 
  
  const inputBusquedaRef = useRef(null);

  // Sede asignada (Sólo lectura visual)
  const sedeUsuario = usuario?.sedes && usuario.sedes.length > 0 ? usuario.sedes[0] : null;
  
  useEffect(() => {
    cargarCatalogosEInventarioLocal();
    generarFolioAutomatico();
    
    if (window.innerWidth > 768 && inputBusquedaRef.current) {
        inputBusquedaRef.current.focus();
    }
  }, [token]);

  // Lógica de pistola de escáner intacta
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const tagsEvitar = ['INPUT', 'TEXTAREA', 'SELECT'];
      if (document.activeElement === inputBusquedaRef.current || tagsEvitar.includes(document.activeElement?.tagName)) {
        return;
      }
      if (inputBusquedaRef.current && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        inputBusquedaRef.current.focus();
        setBusquedaTexto((prev) => prev + e.key);
        e.preventDefault(); 
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const generarFolioAutomatico = () => {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = String(hoy.getFullYear()).slice(-2);
    setNoSolicitud(`OLT-LOC-${dia}${mes}${anio}-01`);
    setFechaCirugia(hoy.toISOString().split('T')[0]);
  };

  const cargarCatalogosEInventarioLocal = async () => {
    try {
      // Hacemos llamadas en paralelo a los catálogos globales y al INVENTARIO LOCAL
      const [resProc, resMed, resInv] = await Promise.all([
        axios.get('http://localhost:4000/api/remisiones/procedimientos', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:4000/api/remisiones/medicos', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:4000/api/licitaciones/inventario', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setProcedimientos(resProc.data);
      setMedicos(resMed.data);
      setInventarioLocal(resInv.data);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError("No se pudieron cargar los datos. Verifica tu conexión.");
    }
  };

  // Buscador Inteligente en el INVENTARIO LOCAL
  useEffect(() => {
    if (busquedaTexto.length < 3) {
      setResultadosBusqueda([]);
      return;
    }
    
    const texto = busquedaTexto.toLowerCase();
    
    if (tipoBusqueda === 'consumible') {
        const filtrados = inventarioLocal.consumibles.filter(item => 
            (item.codigo_referencia.toLowerCase().includes(texto) || item.nombre.toLowerCase().includes(texto)) && 
            item.cantidad > 0
        );
        setResultadosBusqueda(filtrados.slice(0, 10));
    } else {
        const filtrados = inventarioLocal.sets.filter(item => 
            item.codigo.toLowerCase().includes(texto) || item.descripcion.toLowerCase().includes(texto)
        );
        setResultadosBusqueda(filtrados.slice(0, 10));
    }
  }, [busquedaTexto, tipoBusqueda, inventarioLocal]);

  const handleKeyDownScanner = async (e) => {
    if (e.key === 'Enter' && busquedaTexto.trim().length > 0) {
      e.preventDefault();
      const codigoEscaneado = busquedaTexto.trim().toLowerCase();
      
      const coincidenciaExacta = tipoBusqueda === 'set' 
        ? inventarioLocal.sets.find(s => s.codigo.toLowerCase() === codigoEscaneado)
        : inventarioLocal.consumibles.find(c => c.codigo_referencia.toLowerCase() === codigoEscaneado);

      if (coincidenciaExacta) {
          const esSet = tipoBusqueda === 'set';
          const estaNoDisponible = esSet && coincidenciaExacta.estado_nombre && !['activo', 'disponible'].includes(coincidenciaExacta.estado_nombre.toLowerCase());
          const sinStock = !esSet && coincidenciaExacta.cantidad <= 0;

          if (estaNoDisponible || sinStock) {
             setError(`El material (${codigoEscaneado.toUpperCase()}) no tiene stock local disponible.`);
             setBusquedaTexto('');
             return;
          }
          await agregarAlTicket(coincidenciaExacta);
      } else {
          setError(`El código escaneado no pertenece al inventario de tu sede.`);
      }
    }
  };

  const agregarAlTicket = async (item) => {
    setBusquedaTexto(''); 
    setResultadosBusqueda([]);

    if (tipoBusqueda === 'consumible') {
      const indiceExistente = detalles.findIndex(d => d.consumible_id === item.id && !d.set_id);
      
      if (indiceExistente >= 0) {
          const fila = detalles[indiceExistente];
          if (fila.cantidad_despachada + 1 > fila.cantidad_maxima) {
              setError(`Solo tienes ${fila.cantidad_maxima} unidades de ${fila.codigo} en tu sede.`);
          } else {
              actualizarCampoDetalle(fila.id_temp, 'cantidad_despachada', fila.cantidad_despachada + 1);
          }
      } else {
          const tieneCaducidadEnBD = !!item.fecha_caducidad;
          const nuevoDetalle = {
            id_temp: Date.now() + Math.random(),
            es_total: false, set_id: null, pieza_id: null,
            consumible_id: item.id,
            codigo: item.codigo_referencia,
            descripcion: item.nombre,
            cantidad_maxima: item.cantidad, 
            cantidad_despachada: 1,
            lote: item.lote || '', 
            fecha_caducidad: tieneCaducidadEnBD ? item.fecha_caducidad : '',
            tiene_caducidad_bd: tieneCaducidadEnBD,
            imprimir_caducidad: tieneCaducidadEnBD
          };
          setDetalles(prev => [...prev, nuevoDetalle]);
      }
    } else {
      const setYaAgregado = detalles.some(d => d.set_id === item.id && d.es_fila_set_padre);
      if (setYaAgregado) {
          setError(`El Set ${item.codigo} ya está en la remisión.`);
          return;
      }
      try {
        setCargando(true);
        // Aunque estemos en local, traemos la composición teórica del Set desde el almacén central (que es la "receta")
        const res = await axios.get(`http://localhost:4000/api/almacen/sets/${item.id}/composicion`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const filaSet = {
          id_temp: Date.now() + Math.random(), es_total: false, es_fila_set_padre: true, 
          set_id: item.id, pieza_id: null, consumible_id: null,
          codigo: item.codigo, descripcion: item.descripcion,
          cantidad_maxima: 1, cantidad_despachada: 1,
          tiene_caducidad_bd: false, imprimir_caducidad: false
        };

        const piezasDelSet = res.data.map(comp => ({
          id_temp: Date.now() + Math.random(), es_total: false, es_fila_set_padre: false,
          set_id: item.id, pieza_id: comp.pieza_id, consumible_id: null,
          codigo: comp.pieza_codigo, descripcion: comp.pieza_descripcion,
          cantidad_maxima: comp.cantidad_pieza, cantidad_despachada: comp.cantidad_pieza,
          tiene_caducidad_bd: false, imprimir_caducidad: false
        }));

        setDetalles(prev => [...prev, filaSet, ...piezasDelSet]);
      } catch (err) {
        setError('Error al extraer las piezas del Set seleccionado.');
      } finally {
        setCargando(false);
      }
    }
    if (inputBusquedaRef.current) inputBusquedaRef.current.focus();
  };

  const agregarFilaTotal = () => {
    let suma = 0;
    for (let i = detalles.length - 1; i >= 0; i--) {
      const item = detalles[i];
      if (item.es_total) break;
      if (!item.es_fila_set_padre) suma += parseInt(item.cantidad_despachada) || 0;
    }
    const nuevaFilaTotal = {
      id_temp: Date.now() + Math.random(), es_total: true, descripcion_custom: "TOTAL DE MATERIAL",
      cantidad_despachada: suma, set_id: null, pieza_id: null, consumible_id: null,
      tiene_caducidad_bd: false, imprimir_caducidad: false
    };
    setDetalles(prev => [...prev, nuevaFilaTotal]);
  };

  const actualizarCampoDetalle = (id_temp, campo, valor) => {
    setDetalles(prev => prev.map(d => d.id_temp === id_temp ? { ...d, [campo]: valor } : d));
  };

  const quitarFila = (id_temp) => {
    const filaAQuitar = detalles.find(d => d.id_temp === id_temp);
    if (filaAQuitar && filaAQuitar.es_fila_set_padre) {
        setDetalles(prev => prev.filter(d => d.set_id !== filaAQuitar.set_id));
    } else {
        setDetalles(prev => prev.filter(d => d.id_temp !== id_temp));
    }
  };

  const mostrarColumnaCaducidad = detalles.some(d => d.imprimir_caducidad);

  const formatearFechaCorto = (fechaString) => {
    if (!fechaString) return '';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones).toUpperCase().replace(/\//g, '-');
  };

  // ==========================================
  // GUARDAR REMISIÓN DE SEDE
  // ==========================================
  const handleGuardarRemision = async () => {
    if (detalles.length === 0) {
      setError('Debes agregar material a la remisión antes de guardar.');
      window.scrollTo(0,0);
      return;
    }

    // La Unidad Médica se enviará desde el backend con el Token
    if (!paciente || !procedimientoId || !medicoId) {
      setError('Por favor, llena todos los datos generales (Paciente, Procedimiento y Médico).');
      window.scrollTo(0,0);
      return;
    }

    setCargando(true);
    setError('');

    try {
      const detallesConOrden = detalles.map((d, index) => ({
        ...d,
        orden: index + 1,
        fecha_caducidad: d.imprimir_caducidad ? d.fecha_caducidad : null 
      }));

      // APUNTAMOS AL NUEVO ENDPOINT DE SEDES
      await axios.post('http://localhost:4000/api/remisiones-ciudad', {
        no_solicitud: noSolicitud,
        fecha_cirugia: fechaCirugia,
        paciente: paciente.toUpperCase(),
        cliente: cliente.toUpperCase(), 
        procedimiento_id: parseInt(procedimientoId),
        medico_id: parseInt(medicoId),
        detalles: detallesConOrden
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert('¡Remisión de sede guardada exitosamente!');
      navigate('/red-hospitales/remisiones'); 
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar la remisión local en la base de datos.');
      window.scrollTo(0,0);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-12 pt-4 px-2 sm:px-4 animate-in fade-in duration-300">
      
      {/* BARRA DE CONTROLES SUPERIOR */}
      <div className="max-w-[22cm] mx-auto bg-white p-3 sm:p-4 rounded-xl shadow-md border border-gray-200 flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 static sm:sticky top-2 sm:top-4 z-50 gap-3 sm:gap-0">
        <button onClick={() => navigate('/red-hospitales/remisiones')} className="w-full sm:w-auto justify-center sm:justify-start text-gray-500 hover:text-oltech-black font-bold text-sm flex items-center transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Volver a Sede
        </button>

        <h1 className="text-base sm:text-lg font-bold text-oltech-black flex items-center space-x-2 text-center">
          <span>🏥</span>
          <span>Salida de Sede (Local)</span>
        </h1>

        <button 
          onClick={handleGuardarRemision} 
          disabled={cargando}
          className="w-full sm:w-auto justify-center bg-oltech-black text-white px-6 py-2.5 sm:py-2 rounded-lg font-bold shadow-md hover:bg-gray-800 flex items-center space-x-2 transition-transform active:scale-95 disabled:opacity-50"
        >
          {cargando ? (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
          )}
          <span>Guardar Salida</span>
        </button>
      </div>

      {error && (
        <div className="max-w-[22cm] mx-auto bg-red-50 text-red-600 p-3 sm:p-4 rounded-lg text-xs sm:text-sm border border-red-200 font-medium mb-4 sm:mb-6 shadow-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 font-bold ml-4">✖</button>
        </div>
      )}

      {/* CONTROLES DE BÚSQUEDA */}
      <div className="max-w-[22cm] mx-auto bg-oltech-black p-4 sm:p-5 rounded-xl shadow-lg border border-gray-800 mb-6 sm:mb-8 relative z-40">
        <h3 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wide mb-3 flex items-center space-x-2">
          <span className="text-oltech-pink">Paso 1.</span> <span>Extraer del Inventario Local</span>
        </h3>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 relative">
          <select 
            value={tipoBusqueda} 
            onChange={(e) => {
              setTipoBusqueda(e.target.value);
              setBusquedaTexto('');
              if (inputBusquedaRef.current) inputBusquedaRef.current.focus();
            }} 
            className="w-full sm:w-auto px-4 py-3 sm:py-2.5 border-none rounded-lg text-base sm:text-sm bg-gray-800 text-white outline-none font-bold shadow-inner focus:ring-2 focus:ring-oltech-pink cursor-pointer"
          >
            <option value="set">📦 Buscar SET en Sede</option>
            <option value="consumible">💉 Buscar Consumible Suelto</option>
          </select>
          
          <div className="relative flex-1 w-full">
            <input 
              ref={inputBusquedaRef}
              type="text" 
              value={busquedaTexto} 
              onChange={(e) => setBusquedaTexto(e.target.value)} 
              onKeyDown={handleKeyDownScanner}
              placeholder="Escanea el código de barras o escribe el nombre del material local..."
              className="w-full px-4 py-3 sm:py-2.5 border-none rounded-lg outline-none focus:ring-2 focus:ring-oltech-pink text-base sm:text-sm bg-white shadow-inner font-medium text-gray-800"
            />
            
            {busquedaTexto.length >= 3 && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden divide-y divide-gray-100 z-50">
                {resultadosBusqueda.length === 0 ? (
                  <div className="p-4 text-center text-sm font-bold text-red-400">Sin stock local o no coincide.</div>
                ) : (
                  <ul className="max-h-60 overflow-y-auto">
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
                            className={`w-full text-left p-3 hover:bg-blue-50 transition-colors flex flex-col ${deshabilitado ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                          >
                            <div className="flex justify-between items-start w-full">
                              <div className="flex flex-col pr-2">
                                <span className="text-xs font-bold text-oltech-blue">{esSet ? res.codigo : res.codigo_referencia}</span>
                                <span className="text-xs sm:text-sm font-bold text-gray-700 line-clamp-1 mt-0.5">{esSet ? res.descripcion : res.nombre}</span>
                              </div>

                              <div className="flex flex-col items-end space-y-1 shrink-0">
                                {esSet ? (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${estaNoDisponible ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {res.estado_nombre || 'ACTIVO'}
                                  </span>
                                ) : (
                                  <>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${sinStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                      Stock: {res.cantidad}
                                    </span>
                                    {(res.lote || res.fecha_caducidad) && (
                                      <div className="flex flex-col items-end text-[9px] sm:text-[10px] text-gray-500 font-medium">
                                        {res.lote && <span>Lote: {res.lote}</span>}
                                        {res.fecha_caducidad && <span>Cad: {res.fecha_caducidad}</span>}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="flex space-x-2 w-full sm:w-auto">
            <button 
              onClick={agregarFilaTotal}
              className="w-full sm:w-auto bg-gray-800 text-oltech-pink px-4 py-3 sm:py-2.5 rounded-lg text-sm font-bold border border-oltech-pink/30 hover:bg-gray-700 transition-colors whitespace-nowrap shadow-md"
            >
              + Fila Resumen
            </button>
          </div>

        </div>
      </div>

      {/* LIENZO DE LA HOJA ISO 9001 */}
      <div className="w-full overflow-x-auto pb-6">
        <div className="bg-white w-[21.5cm] min-w-[21.5cm] mx-auto p-[1cm] pt-[0.5cm] shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-black text-xs font-sans relative flex flex-col border border-gray-300">
          
          <table className="w-full border-collapse border border-gray-400 text-[10px] text-center mb-3 mt-2">
            <tbody>
              <tr>
                <td rowSpan="6" className="border border-gray-400 w-[20%] p-1 align-middle">
                  <img src={LogoOltech} alt="OLTECH" className="mx-auto w-24 object-contain" />
                </td>
                <td rowSpan="2" className="border border-gray-400 w-[40%] p-2 font-black text-[12px] uppercase align-middle text-black tracking-wide bg-gray-100">
                  REMISIÓN LOCAL DE SEDE
                </td>
                <td className="border border-gray-400 w-[15%] p-1 text-left font-bold text-gray-800 bg-gray-50/50">Código:</td>
                <td className="border border-gray-400 w-[25%] p-1 text-center text-gray-800 font-bold">MPA-05-R02-LOC</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-1 text-left font-bold text-gray-800 bg-gray-50/50">Revisión:</td>
                <td className="border border-gray-400 p-1 text-center text-gray-800 font-bold">01</td>
              </tr>
              <tr>
                <td rowSpan="1" className="border border-gray-400 p-1 font-bold text-[11px] uppercase align-middle text-black">
                  OLTECH, S.A. DE C.V.
                </td>
                <td className="border border-gray-400 p-1 text-left font-bold text-gray-800 bg-gray-50/50">Emisión:</td>
                <td className="border border-gray-400 p-1 text-center text-gray-800 font-bold">05/NOV/2023</td>
              </tr>
              <tr>
                <td rowSpan="3" className="border border-gray-400 p-1 text-center text-[9px] text-gray-800 leading-tight">
                  <span className="font-bold text-black">8.5.4 Preservación</span>
                </td>
                <td className="border border-gray-400 p-1 text-left font-bold text-gray-800 bg-gray-50/50">Vigencia:</td>
                <td className="border border-gray-400 p-1 text-center text-gray-800 font-bold">05/NOV/2026</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-1 text-left font-bold text-gray-800 bg-gray-50/50">Página:</td>
                <td className="border border-gray-400 p-1 text-center text-gray-800 font-bold">1 de X</td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-1 text-left font-bold text-gray-800 bg-gray-50/50">Sede:</td>
                <td className="border border-gray-400 p-1 text-center text-[9px] text-gray-800 font-bold">{sedeUsuario ? `Unidad ${sedeUsuario.unidad_medica_id}` : 'Local'}</td>
              </tr>
            </tbody>
          </table>

          <div className="text-right font-bold mb-2 text-[10px] text-black">
            FECHA: {formatearFechaCorto(new Date().toISOString())}
          </div>

          <table className="w-full border-collapse border border-gray-400 text-[10px] mb-4 bg-yellow-50/20">
            <tbody>
              <tr>
                <td className="border border-gray-400 p-1.5 w-1/2 font-bold align-middle">
                  <div className="flex items-center">
                    <span className="mr-2">FECHA CX:</span>
                    <input type="date" required value={fechaCirugia} onChange={e => setFechaCirugia(e.target.value)} className="flex-1 bg-transparent border-b border-gray-300 outline-none focus:border-oltech-pink text-xs font-bold text-black" />
                  </div>
                </td>
                <td className="border border-gray-400 p-1.5 w-1/2 font-bold align-middle">
                  <div className="flex items-center">
                    <span className="mr-2 text-black">No. SOLICITUD:</span>
                    <input type="text" required value={noSolicitud} onChange={e => setNoSolicitud(e.target.value)} className="flex-1 bg-transparent border-b border-gray-300 outline-none focus:border-oltech-pink text-xs font-black text-black uppercase" placeholder="Ej. OLT-LOC..." />
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-1.5 font-bold align-middle">
                  <div className="flex items-center">
                    <span className="mr-2">PACIENTE:</span>
                    <input type="text" required value={paciente} onChange={e => setPaciente(e.target.value)} className="flex-1 bg-transparent border-b border-gray-300 outline-none focus:border-oltech-pink text-xs font-bold uppercase text-black" placeholder="Nombre del paciente" />
                  </div>
                </td>
                <td className="border border-gray-400 p-1.5 font-bold align-middle">
                  <div className="flex items-center">
                    <span className="mr-2">PROCEDIMIENTO:</span>
                    <select required value={procedimientoId} onChange={e => setProcedimientoId(e.target.value)} className="flex-1 bg-transparent border-b border-gray-300 outline-none focus:border-oltech-pink text-xs font-bold uppercase text-black">
                      <option value="">Seleccionar...</option>
                      {procedimientos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-1.5 font-bold align-middle">
                  <div className="flex items-center">
                    <span className="mr-2">MÉDICO:</span>
                    <select required value={medicoId} onChange={e => setMedicoId(e.target.value)} className="flex-1 bg-transparent border-b border-gray-300 outline-none focus:border-oltech-pink text-xs font-bold uppercase text-black">
                      <option value="">Seleccionar...</option>
                      {medicos.map(m => <option key={m.id} value={m.id}>{m.nombre_completo}</option>)}
                    </select>
                  </div>
                </td>
                <td className="border border-gray-400 p-1.5 font-bold align-middle">
                  <div className="flex items-center">
                    <span className="mr-2">CLIENTE:</span>
                    <input type="text" value={cliente} onChange={e => setCliente(e.target.value)} className="flex-1 bg-transparent border-b border-gray-300 outline-none focus:border-oltech-pink text-xs font-bold uppercase text-black" placeholder="Nombre del cliente (Opcional)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="text-center font-bold text-sm mb-2 uppercase underline underline-offset-2 text-black">
            MATERIAL A VISTAS
          </div>

          <div className="flex-1 border border-gray-400 pb-10">
            <table className="w-full border-collapse text-[10px]">
              <thead className="bg-gray-100 border-b border-gray-400">
                <tr>
                  <th className="border-r border-gray-400 p-1.5 w-32 text-gray-800">LOTE / REF</th>
                  {mostrarColumnaCaducidad && (
                    <th className="border-r border-gray-400 p-1.5 w-24 text-center text-gray-800 bg-pink-50">CADUCIDAD</th>
                  )}
                  <th className="border-r border-gray-400 p-1.5 text-gray-800">DESCRIPCION</th>
                  <th className="border-r border-gray-400 p-1.5 w-16 text-center text-gray-800">DESPACHO</th>
                  <th className="p-1.5 w-8 text-center text-gray-400">✖</th> 
                </tr>
              </thead>
              <tbody>
                {detalles.length === 0 ? (
                  <tr>
                    <td colSpan={mostrarColumnaCaducidad ? 5 : 4} className="p-10 text-center text-gray-400 italic font-medium">
                      Utiliza el buscador para agregar material del inventario de tu hospital a la remisión.
                    </td>
                  </tr>
                ) : (
                  detalles.map((d) => {
                    if (d.es_total) {
                      return (
                        <tr key={d.id_temp} className="bg-gray-50 border-b border-gray-300 group">
                          <td colSpan={mostrarColumnaCaducidad ? 3 : 2} className="border-r border-gray-400 p-1 pr-4 text-right">
                            <input 
                              type="text" value={d.descripcion_custom} onChange={(e) => actualizarCampoDetalle(d.id_temp, 'descripcion_custom', e.target.value.toUpperCase())}
                              className="w-full text-right bg-transparent border-b border-gray-400 border-dashed outline-none focus:border-oltech-black font-black uppercase text-black"
                              placeholder="Ej. TOTAL DE PLACAS"
                            />
                          </td>
                          <td className="border-r border-gray-400 p-1 text-center font-bold">
                            <input 
                              type="number" value={d.cantidad_despachada} onChange={(e) => actualizarCampoDetalle(d.id_temp, 'cantidad_despachada', parseInt(e.target.value) || 0)}
                              className="w-full text-center bg-white border border-gray-300 rounded outline-none focus:ring-1 focus:ring-oltech-black text-[10px] py-0.5 font-black text-black"
                            />
                          </td>
                          <td className="p-1 text-center">
                            <button type="button" onClick={() => quitarFila(d.id_temp)} className="text-gray-300 hover:text-red-500 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">✖</button>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={d.id_temp} className={`border-b border-gray-200 group hover:bg-blue-50/30 ${d.es_fila_set_padre ? 'bg-gray-50' : ''}`}>
                        <td className={`border-r border-gray-400 p-1 text-center font-mono ${d.es_fila_set_padre ? 'font-black text-black' : 'font-bold text-gray-800'}`}>
                          {d.codigo}
                        </td>
                        {mostrarColumnaCaducidad && (
                          <td className="border-r border-gray-400 p-1 text-center align-middle bg-pink-50/10">
                            {d.tiene_caducidad_bd ? (
                              <div className="flex items-center justify-center space-x-1">
                                <input 
                                  type="checkbox" checked={d.imprimir_caducidad} onChange={(e) => actualizarCampoDetalle(d.id_temp, 'imprimir_caducidad', e.target.checked)}
                                  className="w-3 h-3 text-oltech-pink"
                                />
                                <span className={`text-[9px] font-bold ${d.imprimir_caducidad ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                                  {d.fecha_caducidad}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-300 font-bold">-</span>
                            )}
                          </td>
                        )}
                        <td className={`border-r border-gray-400 p-1 pl-2 uppercase flex flex-col justify-center ${d.es_fila_set_padre ? 'font-black text-black' : 'font-semibold text-gray-800'}`}>
                          {d.descripcion}
                        </td>
                        <td className="border-r border-gray-400 p-1 text-center align-middle">
                          {d.es_fila_set_padre ? (
                              <span className="font-black text-[10px] text-black">{d.cantidad_despachada}</span>
                          ) : (
                            <input 
                              type="number" min="1" max={d.cantidad_maxima} value={d.cantidad_despachada} onChange={(e) => actualizarCampoDetalle(d.id_temp, 'cantidad_despachada', parseInt(e.target.value) || 0)}
                              className="w-12 mx-auto text-center bg-white border border-blue-200 rounded outline-none focus:ring-1 focus:ring-oltech-pink text-[10px] py-0.5 font-bold text-gray-900"
                            />
                          )}
                        </td>
                        <td className="p-1 text-center align-middle">
                          <button type="button" onClick={() => quitarFila(d.id_temp)} className="text-gray-300 hover:text-red-500 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            ✖
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

    </div>
  );
}

export default NuevaRemisionCiudad;