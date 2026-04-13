//almacen-oltech-frontend/src/components/efectivo/ModalAuditoriaEfectivo.jsx
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalAuditoriaEfectivo({ isOpen, onClose, ingreso, onAuditoriaCompletada }) {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Si no está abierto o no hay ingreso seleccionado, no renderizamos
  if (!isOpen || !ingreso) return null;

  const handleAutorizar = async () => {
    // El ID 3 corresponde al estado 'Autorizada' en la base de datos
    const nuevoEstadoId = 3; 
    setMensaje({ texto: '', tipo: '' });
    setCargando(true);

    try {
      await axios.patch(
        `http://localhost:4000/api/ingresos-efectivo/${ingreso.id}/estado`, 
        { estado_id: nuevoEstadoId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMensaje({ texto: '¡Ingreso autorizado exitosamente!', tipo: 'exito' });
      
      // Esperamos 1.5 segundos para que vean el éxito y luego cerramos y recargamos
      setTimeout(() => {
        onAuditoriaCompletada();
        onClose();
      }, 1500);

    } catch (error) {
      setMensaje({ 
        texto: error.response?.data?.mensaje || 'Error al autorizar el ingreso.', 
        tipo: 'error' 
      });
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado */}
        <div className="bg-oltech-black px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <svg className="w-5 h-5 text-oltech-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
            <span>Auditoría de Folio: {ingreso.folio}</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Mensaje de Éxito/Error */}
        {mensaje.texto && (
          <div className="px-6 pt-4">
             <div className={`p-4 rounded-md border-l-4 font-medium ${mensaje.tipo === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
                {mensaje.texto}
             </div>
          </div>
        )}

        <div className="p-6 space-y-8">
          
          {/* Fila 1: Datos Generales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div>
              <p className="text-sm text-gray-500 mb-1">Pagador / Cliente</p>
              <p className="font-semibold text-gray-900 text-lg">{ingreso.nombre_quien_paga}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Razón del Ingreso</p>
              <p className="font-medium text-gray-800">{ingreso.razon}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Recibido por (Biomédico)</p>
              <p className="font-medium text-gray-800">{ingreso.biomedico_nombre} {ingreso.biomedico_apellido}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Fecha de Registro</p>
              <p className="font-medium text-gray-800">{new Date(ingreso.fecha).toLocaleString()}</p>
            </div>
          </div>

          {/* Fila 2: Desglose Monetario */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Desglose Monetario</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 border rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Acordado</p>
                <p className="text-xl font-bold text-gray-700">${parseFloat(ingreso.monto_acordado).toFixed(2)}</p>
              </div>
              <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                <p className="text-xs text-green-600 uppercase tracking-wide font-bold">Recibido</p>
                <p className="text-2xl font-black text-green-700">${parseFloat(ingreso.monto_recibido).toFixed(2)}</p>
              </div>
              <div className={`p-4 border rounded-lg ${parseFloat(ingreso.diferencia) === 0 ? 'bg-gray-50' : 'bg-red-50 border-red-200'}`}>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Diferencia</p>
                <p className={`text-xl font-bold ${parseFloat(ingreso.diferencia) === 0 ? 'text-gray-600' : 'text-red-600'}`}>
                  ${parseFloat(ingreso.diferencia).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Fila 3: Evidencias Visuales */}
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Evidencias Adjuntas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Foto INE */}
              <div className="space-y-2">
                <p className="font-medium text-gray-700 text-sm">Identificación (INE)</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 h-48 flex items-center justify-center">
                  {ingreso.foto_ine_url ? (
                    <img src={ingreso.foto_ine_url} alt="INE" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <p className="text-gray-400 italic text-sm">Sin evidencia de INE</p>
                  )}
                </div>
              </div>

              {/* Firma */}
              <div className="space-y-2">
                <p className="font-medium text-gray-700 text-sm">Firma de Conformidad</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-white h-48 flex items-center justify-center">
                  {ingreso.firma_url ? (
                    <img src={ingreso.firma_url} alt="Firma" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <p className="text-gray-400 italic text-sm">Firma no registrada</p>
                  )}
                </div>
              </div>

              {/* Foto Extra (Si existe) */}
              {ingreso.foto_evidencia_url && (
                <div className="space-y-2 md:col-span-2">
                  <p className="font-medium text-gray-700 text-sm">Evidencia Adicional (Dinero/Recibo)</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 h-64 flex items-center justify-center">
                    <img src={ingreso.foto_evidencia_url} alt="Evidencia Extra" className="max-h-full max-w-full object-contain" />
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Botonera Inferior */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-4">
          <button 
            onClick={onClose} 
            disabled={cargando}
            className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Cerrar Visualización
          </button>
          
          {/* Solo mostramos el botón de Autorizar si el estado actual NO es 'Autorizada' (ID 3) */}
          {ingreso.estado_id !== 3 && (
            <button 
              onClick={handleAutorizar} 
              disabled={cargando}
              className="px-8 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-70 flex items-center space-x-2"
            >
              {cargando ? (
                <span>Autorizando...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span>Autorizar Ingreso</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default ModalAuditoriaEfectivo;