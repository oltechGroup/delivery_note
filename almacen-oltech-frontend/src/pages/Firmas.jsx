// almacen-oltech-frontend/src/pages/Firmas.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import ModalGestionFirmas from '../components/cotizaciones/ModalGestionFirmas';

function Firmas() {
  const [firmas, setFirmas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);

  const { token } = useAuth();

  const cargarFirmas = async () => {
    setCargando(true);
    try {
      const respuesta = await axios.get('http://localhost:4000/api/cotizaciones/firmas', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFirmas(respuesta.data);
      setError('');
    } catch (err) {
      console.error('Error al cargar firmas:', err);
      setError('No se pudo cargar el catálogo de firmas. Revisa tu conexión.');
    } finally {
      setCargando(false);
    }
  };

  // Cargar firmas al entrar a la página
  useEffect(() => {
    cargarFirmas();
  }, [token]);

  // Truco: Recargar la lista automáticamente cuando el modal se cierra 
  // (por si el usuario guardó una firma nueva)
  useEffect(() => {
    if (!modalAbierto) {
      cargarFirmas();
    }
  }, [modalAbierto]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      
      {/* 1. ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Catálogo de Firmas</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Administra las firmas autorizadas para los documentos oficiales de OLTECH.</p>
        </div>
        
        <button 
          className="mt-4 sm:mt-0 w-full sm:w-auto bg-oltech-black text-white px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-md flex items-center justify-center space-x-2"
          onClick={() => setModalAbierto(true)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span>Nueva Firma</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm sm:text-base font-medium">
          {error}
        </div>
      )}

      {/* 2. TABLA DE FIRMAS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs sm:text-sm uppercase tracking-wider whitespace-nowrap">
                <th className="p-3 sm:p-4 font-semibold w-24 text-center">ID</th>
                <th className="p-3 sm:p-4 font-semibold">Nombre del Firmante</th>
                <th className="p-3 sm:p-4 font-semibold text-center">Vista Previa</th>
                <th className="p-3 sm:p-4 font-semibold text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    <svg className="animate-spin h-8 w-8 mx-auto text-oltech-pink mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-medium">Cargando firmas...</span>
                  </td>
                </tr>
              ) : firmas.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500 text-sm sm:text-base">
                    No hay firmas registradas. Haz clic en "Nueva Firma" para comenzar.
                  </td>
                </tr>
              ) : (
                firmas.map((firma) => (
                  <tr key={firma.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 sm:p-4 text-center font-bold text-gray-500">
                      {firma.id}
                    </td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900 text-sm sm:text-base uppercase">{firma.nombre}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Representante Legal / Autorizado</div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex justify-center items-center h-16 w-48 mx-auto bg-gray-50 border border-gray-200 rounded p-1">
                        {firma.firmas_url ? (
                          <img 
                            src={firma.firmas_url} 
                            alt={`Firma de ${firma.nombre}`} 
                            className="max-h-full max-w-full object-contain pointer-events-none"
                          />
                        ) : (
                          <span className="text-xs text-gray-400 italic">Sin trazo</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-center whitespace-nowrap">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-wide border uppercase ${
                        firma.estado === 'activo' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {firma.estado || 'Activo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. MODAL DE CREACIÓN */}
      <ModalGestionFirmas 
        isOpen={modalAbierto} 
        onClose={() => setModalAbierto(false)} 
      />

    </div>
  );
}

export default Firmas;