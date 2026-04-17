// almacen-oltech-frontend/src/pages/AuditoriaEfectivo.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import ModalAuditoriaEfectivo from '../components/efectivo/ModalAuditoriaEfectivo';

// NUEVO: Función utilitaria para formatear números como moneda (Ej. 1500 -> $1,500.00)
const formatearMoneda = (cantidad) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(cantidad || 0);
};

function AuditoriaEfectivo() {
  const [ingresos, setIngresos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // Estado para el modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [ingresoSeleccionado, setIngresoSeleccionado] = useState(null);
  
  const { token } = useAuth();

  const cargarIngresos = async () => {
    setCargando(true);
    try {
      const respuesta = await axios.get('http://localhost:4000/api/ingresos-efectivo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIngresos(respuesta.data);
    } catch (err) {
      console.error('Error al cargar ingresos:', err);
      setError('No se pudo cargar la bandeja de ingresos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarIngresos();
  }, []);

  const handleAbrirAuditoria = (ingreso) => {
    setIngresoSeleccionado(ingreso);
    setModalAbierto(true);
  };

  return (
    // RESPONSIVO: Ajuste del margen vertical
    <div className="space-y-4 sm:space-y-6 pb-12 px-0 sm:px-0">
      
      {/* 1. Encabezado */}
      {/* RESPONSIVO: Reducción de padding en móvil */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="w-full sm:w-auto">
          {/* RESPONSIVO: Ajuste de textos */}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Auditoría de Efectivo</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Revisa y autoriza los cobros en efectivo reportados por el equipo Biomédico.</p>
        </div>
        
        {/* Estadísticas Rápidas */}
        {/* RESPONSIVO: w-full y gap-2 en móvil para distribuir las tarjetas a lo ancho */}
        <div className="mt-4 sm:mt-0 flex w-full sm:w-auto space-x-2 sm:space-x-4">
          <div className="flex-1 sm:flex-none bg-yellow-50 px-3 sm:px-4 py-2 rounded-lg border border-yellow-100 text-center">
            <p className="text-[10px] sm:text-xs text-yellow-600 font-bold uppercase">Pendientes</p>
            <p className="text-base sm:text-lg font-black text-yellow-700">
              {ingresos.filter(i => i.estado_id !== 3).length}
            </p>
          </div>
          <div className="flex-1 sm:flex-none bg-green-50 px-3 sm:px-4 py-2 rounded-lg border border-green-100 text-center">
            <p className="text-[10px] sm:text-xs text-green-600 font-bold uppercase">Autorizados</p>
            <p className="text-base sm:text-lg font-black text-green-700">
              {ingresos.filter(i => i.estado_id === 3).length}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-lg border border-red-100 text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* 2. La Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* RESPONSIVO: whitespace-nowrap para mantener el formato horizontal intacto */}
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap">
                <th className="p-3 sm:p-4 font-semibold">Folio / Fecha</th>
                <th className="p-3 sm:p-4 font-semibold">Cliente / Razón</th>
                <th className="p-3 sm:p-4 font-semibold">Biomédico</th>
                <th className="p-3 sm:p-4 font-semibold text-right">Recibido</th>
                <th className="p-3 sm:p-4 font-semibold text-center">Estado</th>
                <th className="p-3 sm:p-4 font-semibold text-center">Auditar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">Cargando registros...</td>
                </tr>
              ) : ingresos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">No hay ingresos reportados aún.</td>
                </tr>
              ) : (
                ingresos.map((ingreso) => (
                  <tr key={ingreso.id} className="hover:bg-gray-50 transition-colors">
                    {/* RESPONSIVO: Reducción de paddings, ajustes de texto y whitespace-nowrap */}
                    <td className="p-3 sm:p-4 whitespace-nowrap">
                      <div className="font-bold text-gray-900 text-xs sm:text-sm">{ingreso.folio}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500">{new Date(ingreso.fecha).toLocaleDateString()}</div>
                    </td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">
                      <div className="font-medium text-gray-800 text-xs sm:text-sm">{ingreso.nombre_quien_paga}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 truncate max-w-xs" title={ingreso.razon}>{ingreso.razon}</div>
                    </td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm text-gray-700">{ingreso.biomedico_nombre}</div>
                    </td>
                    <td className="p-3 sm:p-4 text-right whitespace-nowrap">
                      <div className="font-bold text-green-700 text-xs sm:text-sm">
                        {formatearMoneda(ingreso.monto_recibido)}
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-center whitespace-nowrap">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold tracking-wide border ${
                        ingreso.estado_id === 3 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse'
                      }`}>
                        {ingreso.estado_nombre}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-center whitespace-nowrap">
                      <button 
                        onClick={() => handleAbrirAuditoria(ingreso)}
                        className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                          ingreso.estado_id === 3 
                            ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50' 
                            : 'text-oltech-pink hover:bg-pink-50'
                        }`}
                        title={ingreso.estado_id === 3 ? "Ver Detalles" : "Auditar Ingreso"}
                      >
                        {ingreso.estado_id === 3 ? (
                           <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        ) : (
                           <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. El Modal de Revisión */}
      <ModalAuditoriaEfectivo 
        isOpen={modalAbierto} 
        onClose={() => setModalAbierto(false)} 
        ingreso={ingresoSeleccionado}
        onAuditoriaCompletada={cargarIngresos} 
      />

    </div>
  );
}

export default AuditoriaEfectivo;