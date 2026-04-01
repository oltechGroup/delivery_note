// almacen-oltech-frontend/src/pages/HistorialRemisiones.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import Buscador from '../components/almacen/Buscador'; 

function HistorialRemisiones() {
  const { token } = useAuth();
  const [remisiones, setRemisiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargarHistorial = async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await axios.get('http://localhost:4000/api/remisiones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRemisiones(respuesta.data);
    } catch (err) {
      console.error('Error al cargar el historial:', err);
      setError('No se pudo cargar el historial de remisiones.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, [token]);

  // Filtro inteligente
  const remisionesFiltradas = remisiones.filter(r => 
    (r.no_solicitud && r.no_solicitud.toLowerCase().includes(busqueda.toLowerCase())) ||
    (r.paciente && r.paciente.toLowerCase().includes(busqueda.toLowerCase())) ||
    (r.unidad_medica_nombre && r.unidad_medica_nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
    (r.creador_nombre && r.creador_nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
    (r.conciliador_nombre && r.conciliador_nombre.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Colores de estado (reutilizado de tu lógica)
  const getColorEstado = (nombreEstado) => {
    if (!nombreEstado) return 'bg-gray-100 text-gray-700';
    const estado = nombreEstado.toLowerCase();
    if (estado.includes('proceso') || estado.includes('calle') || estado.includes('pendiente')) {
      return 'bg-amber-100 text-amber-800'; 
    }
    if (estado.includes('completad') || estado.includes('cerrad')) {
      return 'bg-green-100 text-green-800'; 
    }
    if (estado.includes('cancelad')) {
      return 'bg-red-100 text-red-800'; 
    }
    return 'bg-blue-100 text-blue-800';
  };

  // Formatear Fecha (Solo Día)
  const formatearFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones).toUpperCase();
  };

  // Formatear Fecha y Hora (Para auditoría exacta)
  const formatearFechaHora = (fechaString) => {
    if (!fechaString) return '--';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones).toUpperCase();
  };

  return (
    <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Barra Superior */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <span>🗄️</span>
            <span>Historial y Auditoría de Remisiones</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Registro detallado de despachos y retornos para Operaciones y Sistemas.
          </p>
        </div>

        <div className="w-full lg:w-96">
          <Buscador 
            valor={busqueda} 
            onBuscar={setBusqueda} 
            placeholder="Buscar por folio, paciente, usuario..." 
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 font-medium">
          {error}
        </div>
      )}

      {/* Tabla de Historial */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {cargando ? (
          <div className="p-20 text-center flex flex-col items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-oltech-pink mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-gray-500 font-medium">Cargando historial de operaciones...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="p-4">Remisión</th>
                  <th className="p-4">Detalles Médicos</th>
                  <th className="p-4">Auditoría de Despacho (Salida)</th>
                  <th className="p-4">Auditoría de Retorno (Entrada)</th>
                  <th className="p-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {remisionesFiltradas.length > 0 ? (
                  remisionesFiltradas.map((rem) => (
                    <tr key={rem.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Columna: Remisión */}
                      <td className="p-4 align-top">
                        <span className="inline-block px-2 py-1 bg-oltech-black text-white text-xs font-bold rounded shadow-sm">
                          {rem.no_solicitud || `ID-${rem.id}`}
                        </span>
                        <div className="text-xs text-gray-500 mt-2 font-medium">
                          CX: <span className="text-gray-800 font-bold">{formatearFecha(rem.fecha_cirugia)}</span>
                        </div>
                      </td>

                      {/* Columna: Detalles Médicos */}
                      <td className="p-4 align-top max-w-xs">
                        <p className="font-bold text-gray-800 line-clamp-1">{rem.paciente || 'Sin paciente'}</p>
                        <p className="text-xs text-oltech-pink font-medium line-clamp-1 mt-0.5">{rem.procedimiento_nombre}</p>
                        <div className="mt-2 text-[11px] text-gray-500">
                          <p><span className="font-bold text-gray-400">HOSP:</span> {rem.unidad_medica_nombre}</p>
                          <p><span className="font-bold text-gray-400">DR:</span> {rem.medico_nombre}</p>
                        </div>
                      </td>

                      {/* Columna: Despacho (Quién Creó) */}
                      <td className="p-4 align-top">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800">{rem.creador_nombre || 'Sistema'}</span>
                          <span className="text-xs text-gray-500 mt-1">{formatearFechaHora(rem.fecha_creacion)}</span>
                        </div>
                      </td>

                      {/* Columna: Retorno (Quién Concilió) */}
                      <td className="p-4 align-top">
                        {rem.conciliador_nombre ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800">{rem.conciliador_nombre}</span>
                            <span className="text-xs text-gray-500 mt-1">{formatearFechaHora(rem.fecha_conciliacion)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Pendiente de retorno</span>
                        )}
                      </td>

                      {/* Columna: Estado */}
                      <td className="p-4 align-top text-center">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${getColorEstado(rem.estado_nombre)}`}>
                          {rem.estado_nombre || 'Desconocido'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No se encontraron registros que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistorialRemisiones;