// almacen-oltech-frontend/src/components/efectivo/ModalAuditoriaEfectivo.jsx
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import ModalGastosRuta from './ModalGastosRuta';

function ModalAuditoriaEfectivo({ isOpen, onClose, ingreso, onAuditoriaCompletada }) {
  const { token, usuario } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  
  // Estado para abrir el modal de gastos desde la auditoría
  const [modalGastosAbierto, setModalGastosAbierto] = useState(false);

  // Si no está abierto o no hay ingreso seleccionado, no renderizamos
  if (!isOpen || !ingreso) return null;

  // Función para limpiar el rol
  const limpiarTexto = (texto) => texto ? texto.replace(/‚/g, 'é') : '';
  const rolActual = limpiarTexto(usuario?.rol);

  const handleAutorizar = async () => {
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
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
          
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 border rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Acordado</p>
                  <p className="text-xl font-bold text-gray-600">${parseFloat(ingreso.monto_acordado).toFixed(2)}</p>
                </div>
                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <p className="text-xs text-blue-600 uppercase tracking-wide font-bold">Recibido Físico</p>
                  <p className="text-xl font-bold text-blue-700">${parseFloat(ingreso.monto_recibido).toFixed(2)}</p>
                </div>
                <div className="p-4 border rounded-lg bg-red-50 border-red-200">
                  <p className="text-xs text-red-600 uppercase tracking-wide font-bold">Gastos Ruta</p>
                  <p className="text-xl font-bold text-red-700">-${parseFloat(ingreso.monto_gasto || 0).toFixed(2)}</p>
                </div>
                <div className="p-4 border rounded-lg bg-green-50 border-green-300 shadow-inner">
                  <p className="text-xs text-green-700 uppercase tracking-wide font-black">Final a Entregar</p>
                  <p className="text-2xl font-black text-green-800">${parseFloat(ingreso.monto_final || ingreso.monto_recibido).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Fila 3: Observaciones de Gastos */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wider mb-1">Observaciones / Gastos</h3>
                {ingreso.observaciones ? (
                  <p className="text-gray-700 font-medium">{ingreso.observaciones}</p>
                ) : (
                  <p className="text-gray-400 italic text-sm">Sin observaciones ni gastos registrados.</p>
                )}
              </div>
              
              {/* Ventas puede añadir gastos si el estado no es 3 (Autorizado) */}
              {ingreso.estado_id !== 3 && (rolActual === 'Ventas' || rolActual === 'Sistemas') && (
                <button 
                  onClick={() => setModalGastosAbierto(true)}
                  className="mt-3 md:mt-0 px-4 py-2 bg-white border border-orange-300 text-orange-700 rounded-lg text-sm font-bold hover:bg-orange-100 transition-colors shadow-sm whitespace-nowrap ml-4"
                >
                  {ingreso.observaciones ? 'Editar Gastos' : 'Añadir Gastos'}
                </button>
              )}
            </div>

            {/* Fila 4: Evidencias Visuales CORREGIDA (4 columnas) */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Evidencias Adjuntas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Foto INE */}
                <div className="space-y-2">
                  <p className="font-medium text-gray-700 text-sm">INE Pagador</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 h-40 flex items-center justify-center">
                    {ingreso.foto_ine_url ? (
                      <img src={ingreso.foto_ine_url} alt="INE" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <p className="text-gray-400 italic text-sm">Sin evidencia</p>
                    )}
                  </div>
                </div>

                {/* Firma */}
                <div className="space-y-2">
                  <p className="font-medium text-gray-700 text-sm">Firma</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-white h-40 flex items-center justify-center">
                    {ingreso.firma_url ? (
                      <img src={ingreso.firma_url} alt="Firma" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <p className="text-gray-400 italic text-sm">Sin firma</p>
                    )}
                  </div>
                </div>

                {/* Foto Evidencia Inicial (Dinero) - RESTAURADA */}
                <div className="space-y-2">
                  <p className="font-medium text-gray-700 text-sm">Evidencia Inicial (Dinero)</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 h-40 flex items-center justify-center">
                    {ingreso.foto_evidencia_url ? (
                      <img src={ingreso.foto_evidencia_url} alt="Evidencia Inicial" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <p className="text-gray-400 italic text-sm">Sin foto inicial</p>
                    )}
                  </div>
                </div>

                {/* Foto Ticket Gastos */}
                <div className="space-y-2">
                  <p className="font-medium text-gray-700 text-sm">Ticket Gastos</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 h-40 flex items-center justify-center">
                    {ingreso.foto_observaciones_url ? (
                      <img src={ingreso.foto_observaciones_url} alt="Ticket Gastos" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <p className="text-gray-400 italic text-sm">Sin ticket</p>
                    )}
                  </div>
                </div>

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
              Cerrar
            </button>
            
            {ingreso.estado_id !== 3 && (rolActual === 'Ventas' || rolActual === 'Sistemas') && (
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
                    <span>Autorizar Entrega de ${parseFloat(ingreso.monto_final || ingreso.monto_recibido).toFixed(2)}</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Renderizamos el Modal de Gastos encima del Modal de Auditoría */}
      {modalGastosAbierto && (
        <ModalGastosRuta 
          isOpen={modalGastosAbierto}
          onClose={() => setModalGastosAbierto(false)}
          ingreso={ingreso}
          onGuardadoExitoso={() => {
            onAuditoriaCompletada(); 
            onClose(); 
          }}
        />
      )}
    </>
  );
}

export default ModalAuditoriaEfectivo;