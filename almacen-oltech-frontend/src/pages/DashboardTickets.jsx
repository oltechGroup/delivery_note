// almacen-oltech-frontend/src/pages/DashboardTickets.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import ModalDetalleTicket from '../components/tickets/ModalDetalleTicket';

function DashboardTickets() {
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para modales
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  
  // Estados para la acción de resolver
  const [modalResolverAbierto, setModalResolverAbierto] = useState(false);
  const [observacionesResolucion, setObservacionesResolucion] = useState('');
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  const { token, usuario } = useAuth();

  const cargarTodosLosTickets = async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await axios.get('http://localhost:4000/api/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(respuesta.data);
    } catch (err) {
      console.error('Error al cargar panel de tickets:', err);
      setError('No se pudo cargar el panel general de tickets.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTodosLosTickets();
  }, []);

  // --- Funciones de Acción para Sistemas ---

  const handleAbrirDetalle = (id) => {
    setTicketSeleccionado(id);
    setModalDetalleAbierto(true);
  };

  const handleTomarTicket = async (id) => {
    if (!window.confirm('¿Deseas tomar este ticket y pasarlo a estado "En Revision"? Te será asignado automáticamente.')) return;
    
    setProcesandoAccion(true);
    try {
      await axios.patch(`http://localhost:4000/api/tickets/${id}/estado`, {
        estado_id: 2, // 2 = En Revision
        detalles: `El ticket ha sido tomado por el técnico de Sistemas: ${usuario.nombre}` // <-- CORREGIDO: de user_name a nombre
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      cargarTodosLosTickets();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al tomar el ticket.');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const abrirModalResolver = (id) => {
    setTicketSeleccionado(id);
    setObservacionesResolucion('');
    setModalResolverAbierto(true);
  };

  const handleResolverTicket = async (e) => {
    e.preventDefault();
    setProcesandoAccion(true);
    try {
      await axios.patch(`http://localhost:4000/api/tickets/${ticketSeleccionado}/resolver`, {
        observaciones: observacionesResolucion
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setModalResolverAbierto(false);
      cargarTodosLosTickets();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al resolver el ticket.');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleCancelarTicket = async (id) => {
    if (!window.confirm('¿Estás seguro de CANCELAR este ticket? (Ej. Porque está duplicado o no procede)')) return;
    
    const motivo = window.prompt('Escribe el motivo de la cancelación para la auditoría:');
    if (!motivo) return; // Si cancela el prompt

    setProcesandoAccion(true);
    try {
      await axios.patch(`http://localhost:4000/api/tickets/${id}/estado`, {
        estado_id: 4, // 4 = Cancelado
        detalles: `Ticket cancelado. Motivo: ${motivo}`
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      cargarTodosLosTickets();
    } catch (err) {
      alert(err.response?.data?.mensaje || 'Error al cancelar el ticket.');
    } finally {
      setProcesandoAccion(false);
    }
  };

  // --- Utilidades Visuales ---

  const getBadgeEstado = (estado) => {
    switch (estado) {
      case 'Abierto': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'En Revision': return 'bg-yellow-50 text-yellow-700 border-yellow-200'; // <-- CORREGIDO SIN ACENTO
      case 'Resuelto': return 'bg-green-50 text-green-700 border-green-200';
      case 'Cancelado': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getBadgePrioridad = (prioridad) => {
    switch (prioridad) {
      case 'Baja': return 'text-green-600 bg-green-50';
      case 'Media': return 'text-yellow-600 bg-yellow-50';
      case 'Alta': return 'text-orange-600 bg-orange-50';
      case 'Critica': return 'text-red-600 bg-red-50 font-bold'; // <-- CORREGIDO SIN ACENTO
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Encabezado */}
      <div className="bg-oltech-black p-4 sm:p-6 rounded-xl shadow-md text-white flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center">
            <svg className="w-6 h-6 mr-2 text-oltech-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            Help Desk - Panel de Sistemas
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm mt-1">Gestión integral de reportes y soporte técnico a usuarios.</p>
        </div>
        <div className="mt-4 sm:mt-0 bg-gray-800 px-4 py-2 rounded-lg text-sm font-medium border border-gray-700">
          Total de reportes: {tickets.length}
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">{error}</div>}

      {/* Tabla de Tickets (Vista General) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap">
                <th className="p-3 sm:p-4 font-semibold">Folio</th>
                <th className="p-3 sm:p-4 font-semibold">Usuario</th>
                <th className="p-3 sm:p-4 font-semibold">Asunto</th>
                <th className="p-3 sm:p-4 font-semibold">Prioridad</th>
                <th className="p-3 sm:p-4 font-semibold">Estado</th>
                <th className="p-3 sm:p-4 font-semibold">Asignado</th>
                <th className="p-3 sm:p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    <svg className="animate-spin h-8 w-8 mx-auto text-oltech-pink mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Cargando panel de tickets...</span>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan="7" className="p-8 text-center text-gray-500">No hay tickets registrados en el sistema.</td></tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 sm:p-4 whitespace-nowrap"><span className="font-mono text-gray-500 text-sm">#TK-{String(ticket.id).padStart(4, '0')}</span></td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 text-sm">{ticket.creador_nombre}</div>
                      <div className="text-xs text-gray-500">{ticket.creador_username}</div>
                    </td>
                    <td className="p-3 sm:p-4 min-w-[200px]"><div className="font-medium text-gray-900 text-sm line-clamp-2">{ticket.asunto}</div></td>
                    <td className="p-3 sm:p-4 whitespace-nowrap"><span className={`px-2 py-1 rounded text-xs font-medium ${getBadgePrioridad(ticket.prioridad_nombre)}`}>{ticket.prioridad_nombre}</span></td>
                    <td className="p-3 sm:p-4 whitespace-nowrap"><span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeEstado(ticket.estado_nombre)}`}>{ticket.estado_nombre}</span></td>
                    <td className="p-3 sm:p-4 whitespace-nowrap text-sm text-gray-600">{ticket.asignado_nombre || <span className="text-gray-400 italic">Nadie</span>}</td>
                    
                    <td className="p-3 sm:p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Botón Detalles (Siempre visible) */}
                        <button onClick={() => handleAbrirDetalle(ticket.id)} className="text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition-colors" title="Ver Detalle Completo">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        </button>

                        {/* Botón Tomar Ticket (Solo si está Abierto) */}
                        {ticket.estado_nombre === 'Abierto' && (
                          <button onClick={() => handleTomarTicket(ticket.id)} disabled={procesandoAccion} className="text-yellow-600 hover:text-yellow-700 p-1 rounded-full hover:bg-yellow-50 transition-colors" title="Tomar / Poner en Revisión">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          </button>
                        )}

                        {/* Botón Resolver (Solo si está En Revision o Abierto) */}
                        {(ticket.estado_nombre === 'Abierto' || ticket.estado_nombre === 'En Revision') && ( // <-- CORREGIDO LA CONDICIÓN
                          <button onClick={() => abrirModalResolver(ticket.id)} disabled={procesandoAccion} className="text-green-600 hover:text-green-700 p-1 rounded-full hover:bg-green-50 transition-colors" title="Marcar como Resuelto">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                          </button>
                        )}

                        {/* Botón Cancelar (Solo si no está Resuelto o Cancelado ya) */}
                        {(ticket.estado_nombre !== 'Resuelto' && ticket.estado_nombre !== 'Cancelado') && (
                          <button onClick={() => handleCancelarTicket(ticket.id)} disabled={procesandoAccion} className="text-red-500 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors" title="Cancelar Ticket">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Reutilizado de Detalles */}
      <ModalDetalleTicket isOpen={modalDetalleAbierto} onClose={() => setModalDetalleAbierto(false)} ticketId={ticketSeleccionado} />

      {/* Modal Pequeño para Capturar las Observaciones al Resolver */}
      {modalResolverAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-green-600 px-4 py-3 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Resolver Ticket #{ticketSeleccionado}
              </h2>
              <button onClick={() => setModalResolverAbierto(false)} className="text-green-200 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <form onSubmit={handleResolverTicket} className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Qué acciones tomaste para solucionar el problema? (Esta observación quedará en la auditoría del ticket)
              </label>
              <textarea 
                required rows="4" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
                placeholder="Ej. Se reinició el servicio de base de datos y se liberó espacio en el servidor..."
                value={observacionesResolucion} onChange={(e) => setObservacionesResolucion(e.target.value)}
              />
              <div className="mt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setModalResolverAbierto(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" disabled={procesandoAccion} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-70">
                  {procesandoAccion ? 'Guardando...' : 'Confirmar Resolución'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default DashboardTickets;