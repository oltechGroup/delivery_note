// almacen-oltech-frontend/src/components/tickets/ModalDetalleTicket.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalDetalleTicket({ isOpen, onClose, ticketId }) {
  const { token } = useAuth();
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Efecto para cargar los datos cada vez que se abre el modal con un ID nuevo
  useEffect(() => {
    if (isOpen && ticketId) {
      cargarDetalleTicket();
    } else {
      // Limpiamos al cerrar
      setDetalle(null);
    }
  }, [isOpen, ticketId]);

  const cargarDetalleTicket = async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await axios.get(`http://localhost:4000/api/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDetalle(respuesta.data);
    } catch (err) {
      console.error('Error al cargar detalle del ticket:', err);
      setError('No se pudo cargar la información del ticket.');
    } finally {
      setCargando(false);
    }
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'Pendiente';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaISO).toLocaleDateString('es-MX', opciones);
  };

  const getBadgeEstado = (estado) => {
    switch (estado) {
      case 'Abierto': return 'bg-blue-100 text-blue-800';
      case 'En Revisión': return 'bg-yellow-100 text-yellow-800';
      case 'Resuelto': return 'bg-green-100 text-green-800';
      case 'Cancelado': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado */}
        <div className="bg-oltech-black px-4 sm:px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Folio: #TK-{ticketId ? String(ticketId).padStart(4, '0') : '0000'}
            </h2>
            {detalle && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getBadgeEstado(detalle.estado_nombre)}`}>
                {detalle.estado_nombre}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Cuerpo (Scrollable) */}
        <div className="p-0 overflow-y-auto flex-1 bg-gray-50">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <svg className="animate-spin h-10 w-10 text-oltech-pink mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p>Cargando información y evidencias...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600 font-medium">{error}</div>
          ) : detalle ? (
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
              
              {/* COLUMNA IZQUIERDA: Info General y Evidencia */}
              <div className="flex-1 p-4 sm:p-6 space-y-6">
                
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{detalle.asunto}</h3>
                  <p className="text-gray-700 whitespace-pre-wrap bg-white p-4 border border-gray-200 rounded-lg text-sm">
                    {detalle.descripcion}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm bg-white p-4 border border-gray-200 rounded-lg">
                  <div>
                    <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">Prioridad</span>
                    <span className="font-semibold text-gray-900">{detalle.prioridad_nombre}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">Levantado por</span>
                    <span className="font-semibold text-gray-900">{detalle.creador_nombre}</span>
                    <span className="text-gray-500 text-xs block">({detalle.creador_rol})</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">Fecha Creación</span>
                    <span className="font-medium text-gray-800">{formatearFecha(detalle.fecha_creacion)}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-xs uppercase tracking-wider mb-1">Técnico Asignado</span>
                    <span className="font-medium text-gray-800">{detalle.asignado_nombre || 'Sin asignar'}</span>
                  </div>
                </div>

                {/* Si está resuelto, mostramos las observaciones */}
                {detalle.estado_nombre === 'Resuelto' && detalle.observaciones_resolucion && (
                  <div className="bg-green-50 p-4 border border-green-200 rounded-lg">
                    <h4 className="text-green-800 font-bold mb-1 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Observaciones de Resolución
                    </h4>
                    <p className="text-green-900 text-sm whitespace-pre-wrap">{detalle.observaciones_resolucion}</p>
                    <p className="text-green-700 text-xs mt-2 text-right">Fecha: {formatearFecha(detalle.fecha_resolucion)}</p>
                  </div>
                )}

                {/* Evidencia (Imágenes) */}
                {detalle.imagenes && detalle.imagenes.length > 0 && (
                  <div>
                    <h4 className="text-gray-800 font-bold mb-3 border-b pb-2">Evidencia Adjunta ({detalle.imagenes.length})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {detalle.imagenes.map((img, index) => (
                        <a key={img.id} href={img.imagen_base64} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
                          <img 
                            src={img.imagen_base64} 
                            alt={`Evidencia ${index + 1}`} 
                            className="w-full h-24 object-cover rounded-lg border border-gray-300 shadow-sm"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* COLUMNA DERECHA: Historial / Auditoría (Timeline) */}
              <div className="w-full lg:w-1/3 bg-white p-4 sm:p-6">
                <h4 className="text-gray-900 font-bold mb-6 flex items-center border-b pb-2">
                  <svg className="w-5 h-5 mr-2 text-oltech-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Historial del Ticket
                </h4>
                
                <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                  {detalle.historial.map((mov, index) => (
                    <div key={mov.id} className="relative pl-6">
                      {/* Punto de la línea de tiempo */}
                      <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-[13px] ring-4 ring-white ${
                        index === detalle.historial.length - 1 ? 'bg-oltech-pink text-white' : 'bg-gray-200'
                      }`}>
                        {index === detalle.historial.length - 1 && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        )}
                      </span>
                      
                      <h5 className="flex items-center mb-1 text-sm font-bold text-gray-900">
                        {mov.accion}
                      </h5>
                      <time className="block mb-2 text-xs font-normal leading-none text-gray-400">
                        {formatearFecha(mov.fecha_accion)}
                      </time>
                      <p className="mb-2 text-sm font-normal text-gray-600">{mov.detalles}</p>
                      <div className="text-xs font-semibold text-oltech-black bg-gray-100 inline-block px-2 py-1 rounded">
                        Por: {mov.usuario_accion_nombre}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ModalDetalleTicket;