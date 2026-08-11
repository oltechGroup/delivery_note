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

  // Estados del Encabezado
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

  const [medicos, setMedicos] = useState([]);
  const [inventarioLocal, setInventarioLocal] = useState({ consumibles: [], sets: [] });
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
    setFolio(`HC-${Date.now().toString().slice(-6)}`);
  };

  const cargarDatosIniciales = async () => {
    try {
      const [resMedicos, resInventario] = await Promise.all([
        axios.get('http://localhost:4000/api/remisiones/medicos', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:4000/api/licitaciones/inventario', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setMedicos(resMedicos.data);
      setInventarioLocal(resInventario.data);
    } catch (err) {
      setError("No se pudo sincronizar el inventario local.");
    }
  };

  // Buscador inteligente
  useEffect(() => {
    if (busquedaTexto.length < 2) { setResultadosBusqueda([]); return; }
    const texto = busquedaTexto.toLowerCase();
    const cFiltrados = inventarioLocal.consumibles.filter(c => c.codigo_referencia.toLowerCase().includes(texto) || c.nombre.toLowerCase().includes(texto));
    const sFiltrados = inventarioLocal.sets.filter(s => s.codigo.toLowerCase().includes(texto) || s.descripcion.toLowerCase().includes(texto));
    setResultadosBusqueda([...cFiltrados.map(c => ({...c, tipo: 'consumible'})), ...sFiltrados.map(s => ({...s, tipo: 'set'}))].slice(0, 8));
  }, [busquedaTexto, inventarioLocal]);

  // AGREGAR FILA VACÍA MANUALMENTE
  const agregarFilaManual = () => {
    const nuevaFila = {
      id_temp: Date.now(),
      es_insumo_externo: true,
      codigo: 'MANUAL',
      descripcion: '',
      cantidad_utilizada: 1,
      unidad_medida: 'PIEZA',
      lote: '',
      fecha_caducidad: '',
      precio_unitario: 0
    };
    setDetalles(prev => [...prev, nuevaFila]);
  };

  const agregarAlDetalle = (item) => {
    setDetalles(prev => [...prev, {
      id_temp: Date.now() + Math.random(),
      es_insumo_externo: false,
      codigo: item.codigo_referencia || item.codigo,
      descripcion: item.nombre || item.descripcion,
      cantidad_utilizada: 1,
      unidad_medida: 'PIEZA',
      lote: item.lote || '',
      fecha_caducidad: item.fecha_caducidad || '',
      precio_unitario: item.precio || 0
    }]);
    setBusquedaTexto('');
  };

  const actualizarCampoDetalle = (id_temp, campo, valor) => {
    setDetalles(prev => prev.map(d => d.id_temp === id_temp ? { ...d, [campo]: valor } : d));
  };

  const handleGuardarHoja = async () => {
    if (!paciente || !curp) { setError('Datos del paciente obligatorios.'); return; }
    
    setCargando(true);
    const sedeAsignada = usuario?.sedes?.[0] || { ciudad_id: 1, unidad_medica_id: 1 };

    try {
      await axios.post('http://localhost:4000/api/licitaciones/hojas-consumo', {
        hojaData: { folio, ciudad_id: sedeAsignada.ciudad_id, unidad_medica_id: sedeAsignada.unidad_medica_id, paciente, curp, numeroContrato, claveCie10, claveHraei, numeroRenglon, tipoCirugia, medico_tratante_id: medicoTratanteId, nombre_medico_adscrito: nombreMedicoAdscrito, jefe_servicio: jefeServicio, observaciones, estado: 'Pendiente Autorización' },
        detalles
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert('¡Hoja guardada correctamente y enviada a revisión!');
      navigate('/hojas-consumo');
    } catch (err) {
      setError('Error al guardar.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      <div className="max-w-[21cm] mx-auto bg-white p-8 shadow-xl rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-bold text-xl">Nueva Hoja de Consumo</h1>
          <div className="flex gap-2">
             <button onClick={agregarFilaManual} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">+ Fila Manual</button>
             <button onClick={handleGuardarHoja} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold">Guardar y Enviar</button>
          </div>
        </div>

        {/* ... (Tu formulario de inputs se mantiene igual) ... */}
        
        <table className="w-full border-collapse border border-gray-300 mt-6 text-xs">
           {/* ... (Tu tabla de detalles con inputs editables) ... */}
        </table>
      </div>
    </div>
  );
}
export default NuevaHojaConsumo;