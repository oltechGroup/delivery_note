// almacen-oltech-frontend/src/pages/TicketsUsuario.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import ModalCrearTicket from '../components/tickets/ModalCrearTicket';
import ModalDetalleTicket from '../components/tickets/ModalDetalleTicket'; // NUEVO: Importamos el modal de detalle

function TicketsUsuario() {
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para los modales
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false); // NUEVO
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null); // NUEVO
  
  const { token } = useAuth();

  const cargarMisTickets = async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await axios.get('http://localhost:4000/api/tickets/mis-tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(respuesta.data);
    } catch (err) {
      console.error('Error al cargar tickets:', err);
      setError('No se pudo cargar tu lista de tickets. Revisa tu conexión.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMisTickets();
  }, []);

  // Función para abrir el detalle
  const handleAbrirDetalle = (id) => {
    setTicketSeleccionado(id);
    setModalDetalleAbierto(true);
  };

  // Utilidad para pintar el chip de estado
  const getBadgeEstado = (estado) => {
    switch (estado) {
      case 'Abierto':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'En Revision': // <-- CORREGIDO SIN ACENTO
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Resuelto':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Cancelado':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Utilidad para pintar la prioridad
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mis Tickets de Soporte</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Reporta problemas al área de TI y da seguimiento a tus solicitudes.</p>
        </div>
        
        <button 
          className="mt-4 sm:mt-0 w-full sm:w-auto bg-oltech-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center space-x-2"
          onClick={() => setModalCrearAbierto(true)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span>Levantar Ticket</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Tabla de Tickets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap">
                <th className="p-3 sm:p-4 font-semibold">Folio</th>
                <th className="p-3 sm:p-4 font-semibold">Asunto</th>
                <th className="p-3 sm:p-4 font-semibold">Fecha</th>
                <th className="p-3 sm:p-4 font-semibold">Prioridad</th>
                <th className="p-3 sm:p-4 font-semibold">Estado</th>
                <th className="p-3 sm:p-4 font-semibold">Atiende</th>
                <th className="p-3 sm:p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    <svg className="animate-spin h-8 w-8 mx-auto text-oltech-pink mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Cargando tus tickets...</span>
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500 text-sm sm:text-base">
                    No has levantado ningún ticket de soporte aún.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 sm:p-4 whitespace-nowrap">
                      <span className="font-mono text-gray-500 text-sm">#TK-{String(ticket.id).padStart(4, '0')}</span>
                    </td>
                    <td className="p-3 sm:p-4 min-w-[200px]">
                      <div className="font-medium text-gray-900 text-sm line-clamp-2" title={ticket.asunto}>
                        {ticket.asunto}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(ticket.fecha_creacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getBadgePrioridad(ticket.prioridad_nombre)}`}>
                        {ticket.prioridad_nombre}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeEstado(ticket.estado_nombre)}`}>
                        {ticket.estado_nombre}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 whitespace-nowrap text-sm text-gray-600">
                      {ticket.asignado_nombre || <span className="text-gray-400 italic">Sin asignar</span>}
                    </td>
                    <td className="p-3 sm:p-4 text-center">
                      <button 
                        className="text-oltech-black hover:text-oltech-pink transition-colors p-2 rounded-full hover:bg-red-50"
                        title="Ver Detalles y Auditoría"
                        onClick={() => handleAbrirDetalle(ticket.id)} // NUEVO: Llamamos a la función
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      <ModalCrearTicket 
        isOpen={modalCrearAbierto} 
        onClose={() => setModalCrearAbierto(false)} 
        onTicketGuardado={cargarMisTickets} 
      />

      <ModalDetalleTicket 
        isOpen={modalDetalleAbierto}
        onClose={() => setModalDetalleAbierto(false)}
        ticketId={ticketSeleccionado}
      />

    </div>
  );
}

export default TicketsUsuario;