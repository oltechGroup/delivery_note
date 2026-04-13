//almacen-oltech-frontend/src/pages/AuditoriaEfectivo.jsx
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
    <div className="space-y-6 pb-12">
      
      {/* 1. Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Auditoría de Efectivo</h1>
          <p className="text-gray-500 text-sm mt-1">Revisa y autoriza los cobros en efectivo reportados por el equipo Biomédico.</p>
        </div>
        
        {/* Estadísticas Rápidas (Opcional, pero se ve muy pro) */}
        <div className="mt-4 sm:mt-0 flex space-x-4">
          <div className="bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-100 text-center">
            <p className="text-xs text-yellow-600 font-bold uppercase">Pendientes</p>
            <p className="text-lg font-black text-yellow-700">
              {ingresos.filter(i => i.estado_id !== 3).length}
            </p>
          </div>
          <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-100 text-center">
            <p className="text-xs text-green-600 font-bold uppercase">Autorizados</p>
            <p className="text-lg font-black text-green-700">
              {ingresos.filter(i => i.estado_id === 3).length}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* 2. La Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Folio / Fecha</th>
                <th className="p-4 font-semibold">Cliente / Razón</th>
                <th className="p-4 font-semibold">Biomédico</th>
                <th className="p-4 font-semibold text-right">Recibido</th>
                <th className="p-4 font-semibold text-center">Estado</th>
                <th className="p-4 font-semibold text-center">Auditar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">Cargando registros...</td>
                </tr>
              ) : ingresos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">No hay ingresos reportados aún.</td>
                </tr>
              ) : (
                ingresos.map((ingreso) => (
                  <tr key={ingreso.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{ingreso.folio}</div>
                      <div className="text-xs text-gray-500">{new Date(ingreso.fecha).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{ingreso.nombre_quien_paga}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs" title={ingreso.razon}>{ingreso.razon}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-gray-700">{ingreso.biomedico_nombre}</div>
                    </td>
                    <td className="p-4 text-right">
                      {/* NUEVO: Aplicamos el formateador a la columna "Recibido" */}
                      <div className="font-bold text-green-700">
                        {formatearMoneda(ingreso.monto_recibido)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${
                        ingreso.estado_id === 3 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse'
                      }`}>
                        {ingreso.estado_nombre}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleAbrirAuditoria(ingreso)}
                        className={`p-2 rounded-full transition-colors ${
                          ingreso.estado_id === 3 
                            ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50' 
                            : 'text-oltech-pink hover:bg-pink-50'
                        }`}
                        title={ingreso.estado_id === 3 ? "Ver Detalles" : "Auditar Ingreso"}
                      >
                        {ingreso.estado_id === 3 ? (
                           // Icono Ojo (Ver)
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        ) : (
                           // Icono Escudo Check (Auditar)
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
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