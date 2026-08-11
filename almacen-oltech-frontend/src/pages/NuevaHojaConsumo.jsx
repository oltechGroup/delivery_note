// almacen-oltech-frontend/src/pages/NuevaHojaConsumo.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import LogoOltech from '../assets/Logo acostado.png';

function NuevaHojaConsumo() {
  const { token, usuario } = useAuth();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // 1. Estados del Encabezado (Datos exigidos por la Licitación / HRAEI)
  const [folio, setFolio] = useState('');
  const [paciente, setPaciente] = useState('');
  const [curp, setCurp] = useState('');
  const [numeroContrato, setNumeroContrato] = useState('');
  const [claveCie10, setClaveCie10] = useState('');
  const [claveHraei, setClaveHraei] = useState('');
  const [numeroRenglon, setNumeroRenglon] = useState('');
  const [tipoCirugia, setTipoCirugia] = useState('');
  const [nombreMedicoAdscrito, setNombreMedicoAdscrito] = useState('');
  const [jefeServicio, setJefeServicio] = useState('');
  const [medicoTratanteId, setMedicoTratanteId] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Catálogos auxiliares
  const [medicos, setMedicos] = useState([]);
  const [inventarioLocal, setInventarioLocal] = useState({ consumibles: [], sets: [] });

  // 2. Estado Principal de la Tabla (Insumos empleados)
  const [detalles, setDetalles] = useState([]);
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  
  // Estado para Insumos Externos (Fuera de catálogo)
  const [modalExternoAbierto, setModalExternoAbierto] = useState(false);
  const [insumoExterno, setInsumoExterno] = useState({
    descripcion_externa: '',
    proveedor_externo: '',
    cantidad_utilizada: 1,
    unidad_medida: 'PIEZA',
    lote: '',
    fecha_caducidad: '',
    marca: '',
    modelo: '',
    precio_unitario: ''
  });

  const inputBusquedaRef = useRef(null);

  useEffect(() => {
    cargarDatosIniciales();
    generarFolioAutomatico();
  }, [token]);

  const generarFolioAutomatico = () => {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = String(hoy.getFullYear()).slice(-2);
    setFolio(`HC-LIC-${dia}${mes}${anio}-01`);
  };

  const cargarDatosIniciales = async () => {
    try {
      const [resMedicos, resInventario] = await Promise.all([
        axios.get('http://localhost:4000/api/remisiones/medicos', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
        axios.get('http://localhost:4000/api/licitaciones/inventario', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setMedicos(resMedicos.data);
      setInventarioLocal(resInventario.data);
    } catch (err) {
      console.error("Error al cargar datos iniciales:", err);
      setError("No se pudo sincronizar el inventario de la sede.");
    }
  };

  // Buscador inteligente en el inventario local de la sede
  useEffect(() => {
    if (busquedaTexto.length < 2) {
      setResultadosBusqueda([]);
      return;
    }

    const texto = busquedaTexto.toLowerCase();
    const consumiblesFiltrados = inventarioLocal.consumibles.filter(c => 
      c.codigo_referencia.toLowerCase().includes(texto) || c.nombre.toLowerCase().includes(texto)
    );
    const setsFiltrados = inventarioLocal.sets.filter(s => 
      s.codigo.toLowerCase().includes(texto) || s.descripcion.toLowerCase().includes(texto)
    );

    setResultadosBusqueda([...consumiblesFiltrados.map(c => ({ ...c, tipoItem: 'consumible' })), ...setsFiltrados.map(s => ({ ...s, tipoItem: 'set' }))].slice(0, 10));
  }, [busquedaTexto, inventarioLocal]);

  const agregarAlDetalle = (item) => {
    setBusquedaTexto('');
    setResultadosBusqueda([]);

    const nuevoDetalle = {
      id_temp: Date.now() + Math.random(),
      es_insumo_externo: false,
      consumible_id: item.tipoItem === 'consumible' ? item.id : null,
      set_id: item.tipoItem === 'set' ? item.id : null,
      pieza_id: null,
      codigo: item.tipoItem === 'consumible' ? item.codigo_referencia : item.codigo,
      descripcion: item.tipoItem === 'consumible' ? item.nombre : item.descripcion,
      cantidad_utilizada: 1,
      unidad_medida: item.unidad_medida || 'PIEZA',
      lote: item.lote || '',
      fecha_caducidad: item.fecha_caducidad || '',
      marca: item.nombre_comercial || '',
      modelo: '',
      pais_origen: '',
      fecha_fabricacion: '',
      precio_unitario: item.precio || 0
    };

    setDetalles(prev => [...prev, nuevoDetalle]);
  };

  const agregarInsumoExternoAlTicket = (e) => {
    e.preventDefault();
    if (!insumoExterno.descripcion_externa || !insumoExterno.proveedor_externo) {
      setError('La descripción y el proveedor son obligatorios para insumos externos.');
      return;
    }

    const nuevoExterno = {
      id_temp: Date.now() + Math.random(),
      es_insumo_externo: true,
      consumible_id: null,
      set_id: null,
      pieza_id: null,
      codigo: 'EXTERNO',
      descripcion: insumoExterno.descripcion_externa.toUpperCase(),
      proveedor_externo: insumoExterno.proveedor_externo.toUpperCase(),
      cantidad_utilizada: parseInt(insumoExterno.cantidad_utilizada) || 1,
      unidad_medida: insumoExterno.unidad_medida.toUpperCase(),
      lote: insumoExterno.lote.toUpperCase(),
      fecha_caducidad: insumoExterno.fecha_caducidad.toUpperCase(),
      marca: insumoExterno.marca.toUpperCase(),
      modelo: insumoExterno.modelo.toUpperCase(),
      pais_origen: '',
      fecha_fabricacion: '',
      precio_unitario: parseFloat(insumoExterno.precio_unitario) || 0
    };

    setDetalles(prev => [...prev, nuevoExterno]);
    setModalExternoAbierto(false);
    setInsumoExterno({
      descripcion_externa: '',
      proveedor_externo: '',
      cantidad_utilizada: 1,
      unidad_medida: 'PIEZA',
      lote: '',
      fecha_caducidad: '',
      marca: '',
      modelo: '',
      precio_unitario: ''
    });
    setError('');
  };

  const actualizarCampoDetalle = (id_temp, campo, valor) => {
    setDetalles(prev => prev.map(d => d.id_temp === id_temp ? { ...d, [campo]: valor } : d));
  };

  const quitarFila = (id_temp) => {
    setDetalles(prev => prev.filter(d => d.id_temp !== id_temp));
  };

  const handleGuardarHoja = async () => {
    if (!paciente || !curp || !numeroContrato || !claveCie10 || !claveHraei) {
      setError('Por favor, llena todos los datos clínicos y normativos obligatorios de la licitación.');
      window.scrollTo(0, 0);
      return;
    }

    if (detalles.length === 0) {
      setError('Debes registrar al menos un insumo o material utilizado en la cirugía.');
      window.scrollTo(0, 0);
      return;
    }

    setCargando(true);
    setError('');

    const sedeAsignada = usuario?.sedes?.[0] || { ciudad_id: 1, unidad_medica_id: 1 };

    const hojaData = {
      folio,
      ciudad_id: sedeAsignada.ciudad_id,
      unidad_medica_id: sedeAsignada.unidad_medica_id,
      paciente: paciente.toUpperCase(),
      curp: curp.toUpperCase(),
      numero_contrato: numeroContrato.toUpperCase(),
      clave_cie_10: claveCie10.toUpperCase(),
      clave_hraei: claveHraei.toUpperCase(),
      numero_renglon: numeroRenglon.toUpperCase(),
      tipo_cirugia: tipoCirugia.toUpperCase(),
      medico_tratante_id: medicoTratanteId ? parseInt(medicoTratanteId) : null,
      nombre_medico_adscrito: nombreMedicoAdscrito.toUpperCase(),
      jefe_servicio: jefeServicio.toUpperCase(),
      observaciones
    };

    try {
      await axios.post('http://localhost:4000/api/licitaciones/hojas-consumo', {
        hojaData,
        detalles
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert('¡Hoja de consumo creada exitosamente!');
      navigate('/hojas-consumo');
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar la hoja de consumo.');
      window.scrollTo(0, 0);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-12 pt-4 px-2 sm:px-4 animate-in fade-in duration-300">
      
      {/* BARRA SUPERIOR DE ACCIONES */}
      <div className="max-w-[22cm] mx-auto bg-white p-3 sm:p-4 rounded-xl shadow-md border border-gray-200 flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <button onClick={() => navigate('/hojas-consumo')} className="text-gray-500 hover:text-oltech-black font-bold text-sm flex items-center">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Volver a Hojas
        </button>

        <h1 className="text-base sm:text-lg font-bold text-oltech-black">
          📝 Nueva Hoja de Consumo (Licitación)
        </h1>

        <button 
          onClick={handleGuardarHoja} 
          disabled={cargando}
          className="bg-oltech-pink text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:bg-pink-700 flex items-center space-x-2 transition-transform active:scale-95 disabled:opacity-50"
        >
          <span>{cargando ? 'Guardando...' : 'Guardar Hoja'}</span>
        </button>
      </div>

      {error && (
        <div className="max-w-[22cm] mx-auto bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200 font-medium mb-6 shadow-sm flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold">✖</button>
        </div>
      )}

      {/* FORMULARIO DE DATOS CLÍNICOS Y NORMATIVOS */}
      <div className="max-w-[22cm] mx-auto bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 border-b pb-2">Datos Obligatorios de la Licitación y Contrato</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Folio / Solicitud *</label>
            <input type="text" value={folio} onChange={e => setFolio(e.target.value)} className="w-full p-2 border rounded text-xs font-bold uppercase" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">No. Contrato / Convenio *</label>
            <input type="text" placeholder="Ej. DC/045/2026" value={numeroContrato} onChange={e => setNumeroContrato(e.target.value)} className="w-full p-2 border rounded text-xs font-bold uppercase" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Clave HRAEI *</label>
            <input type="text" placeholder="Clave del hospital" value={claveHraei} onChange={e => setClaveHraei(e.target.value)} className="w-full p-2 border rounded text-xs font-bold uppercase" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">Nombre del Paciente *</label>
            <input type="text" placeholder="Nombre completo" value={paciente} onChange={e => setPaciente(e.target.value)} className="w-full p-2 border rounded text-xs font-bold uppercase" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">CURP del Paciente *</label>
            <input type="text" maxLength="18" placeholder="18 caracteres" value={curp} onChange={e => setCurp(e.target.value)} className="w-full p-2 border rounded text-xs font-bold uppercase font-mono" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Clave CIE-10 (Diagnóstico) *</label>
            <input type="text" placeholder="Ej. M16.9" value={claveCie10} onChange={e => setClaveCie10(e.target.value)} className="w-full p-2 border rounded text-xs font-bold uppercase font-mono" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Número de Renglón</label>
            <input type="text" placeholder="Partida en contrato" value={numeroRenglon} onChange={e => setNumeroRenglon(e.target.value)} className="w-full p-2 border rounded text-xs font-bold uppercase" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Cirugía</label>
            <input type="text" placeholder="Ej. Prótesis total de cadera" value={tipoCirugia} onChange={e => setTipoCirugia(e.target.value)} className="w-full p-2 border rounded text-xs font-bold uppercase" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Médico Tratante (Catálogo)</label>
            <select value={medicoTratanteId} onChange={e => setMedicoTratanteId(e.target.value)} className="w-full p-2 border rounded text-xs font-bold uppercase bg-white">
              <option value="">Seleccionar médico...</option>
              {medicos.map(m => <option key={m.id} value={m.id}>{m.nombre_completo}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nombre y Cargo del Médico Adscrito *</label>
            <input type="text" placeholder="Ej. Dr. Pérez / Ortopedista" value={nombreMedicoAdscrito} onChange={e => setNombreMedicoAdscrito(e.target.value)} className="w-full p-2 border rounded text-xs font-bold uppercase" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Jefe de Servicio de Traumatología *</label>
            <input type="text" placeholder="Nombre del jefe" value={jefeServicio} onChange={e => setJefeServicio(e.target.value)} className="w-full p-2 border rounded text-xs font-bold uppercase" />
          </div>
        </div>
      </div>

      {/* BUSCADOR DE INSUMOS LOCALES */}
      <div className="max-w-[22cm] mx-auto bg-oltech-black p-4 rounded-xl shadow-lg mb-6 relative">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white text-xs font-bold uppercase tracking-wide">Añadir Material Empleado</h3>
          <button onClick={() => setModalExternoAbierto(true)} className="bg-oltech-pink text-white px-3 py-1 rounded text-xs font-bold hover:bg-pink-700">
            + Agregar Insumo Externo (Proveedor)
          </button>
        </div>

        <div className="relative">
          <input 
            ref={inputBusquedaRef}
            type="text" 
            value={busquedaTexto} 
            onChange={(e) => setBusquedaTexto(e.target.value)}
            placeholder="Busca en el inventario de tu sede por código o nombre..."
            className="w-full px-4 py-2.5 rounded-lg outline-none text-xs bg-white font-medium text-gray-800"
          />
          
          {resultadosBusqueda.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-lg shadow-2xl z-50 max-h-60 overflow-y-auto">
              {resultadosBusqueda.map((res, idx) => (
                <button 
                  key={idx} 
                  type="button" 
                  onClick={() => agregarAlDetalle(res)}
                  className="w-full text-left p-2.5 hover:bg-blue-50 border-b flex justify-between items-center"
                >
                  <div>
                    <span className="text-xs font-bold text-oltech-blue font-mono">{res.codigo_referencia || res.codigo}</span>
                    <span className="text-xs font-bold text-gray-800 ml-2">{res.nombre || res.descripcion}</span>
                  </div>
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">Stock: {res.cantidad}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TABLA DE MATERIALES SELECCIONADOS */}
      <div className="max-w-[22cm] mx-auto bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Materiales Registrados para la Cirugía</h3>
        
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100 border-b text-[10px] text-gray-600 uppercase">
              <th className="p-2 border">Código / Ref</th>
              <th className="p-2 border">Descripción</th>
              <th className="p-2 border text-center w-20">Cantidad</th>
              <th className="p-2 border text-center w-24">Lote</th>
              <th className="p-2 border text-center w-24">Caducidad</th>
              <th className="p-2 border text-center w-24">Precio ($)</th>
              <th className="p-2 border text-center w-10">✖</th>
            </tr>
          </thead>
          <tbody>
            {detalles.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-400 italic">No hay materiales agregados a esta hoja.</td>
              </tr>
            ) : (
              detalles.map((d) => (
                <tr key={d.id_temp} className="border-b hover:bg-gray-50">
                  <td className="p-2 border font-mono font-bold text-oltech-blue">
                    {d.codigo} {d.es_insumo_externo && <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded ml-1">EXTERNO</span>}
                  </td>
                  <td className="p-2 border font-medium uppercase">
                    {d.descripcion}
                    {d.proveedor_externo && <div className="text-[9px] text-gray-500 italic">Prov: {d.proveedor_externo}</div>}
                  </td>
                  <td className="p-2 border text-center">
                    <input 
                      type="number" min="1" value={d.cantidad_utilizada} 
                      onChange={(e) => actualizarCampoDetalle(d.id_temp, 'cantidad_utilizada', parseInt(e.target.value) || 1)}
                      className="w-16 text-center border rounded p-1 font-bold" 
                    />
                  </td>
                  <td className="p-2 border text-center">
                    <input type="text" value={d.lote} onChange={(e) => actualizarCampoDetalle(d.id_temp, 'lote', e.target.value.toUpperCase())} className="w-full text-center border rounded p-1 font-mono uppercase" placeholder="Lote" />
                  </td>
                  <td className="p-2 border text-center">
                    <input type="text" value={d.fecha_caducidad} onChange={(e) => actualizarCampoDetalle(d.id_temp, 'fecha_caducidad', e.target.value.toUpperCase())} className="w-full text-center border rounded p-1 uppercase" placeholder="Cad." />
                  </td>
                  <td className="p-2 border text-center">
                    <input type="number" step="0.01" value={d.precio_unitario} onChange={(e) => actualizarCampoDetalle(d.id_temp, 'precio_unitario', parseFloat(e.target.value) || 0)} className="w-full text-center border rounded p-1 font-bold" placeholder="0.00" />
                  </td>
                  <td className="p-2 border text-center">
                    <button type="button" onClick={() => quitarFila(d.id_temp)} className="text-red-500 font-bold hover:bg-red-50 p-1 rounded">✖</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL PARA INSUMOS EXTERNOS */}
      {modalExternoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Registrar Insumo Externo (Fuera de Catálogo)</h2>
            <p className="text-xs text-gray-500">Este insumo se guardará para métricas internas, pero no afectará el inventario central.</p>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Descripción del Insumo *</label>
              <input type="text" value={insumoExterno.descripcion_externa} onChange={e => setInsumoExterno({...insumoExterno, descripcion_externa: e.target.value})} className="w-full p-2 border rounded text-xs uppercase" placeholder="Nombre o referencia" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Proveedor *</label>
                <input type="text" value={insumoExterno.proveedor_externo} onChange={e => setInsumoExterno({...insumoExterno, proveedor_externo: e.target.value})} className="w-full p-2 border rounded text-xs uppercase" placeholder="Empresa externa" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cantidad *</label>
                <input type="number" min="1" value={insumoExterno.cantidad_utilizada} onChange={e => setInsumoExterno({...insumoExterno, cantidad_utilizada: e.target.value})} className="w-full p-2 border rounded text-xs font-bold" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Lote</label>
                <input type="text" value={insumoExterno.lote} onChange={e => setInsumoExterno({...insumoExterno, lote: e.target.value})} className="w-full p-2 border rounded text-xs uppercase font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Caducidad</label>
                <input type="text" value={insumoExterno.fecha_caducidad} onChange={e => setInsumoExterno({...insumoExterno, fecha_caducidad: e.target.value})} className="w-full p-2 border rounded text-xs uppercase" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Precio Unitario</label>
                <input type="number" step="0.01" value={insumoExterno.precio_unitario} onChange={e => setInsumoExterno({...insumoExterno, precio_unitario: e.target.value})} className="w-full p-2 border rounded text-xs font-bold" />
              </div>
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button onClick={() => setModalExternoAbierto(false)} className="px-4 py-2 border rounded text-xs font-medium">Cancelar</button>
              <button onClick={insumoExternoAlTicket => agregarInsumoExternoAlTicket(insumoExternoAlTicket)} className="px-4 py-2 bg-oltech-black text-white rounded text-xs font-bold">Añadir al Ticket</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default NuevaHojaConsumo;