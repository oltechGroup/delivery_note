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
  const [numeroContrato, setNumeroContrato] = useState('IB/570/2026'); // Pre-cargado por defecto
  const [claveCie10, setClaveCie10] = useState('');
  const [claveHraei, setClaveHraei] = useState('');
  const [numeroRenglon, setNumeroRenglon] = useState('');
  const [tipoCirugia, setTipoCirugia] = useState('');
  const [nombreMedicoAdscrito, setNombreMedicoAdscrito] = useState('');
  const [jefeServicio, setJefeServicio] = useState('');
  const [medicoTratanteId, setMedicoTratanteId] = useState('');
  const [tecnicoNombreManual, setTecnicoNombreManual] = useState(''); // NUEVO: Técnico Manual
  const [observaciones, setObservaciones] = useState('');

  // Catálogos auxiliares
  const [medicos, setMedicos] = useState([]);
  const [inventarioLocal, setInventarioLocal] = useState({ consumibles: [], sets: [] });

  // 2. Estado Principal de la Tabla (Insumos empleados)
  const [detalles, setDetalles] = useState([]);
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  
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
      precio_unitario: item.precio || 0
    };

    setDetalles(prev => [...prev, nuevoDetalle]);
  };

  // NUEVA FUNCIÓN: Agregar fila totalmente en blanco (Manual)
  const agregarFilaManual = () => {
    const nuevaFila = {
      id_temp: Date.now() + Math.random(),
      es_insumo_externo: true, // Esto le dice al PDF y BD que es texto libre
      consumible_id: null,
      set_id: null,
      pieza_id: null,
      codigo: '',
      descripcion: '',
      cantidad_utilizada: 1,
      unidad_medida: 'PIEZA',
      lote: '',
      fecha_caducidad: '',
      precio_unitario: 0
    };
    setDetalles(prev => [...prev, nuevaFila]);
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

    // Validación extra: Si hay filas manuales, no pueden ir vacías
    const hayFilaVacia = detalles.some(d => d.es_insumo_externo && (!d.codigo.trim() || !d.descripcion.trim()));
    if (hayFilaVacia) {
      setError('Tienes filas manuales sin código o descripción. Llénalas o elimínalas.');
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
      tecnico_nombre_manual: tecnicoNombreManual.toUpperCase(), // Se manda el técnico manual
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
            <input type="text" placeholder="Ej. IB/570/2026" value={numeroContrato} onChange={e => setNumeroContrato(e.target.value)} className="w-full p-2 border rounded text-xs font-bold uppercase" />
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Médico Tratante (Catálogo)</label>
            <select value={medicoTratanteId} onChange={e => setMedicoTratanteId(e.target.value)} className="w-full p-2 border rounded text-xs font-bold uppercase bg-white">
              <option value="">Seleccionar médico...</option>
              {medicos.map(m => <option key={m.id} value={m.id}>{m.nombre_completo}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nombre Médico Adscrito *</label>
            <input type="text" placeholder="Ej. Dr. Pérez" value={nombreMedicoAdscrito} onChange={e => setNombreMedicoAdscrito(e.target.value)} className="w-full p-2 border rounded text-xs font-bold uppercase" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Jefe Traumatología *</label>
            <input type="text" placeholder="Nombre del jefe" value={jefeServicio} onChange={e => setJefeServicio(e.target.value)} className="w-full p-2 border rounded text-xs font-bold uppercase" />
          </div>
          <div>
            <label className="block text-xs font-bold text-oltech-blue mb-1">Técnico (Manual / Opcional)</label>
            <input type="text" placeholder="Nombre del Técnico" value={tecnicoNombreManual} onChange={e => setTecnicoNombreManual(e.target.value)} className="w-full p-2 border border-oltech-blue/30 bg-blue-50 rounded text-xs font-bold uppercase" />
          </div>
        </div>
      </div>

      {/* BUSCADOR DE INSUMOS LOCALES */}
      <div className="max-w-[22cm] mx-auto bg-oltech-black p-4 rounded-xl shadow-lg mb-6 relative">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white text-xs font-bold uppercase tracking-wide">Añadir Material Empleado</h3>
          
          {/* BOTÓN NUEVO PARA AGREGAR FILA EN BLANCO */}
          <button onClick={agregarFilaManual} className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-blue-500 shadow-md transition-colors flex items-center">
            <span className="mr-1">+</span> Añadir Fila Manual
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
                <tr key={d.id_temp} className={`border-b transition-colors ${d.es_insumo_externo ? 'bg-blue-50/20' : 'hover:bg-gray-50'}`}>
                  
                  {/* CÓDIGO (Editable si es manual) */}
                  <td className="p-1 border font-mono font-bold text-oltech-blue">
                    {d.es_insumo_externo ? (
                      <input type="text" value={d.codigo} onChange={(e) => actualizarCampoDetalle(d.id_temp, 'codigo', e.target.value.toUpperCase())} className="w-full p-1 border border-blue-200 rounded outline-none focus:ring-1 focus:ring-oltech-blue" placeholder="CÓDIGO" />
                    ) : (
                      <span className="p-1 block">{d.codigo}</span>
                    )}
                  </td>
                  
                  {/* DESCRIPCIÓN (Editable si es manual) */}
                  <td className="p-1 border font-medium uppercase">
                    {d.es_insumo_externo ? (
                      <input type="text" value={d.descripcion} onChange={(e) => actualizarCampoDetalle(d.id_temp, 'descripcion', e.target.value.toUpperCase())} className="w-full p-1 border border-blue-200 rounded outline-none focus:ring-1 focus:ring-oltech-blue" placeholder="DESCRIPCIÓN DEL MATERIAL" />
                    ) : (
                      <span className="p-1 block">{d.descripcion}</span>
                    )}
                  </td>

                  <td className="p-1 border text-center">
                    <input 
                      type="number" min="1" value={d.cantidad_utilizada} 
                      onChange={(e) => actualizarCampoDetalle(d.id_temp, 'cantidad_utilizada', parseInt(e.target.value) || 1)}
                      className="w-16 text-center border rounded p-1 font-bold outline-none focus:border-oltech-pink" 
                    />
                  </td>
                  <td className="p-1 border text-center">
                    <input type="text" value={d.lote} onChange={(e) => actualizarCampoDetalle(d.id_temp, 'lote', e.target.value.toUpperCase())} className="w-full text-center border rounded p-1 font-mono uppercase outline-none focus:border-oltech-pink" placeholder="Lote" />
                  </td>
                  <td className="p-1 border text-center">
                    <input type="text" value={d.fecha_caducidad} onChange={(e) => actualizarCampoDetalle(d.id_temp, 'fecha_caducidad', e.target.value.toUpperCase())} className="w-full text-center border rounded p-1 uppercase outline-none focus:border-oltech-pink" placeholder="Cad." />
                  </td>
                  <td className="p-1 border text-center">
                    <input type="number" step="0.01" value={d.precio_unitario} onChange={(e) => actualizarCampoDetalle(d.id_temp, 'precio_unitario', parseFloat(e.target.value) || 0)} className="w-full text-center border rounded p-1 font-bold outline-none focus:border-oltech-pink" placeholder="0.00" />
                  </td>
                  <td className="p-1 border text-center">
                    <button type="button" onClick={() => quitarFila(d.id_temp)} className="text-red-500 font-bold hover:bg-red-50 p-1 rounded">✖</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default NuevaHojaConsumo;