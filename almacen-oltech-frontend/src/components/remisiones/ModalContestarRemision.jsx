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

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && remisionId) {
      cargarDatosRemision();
    }
  }, [isOpen, remisionId, token]);

  const cargarDatosRemision = async () => {
    setCargando(true);
    setError('');
    try {
      // 1. Traer cabecera
      const resRemision = await axios.get(`http://localhost:4000/api/remisiones/${remisionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRemision(resRemision.data);

      // 2. Traer detalles (lo que se despachó)
      const resDetalles = await axios.get(`http://localhost:4000/api/remisiones/${remisionId}/detalles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Inicializamos el consumo en 0 y el retorno igual al despacho
      const detallesFormateados = resDetalles.data.map(d => ({
        ...d,
        cantidad_consumo: 0,
        cantidad_retorno: d.cantidad_despachada
      }));
      setDetalles(detallesFormateados);

    } catch (err) {
      console.error('Error al cargar datos de conciliación:', err);
      setError('No se pudo cargar la información de la remisión.');
    } finally {
      setCargando(false);
    }
  };

  // Manejar el cambio en el input de Consumo
  const handleConsumoChange = (detalleId, nuevoConsumoStr) => {
    const nuevoConsumo = parseInt(nuevoConsumoStr) || 0;
    
    setDetalles(prev => prev.map(d => {
      if (d.id === detalleId) {
        // Validar que no consuman más de lo que se llevó ni números negativos
        let consumoFinal = nuevoConsumo;
        if (consumoFinal < 0) consumoFinal = 0;
        if (consumoFinal > d.cantidad_despachada) consumoFinal = d.cantidad_despachada;

        return {
          ...d,
          cantidad_consumo: consumoFinal,
          cantidad_retorno: d.cantidad_despachada - consumoFinal // Retorno automático
        };
      }
      return d;
    }));
  };

  const handleConciliar = async () => {
    // Validar que estemos seguros
    if (!window.confirm('¿Estás seguro de guardar esta conciliación? El inventario se actualizará y los Sets se liberarán.')) {
      return;
    }

    setCargando(true);
    setError('');

    try {
      await axios.post(`http://localhost:4000/api/remisiones/${remisionId}/conciliar`, {
        detalles: detalles
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert('¡Remisión conciliada con éxito!');
      onGuardado(); // Actualiza la bandeja principal
      onClose();    // Cierra el modal
    } catch (err) {
      console.error('Error al conciliar:', err);
      setError(err.response?.data?.mensaje || 'Ocurrió un error al intentar conciliar la remisión.');
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* ENCABEZADO */}
        <div className="bg-oltech-black px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>✅</span>
              <span>Conciliar Remisión (Retorno)</span>
            </h2>
            {remision && (
              <p className="text-oltech-pink text-sm font-medium mt-0.5">
                Solicitud: {remision.no_solicitud} | {remision.unidad_medica_nombre}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* CUERPO */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 font-medium mb-6">
              {error}
            </div>
          )}

          {cargando && detalles.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12">
              <svg className="animate-spin h-10 w-10 text-oltech-pink mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <p className="text-gray-500 font-medium">Cargando datos de conciliación...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Información Resumen */}
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
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Despacho Total</p>
                  <p className="text-sm font-bold text-oltech-blue">{detalles.length} Ítems a conciliar</p>
                </div>
              </div>

              {/* Tabla de Conciliación */}
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
                            <span className="font-bold text-oltech-blue">{d.pieza_codigo || d.consumible_codigo || d.set_codigo}</span>
                            <div className="text-[9px] text-gray-400 mt-0.5">
                              {esConsumible ? 'Consumible Extra' : `Set: ${d.set_codigo || ''}`}
                            </div>
                          </td>
                          <td className="p-3 font-medium text-gray-800">
                            {d.pieza_descripcion || d.consumible_nombre || d.set_descripcion}
                          </td>
                          
                          {/* Columna: DESPACHO (Solo lectura) */}
                          <td className="p-3 bg-blue-50/30 border-l border-blue-100 text-center font-bold text-blue-700 text-sm">
                            {d.cantidad_despachada}
                          </td>
                          
                          {/* Columna: CONSUMO (Editable) */}
                          <td className="p-3 bg-red-50/50 border-l border-red-100 text-center">
                            <input 
                              type="number" 
                              min="0" 
                              max={d.cantidad_despachada}
                              value={d.cantidad_consumo}
                              onChange={(e) => handleConsumoChange(d.id, e.target.value)}
                              className="w-16 px-2 py-1.5 text-center border border-red-200 rounded font-bold text-red-600 focus:ring-2 focus:ring-red-400 outline-none bg-white shadow-inner"
                            />
                          </td>

                          {/* Columna: RETORNO (Auto-calculado) */}
                          <td className="p-3 bg-green-50/30 border-l border-green-100 text-center font-bold text-green-700 text-sm">
                            {d.cantidad_retorno}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}
        </div>

        {/* PIE DEL MODAL */}
        <div className="bg-white px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center shrink-0 gap-4">
          <div className="text-xs text-gray-500 font-medium flex items-center space-x-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Al guardar, el inventario se ajustará y los Sets se liberarán.</span>
          </div>
          <div className="flex space-x-3 w-full sm:w-auto">
            <button type="button" onClick={onClose} disabled={cargando} className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200">
              Cancelar
            </button>
            <button 
              type="button" 
              onClick={handleConciliar} 
              disabled={cargando || detalles.length === 0} 
              className="w-full sm:w-auto px-6 py-2.5 bg-oltech-black text-white rounded-lg font-bold shadow-md hover:bg-gray-800 transition-colors disabled:opacity-50 flex justify-center items-center space-x-2"
            >
              {cargando ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              )}
              <span>Guardar y Cerrar Remisión</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ModalContestarRemision;