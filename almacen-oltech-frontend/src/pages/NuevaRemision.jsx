// almacen-oltech-frontend/src/pages/NuevaRemision.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import LogoOltech from '../assets/Logo acostado.png';

function NuevaRemision() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  // 1. Estados del Encabezado
  const [noSolicitud, setNoSolicitud] = useState('');
  const [fechaCirugia, setFechaCirugia] = useState('');
  const [paciente, setPaciente] = useState('');
  const [cliente, setCliente] = useState(''); // NUEVO: Estado para el cliente
  const [procedimientoId, setProcedimientoId] = useState('');
  const [medicoId, setMedicoId] = useState('');
  const [unidadMedicaId, setUnidadMedicaId] = useState('');

  // 2. Estados de los Catálogos (Para los <select>)
  const [procedimientos, setProcedimientos] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [unidadesMedicas, setUnidadesMedicas] = useState([]);

  // 3. Estado Principal de la Tabla (Live Preview)
  const [detalles, setDetalles] = useState([]);
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscandoMaterial, setBuscandoMaterial] = useState(false);
  
  // Opciones de configuración de la fila que se va a agregar
  const [tipoBusqueda, setTipoBusqueda] = useState('set'); 
  
  // Inicialización
  useEffect(() => {
    cargarCatalogosBase();
    generarFolioAutomatico();
  }, [token]);

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
      const [resProc, resMed, resUni] = await Promise.all([
        axios.get('http://localhost:4000/api/remisiones/procedimientos', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:4000/api/remisiones/medicos', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get('http://localhost:4000/api/remisiones/unidades-medicas', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
      ]);
      setProcedimientos(resProc.data);
      setMedicos(resMed.data);
      setUnidadesMedicas(resUni.data);
    } catch (err) {
      console.error("Error al cargar catálogos:", err);
      setError("No se pudieron cargar los catálogos base. Verifica tu conexión.");
    }
  };

  // Buscador Inteligente Flexible (Código o Nombre)
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
        
        // Filtro Flexible: Busca en código O en nombre/descripción
        const filtrados = res.data.filter(item => {
          const buscarEn = tipoBusqueda === 'set' 
            ? `${item.codigo} ${item.descripcion}`.toLowerCase()
            : `${item.codigo_referencia} ${item.nombre}`.toLowerCase();
          return buscarEn.includes(busquedaTexto.toLowerCase());
        });
        
        setResultadosBusqueda(filtrados.slice(0, 10)); // Mostramos hasta 10 resultados
      } catch (err) {
        console.error(err);
      } finally {
        setBuscandoMaterial(false);
      }
    };

    const timeoutId = setTimeout(() => buscarMaterial(), 300);
    return () => clearTimeout(timeoutId);
  }, [busquedaTexto, tipoBusqueda, token]);

  // ==========================================
  // FUNCIONES PARA AGREGAR FILAS A LA TABLA
  // ==========================================

  const agregarAlTicket = async (item) => {
    setBusquedaTexto(''); 
    setResultadosBusqueda([]);

    if (tipoBusqueda === 'consumible') {
      // 1. Agregar Consumible Suelto
      // Evaluamos si el insumo ya tiene una fecha de caducidad en la BD
      const tieneCaducidadEnBD = !!item.fecha_caducidad;

      const nuevoDetalle = {
        id_temp: Date.now() + Math.random(),
        es_total: false,
        set_id: null,
        pieza_id: null,
        consumible_id: item.id,
        codigo: item.codigo_referencia,
        descripcion: item.nombre,
        cantidad_maxima: item.cantidad,
        cantidad_despachada: 1,
        // Asignamos la fecha de la BD si existe, o la dejamos vacía
        fecha_caducidad: tieneCaducidadEnBD ? item.fecha_caducidad : '',
        // Este flag nos dirá si mostrar el checkbox en la fila
        tiene_caducidad_bd: tieneCaducidadEnBD,
        // Por defecto, si tiene caducidad en la BD, la mostramos en la impresión
        imprimir_caducidad: tieneCaducidadEnBD
      };
      setDetalles(prev => [...prev, nuevoDetalle]);

    } else {
      // 2. Agregar Set Completo (Primero la fila del Set, luego sus piezas)
      try {
        setCargando(true);
        const res = await axios.get(`http://localhost:4000/api/almacen/sets/${item.id}/composicion`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // A. Fila principal del Set (Visual)
        const filaSet = {
          id_temp: Date.now() + Math.random(),
          es_total: false,
          es_fila_set_padre: true, // FLAG CLAVE PARA LA AUTO-SUMA
          set_id: item.id,
          pieza_id: null,
          consumible_id: null,
          codigo: item.codigo,
          descripcion: item.descripcion,
          cantidad_maxima: 1, 
          cantidad_despachada: 1,
          tiene_caducidad_bd: false,
          imprimir_caducidad: false
        };

        // B. Filas de las piezas que lo componen
        const piezasDelSet = res.data.map(comp => ({
          id_temp: Date.now() + Math.random(),
          es_total: false,
          es_fila_set_padre: false,
          set_id: item.id, // Relacionadas al Set
          pieza_id: comp.pieza_id,
          consumible_id: null,
          codigo: comp.pieza_codigo,
          descripcion: comp.pieza_descripcion,
          cantidad_maxima: comp.cantidad_pieza, 
          cantidad_despachada: comp.cantidad_pieza,
          tiene_caducidad_bd: false,
          imprimir_caducidad: false
        }));

        // Agregamos todo en orden
        setDetalles(prev => [...prev, filaSet, ...piezasDelSet]);
      } catch (err) {
        setError('Error al extraer las piezas del Set seleccionado.');
      } finally {
        setCargando(false);
      }
    }
  };

  // Función para agregar una fila "Total" con AUTO-SUMA INTELIGENTE
  const agregarFilaTotal = () => {
    // 1. Calcular la suma de lo que hay arriba
    let suma = 0;
    
    // Recorremos de abajo hacia arriba (desde el último elemento agregado)
    for (let i = detalles.length - 1; i >= 0; i--) {
      const item = detalles[i];
      
      // Si encontramos una fila de "Total" anterior, nos detenemos
      if (item.es_total) break;
      
      // Solo sumamos si NO es la fila padre del Set
      if (!item.es_fila_set_padre) {
          suma += parseInt(item.cantidad_despachada) || 0;
      }
    }

    // 2. Crear la fila con el total pre-calculado
    const nuevaFilaTotal = {
      id_temp: Date.now() + Math.random(),
      es_total: true, 
      descripcion_custom: "TOTAL DE MATERIAL",
      cantidad_despachada: suma, // Auto-Suma asignada
      set_id: null, pieza_id: null, consumible_id: null,
      tiene_caducidad_bd: false, imprimir_caducidad: false
    };
    setDetalles(prev => [...prev, nuevaFilaTotal]);
  };

  // ==========================================
  // FUNCIONES PARA MODIFICAR LA TABLA (Live Preview)
  // ==========================================

  const actualizarCampoDetalle = (id_temp, campo, valor) => {
    setDetalles(prev => prev.map(d => 
      d.id_temp === id_temp ? { ...d, [campo]: valor } : d
    ));
  };

  const quitarFila = (id_temp) => {
    setDetalles(prev => prev.filter(d => d.id_temp !== id_temp));
  };

  // Verifica si al menos una fila requiere mostrar la columna de Caducidad en la impresión
  const mostrarColumnaCaducidad = detalles.some(d => d.imprimir_caducidad);

  // Formateador para las fechas de impresión
  const formatearFechaCorto = (fechaString) => {
    if (!fechaString) return '';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones).toUpperCase().replace(/\//g, '-');
  };

  // ==========================================
  // GUARDAR EN BASE DE DATOS (El gran botón final)
  // ==========================================
  const handleGuardarRemision = async () => {
    if (detalles.length === 0) {
      setError('Debes agregar material a la remisión antes de guardar.');
      window.scrollTo(0,0);
      return;
    }

    if (!paciente || !procedimientoId || !medicoId || !unidadMedicaId) {
      setError('Por favor, llena todos los datos generales (Paciente, Procedimiento, Médico y Hospital).');
      window.scrollTo(0,0);
      return;
    }

    setCargando(true);
    setError('');

    try {
      // Preparamos el array de detalles
      const detallesConOrden = detalles.map((d, index) => ({
        ...d,
        orden: index + 1,
        // Si el usuario desmarcó el checkbox, mandamos null para no imprimirla
        fecha_caducidad: d.imprimir_caducidad ? d.fecha_caducidad : null 
      }));

      await axios.post('http://localhost:4000/api/remisiones', {
        no_solicitud: noSolicitud,
        fecha_cirugia: fechaCirugia,
        paciente: paciente.toUpperCase(),
        cliente: cliente.toUpperCase(), // NUEVO: Enviar el cliente al backend
        procedimiento_id: parseInt(procedimientoId),
        medico_id: parseInt(medicoId),
        unidad_medica_id: parseInt(unidadMedicaId),
        detalles: detallesConOrden
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert('¡Remisión guardada exitosamente!');
      navigate('/remisiones'); // Devolvemos a la bandeja principal
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar la remisión en la base de datos.');
      window.scrollTo(0,0);
    } finally {
      setCargando(false);
    }
  };

  return (
    // MODIFICADO: Fondo devuelto a gris claro/blanco
    <div className="bg-gray-100 min-h-screen pb-12 pt-4 px-4 animate-in fade-in duration-300">
      
      {/* BARRA DE CONTROLES SUPERIOR (Fija en pantalla) */}
      <div className="max-w-[22cm] mx-auto bg-white p-4 rounded-xl shadow-md border border-gray-200 flex justify-between items-center mb-6 sticky top-4 z-50">
        <button onClick={() => navigate('/remisiones')} className="text-gray-500 hover:text-oltech-black font-bold text-sm flex items-center transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Volver a Bandeja
        </button>

        <h1 className="text-lg font-bold text-oltech-black flex items-center space-x-2">
          <span>🚀</span>
          <span>Creador de Remisión (ISO 9001)</span>
        </h1>

        <button 
          onClick={handleGuardarRemision} 
          disabled={cargando}
          className="bg-oltech-pink text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-pink-700 flex items-center space-x-2 transition-transform active:scale-95 disabled:opacity-50"
        >
          {cargando ? (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
          )}
          <span>Guardar Remisión</span>
        </button>
      </div>

      {error && (
        <div className="max-w-[22cm] mx-auto bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200 font-medium mb-6 shadow-sm">
          {error}
        </div>
      )}

      {/* CONTROLES DE BÚSQUEDA (Para inyectar material al lienzo) */}
      <div className="max-w-[22cm] mx-auto bg-oltech-black p-5 rounded-xl shadow-lg border border-gray-800 mb-8 relative z-40">
        <h3 className="text-white text-sm font-bold uppercase tracking-wide mb-3 flex items-center space-x-2">
          <span className="text-oltech-pink">Paso 1.</span> <span>Agrega material a la hoja</span>
        </h3>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 relative">
          <select value={tipoBusqueda} onChange={(e) => setTipoBusqueda(e.target.value)} className="px-4 py-2.5 border-none rounded-lg text-sm bg-gray-800 text-white outline-none font-bold shadow-inner focus:ring-2 focus:ring-oltech-pink cursor-pointer">
            <option value="set">📦 Buscar SET Completo</option>
            <option value="consumible">💉 Buscar Consumible Suelto</option>
          </select>
          
          <div className="relative flex-1">
            <input 
              type="text" 
              value={busquedaTexto} 
              onChange={(e) => setBusquedaTexto(e.target.value)} 
              placeholder={tipoBusqueda === 'set' ? "Escribe código o nombre del Set..." : "Escribe código o nombre del Insumo..."}
              className="w-full px-4 py-2.5 border-none rounded-lg outline-none focus:ring-2 focus:ring-oltech-pink text-sm bg-white shadow-inner font-medium text-gray-800"
            />
            
            {/* Resultados Flotantes */}
            {busquedaTexto.length >= 3 && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden divide-y divide-gray-100 z-50">
                {buscandoMaterial ? (
                  <div className="p-4 text-center text-sm font-bold text-gray-400">Buscando en almacén...</div>
                ) : resultadosBusqueda.length === 0 ? (
                  <div className="p-4 text-center text-sm font-bold text-red-400">No se encontraron coincidencias.</div>
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
                            <span className="text-sm font-bold text-gray-700 line-clamp-1 mt-1">{esSet ? res.descripcion : res.nombre}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Opciones Adicionales */}
          <div className="flex space-x-2">
            <button 
              onClick={agregarFilaTotal}
              className="bg-gray-800 text-oltech-pink px-4 py-2.5 rounded-lg text-sm font-bold border border-oltech-pink/30 hover:bg-gray-700 transition-colors whitespace-nowrap shadow-md"
              title="Inserta una fila para agrupar y sumar un total"
            >
              + Fila Resumen
            </button>
          </div>

        </div>
      </div>


      {/* ========================================================
          EL LIENZO / LIVE PREVIEW DE LA HOJA (Formato ISO Mejorado)
          ======================================================== */}
      {/* MODIFICADO: Eliminado min-h para que no se corte, y añadida sombra pronunciada */}
      <div className="bg-white w-full max-w-[21.5cm] mx-auto p-[1cm] pt-[0.5cm] shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-black text-xs font-sans relative flex flex-col border border-gray-300">
        
        {/* ENCABEZADO ISO 9001 (Ajustado proporciones a Word) */}
        <table className="w-full border-collapse border border-gray-400 text-[10px] text-center mb-3 mt-2">
          <tbody>
            <tr>
              <td rowSpan="6" className="border border-gray-400 w-[20%] p-1 align-middle">
                <img src={LogoOltech} alt="OLTECH" className="mx-auto w-24 object-contain" />
              </td>
              <td rowSpan="2" className="border border-gray-400 w-[40%] p-2 font-black text-[12px] uppercase align-middle text-black tracking-wide">
                REMISIÓN DE ENTRADA Y SALIDA DE ALMACÉN
              </td>
              <td className="border border-gray-400 w-[15%] p-1 text-left font-bold text-gray-800 bg-gray-50/50">Código:</td>
              <td className="border border-gray-400 w-[25%] p-1 text-center text-gray-800 font-bold">MPA-05-R02</td>
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
                <span className="font-bold text-black">SUSTITUYE A:</span> NUEVO<br/>
                Referencia a la norma ISO 9001:2015<br/>
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
              <td className="border border-gray-400 p-1 text-left font-bold text-gray-800 bg-gray-50/50">Resp:</td>
              <td className="border border-gray-400 p-1 text-center text-[9px] text-gray-800 font-bold">Coord. Almacén</td>
            </tr>
          </tbody>
        </table>

        {/* FECHA Y DATOS DE CIRUGÍA (Formularios Inyectados) */}
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
                  <input type="text" required value={noSolicitud} onChange={e => setNoSolicitud(e.target.value)} className="flex-1 bg-transparent border-b border-gray-300 outline-none focus:border-oltech-pink text-xs font-black text-black uppercase" placeholder="Ej. OLTAL..." />
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
                  <span className="mr-2">UNIDAD MÉDICA:</span>
                  <select required value={unidadMedicaId} onChange={e => setUnidadMedicaId(e.target.value)} className="flex-1 bg-transparent border-b border-gray-300 outline-none focus:border-oltech-pink text-xs font-bold uppercase text-black">
                    <option value="">Seleccionar...</option>
                    {unidadesMedicas.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                  </select>
                </div>
              </td>
            </tr>
            {/* NUEVA FILA PARA EL CLIENTE */}
            <tr>
              <td colSpan="2" className="border border-gray-400 p-1.5 font-bold align-middle">
                <div className="flex items-center">
                  <span className="mr-2">CLIENTE:</span>
                  <input type="text" value={cliente} onChange={e => setCliente(e.target.value)} className="flex-1 bg-transparent border-b border-gray-300 outline-none focus:border-oltech-pink text-xs font-bold uppercase text-black" placeholder="Nombre del cliente (Opcional)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* TÍTULO MATERIAL */}
        <div className="text-center font-bold text-sm mb-2 uppercase underline underline-offset-2 text-black">
          MATERIAL A VISTAS
        </div>

        {/* TABLA DE EXPLOSIÓN DE MATERIALES (Interactiva) */}
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
                    Utiliza el buscador de arriba para agregar piezas y sets a la remisión.
                  </td>
                </tr>
              ) : (
                detalles.map((d) => {
                  
                  // RENDER: FILA DE TOTAL
                  if (d.es_total) {
                    return (
                      <tr key={d.id_temp} className="bg-gray-50 border-b border-gray-300 group">
                        <td colSpan={mostrarColumnaCaducidad ? 3 : 2} className="border-r border-gray-400 p-1 pr-4 text-right">
                          <input 
                            type="text" 
                            value={d.descripcion_custom} 
                            onChange={(e) => actualizarCampoDetalle(d.id_temp, 'descripcion_custom', e.target.value.toUpperCase())}
                            className="w-full text-right bg-transparent border-b border-gray-400 border-dashed outline-none focus:border-oltech-black font-black uppercase text-black"
                            placeholder="Ej. TOTAL DE PLACAS"
                          />
                        </td>
                        <td className="border-r border-gray-400 p-1 text-center font-bold">
                          <input 
                            type="number" 
                            value={d.cantidad_despachada} 
                            onChange={(e) => actualizarCampoDetalle(d.id_temp, 'cantidad_despachada', parseInt(e.target.value) || 0)}
                            className="w-full text-center bg-white border border-gray-300 rounded outline-none focus:ring-1 focus:ring-oltech-black text-[10px] py-0.5 font-black text-black"
                          />
                        </td>
                        <td className="p-1 text-center">
                          <button type="button" onClick={() => quitarFila(d.id_temp)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✖</button>
                        </td>
                      </tr>
                    );
                  }

                  // RENDER: FILA NORMAL DE ÍTEM (SET O CONSUMIBLE)
                  const esFilaPadreSet = d.es_fila_set_padre;

                  return (
                    <tr key={d.id_temp} className={`border-b border-gray-200 group hover:bg-blue-50/30 ${esFilaPadreSet ? 'bg-gray-50' : ''}`}>
                      
                      {/* CÓDIGO */}
                      <td className={`border-r border-gray-400 p-1 text-center font-mono ${esFilaPadreSet ? 'font-black text-black' : 'font-bold text-gray-800'}`}>
                        {d.codigo}
                      </td>
                      
                      {/* COLUMNA DINÁMICA DE CADUCIDAD */}
                      {mostrarColumnaCaducidad && (
                        <td className="border-r border-gray-400 p-1 text-center align-middle bg-pink-50/10">
                          {d.tiene_caducidad_bd ? (
                            <div className="flex items-center justify-center space-x-1">
                              <input 
                                type="checkbox"
                                checked={d.imprimir_caducidad}
                                onChange={(e) => actualizarCampoDetalle(d.id_temp, 'imprimir_caducidad', e.target.checked)}
                                className="w-3 h-3 text-oltech-pink"
                                title="¿Imprimir Caducidad en el documento?"
                              />
                              <span className={`text-[9px] font-bold ${d.imprimir_caducidad ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                                {formatearFechaCorto(d.fecha_caducidad)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-300 font-bold">-</span>
                          )}
                        </td>
                      )}

                      {/* DESCRIPCIÓN */}
                      <td className={`border-r border-gray-400 p-1 pl-2 uppercase flex flex-col justify-center ${esFilaPadreSet ? 'font-black text-black' : 'font-semibold text-gray-800'}`}>
                        {d.descripcion}
                      </td>

                      {/* CANTIDAD DE DESPACHO */}
                      <td className="border-r border-gray-400 p-1 text-center align-middle">
                        {esFilaPadreSet ? (
                           <span className="font-black text-[10px] text-black">{d.cantidad_despachada}</span>
                        ) : (
                          <input 
                            type="number" 
                            min="1" max={d.cantidad_maxima} 
                            value={d.cantidad_despachada} 
                            onChange={(e) => actualizarCampoDetalle(d.id_temp, 'cantidad_despachada', parseInt(e.target.value) || 0)}
                            className="w-12 mx-auto text-center bg-white border border-blue-200 rounded outline-none focus:ring-1 focus:ring-oltech-pink text-[10px] py-0.5 font-bold text-gray-900"
                          />
                        )}
                      </td>
                      
                      {/* BOTÓN QUITAR */}
                      <td className="p-1 text-center align-middle">
                        <button type="button" onClick={() => quitarFila(d.id_temp)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Quitar de la hoja">
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
  );
}

export default NuevaRemision;