// almacen-oltech-frontend/src/pages/Cotizaciones.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

// Importamos el visor de PDF que ya tiene las correcciones de diseño
import ImpresionCotizacion from '../components/cotizaciones/ImpresionCotizacion';

function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // Estado exclusivo para abrir el PDF
  const [cotizacionAImprimir, setCotizacionAImprimir] = useState(null);
  
  const { token } = useAuth(); 
  const navigate = useNavigate();

  const cargarCotizaciones = async () => {
    try {
      const respuesta = await axios.get('http://localhost:4000/api/cotizaciones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCotizaciones(respuesta.data);
    } catch (err) {
      console.error('Error al cargar cotizaciones:', err);
      setError('No se pudo cargar el historial de cotizaciones.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCotizaciones();
  }, [token]);

  // Formateadores
  const formatearDinero = (monto) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  };

  const formatearFecha = (fechaString) => {
    const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones).toUpperCase();
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300 relative font-['Lato',_sans-serif]">
      
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap');`}
      </style>

      {/* 1. ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="w-full sm:w-auto">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Historial de Cotizaciones</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Gestión de formatos oficiales OLTECH.</p>
        </div>
        
        <div className="mt-4 sm:mt-0 w-full sm:w-auto">
          <button 
            className="w-full sm:w-auto bg-oltech-black text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-800 transition-all shadow-md flex items-center justify-center space-x-2"
            onClick={() => navigate('/cotizaciones/nueva')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            <span>Nueva Cotización</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm font-medium">
          {error}
        </div>
      )}

      {/* 2. TABLA DE COTIZACIONES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider whitespace-nowrap">
                <th className="p-4 font-bold">Folio</th>
                <th className="p-4 font-bold">Fecha</th>
                <th className="p-4 font-bold">Cliente</th>
                <th className="p-4 font-bold">Total</th>
                <th className="p-4 font-bold">Autorizó</th>
                <th className="p-4 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-400">
                    <div className="animate-spin h-8 w-8 mx-auto text-oltech-pink mb-2 border-4 border-t-transparent rounded-full"></div>
                    <span className="text-sm font-medium">Cargando datos...</span>
                  </td>
                </tr>
              ) : cotizaciones.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-500 italic">
                    No hay registros disponibles.
                  </td>
                </tr>
              ) : (
                cotizaciones.map((cot) => (
                  <tr key={cot.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4 whitespace-nowrap font-bold text-gray-900">
                      COT-{String(cot.id).padStart(4, '0')}
                    </td>
                    <td className="p-4 whitespace-nowrap text-sm text-gray-600">
                      {formatearFecha(cot.fecha)}
                    </td>
                    <td className="p-4 min-w-[200px] text-sm text-gray-800">
                      <div className="line-clamp-1 font-medium uppercase">{cot.cliente_texto}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap font-bold text-green-700">
                      {formatearDinero(cot.total)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded text-[10px] font-bold border border-blue-100 uppercase">
                        {cot.creador_nombre}
                      </span>
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <button 
                        className="bg-white border border-oltech-pink text-oltech-pink hover:bg-oltech-pink hover:text-white transition-all px-4 py-1.5 rounded-lg font-bold text-xs flex items-center justify-center space-x-1 mx-auto shadow-sm"
                        onClick={() => setCotizacionAImprimir(cot.id)} 
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        <span>GENERAR PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. VISOR DE PDF (MODAL) */}
      {cotizacionAImprimir && (
        <ImpresionCotizacion 
          cotizacionId={cotizacionAImprimir} 
          onClose={() => setCotizacionAImprimir(null)} 
        />
      )}

    </div>
  );
}

export default Cotizaciones;