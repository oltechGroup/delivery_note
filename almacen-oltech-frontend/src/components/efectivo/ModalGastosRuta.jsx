// almacen-oltech-frontend/src/components/efectivo/ModalGastosRuta.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

// NUEVO: Función utilitaria para formatear números como moneda
const formatearMoneda = (cantidad) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(cantidad || 0);
};

function ModalGastosRuta({ isOpen, onClose, ingreso, onGuardadoExitoso }) {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const [formData, setFormData] = useState({
    observaciones: '',
    monto_gasto: '',
    foto_observaciones_url: null
  });

  // CORRECCIÓN: Los Hooks (useEffect) siempre van antes de los "return null"
  useEffect(() => {
    // Solo actualizamos el estado si el modal está abierto y hay un ingreso seleccionado
    if (isOpen && ingreso) {
      setFormData({
        observaciones: ingreso.observaciones || '',
        monto_gasto: parseFloat(ingreso.monto_gasto) > 0 ? parseFloat(ingreso.monto_gasto).toString() : '',
        foto_observaciones_url: ingreso.foto_observaciones_url || null
      });
      setMensaje({ texto: '', tipo: '' });
    }
  }, [ingreso, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto_observaciones_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ texto: '', tipo: '' });

    if (!formData.observaciones && !formData.monto_gasto) {
      setMensaje({ texto: 'Debes ingresar una observación o un monto de gasto.', tipo: 'error' });
      return;
    }

    setCargando(true);
    try {
      await axios.post(
        `http://localhost:4000/api/ingresos-efectivo/${ingreso.id}/gastos`,
        {
          observaciones: formData.observaciones,
          monto_gasto: parseFloat(formData.monto_gasto) || 0,
          foto_observaciones_url: formData.foto_observaciones_url
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMensaje({ texto: '¡Gastos guardados correctamente!', tipo: 'exito' });
      
      setTimeout(() => {
        onGuardadoExitoso();
        onClose();
      }, 1500);

    } catch (error) {
      setMensaje({ 
        texto: error.response?.data?.mensaje || 'Error al guardar los gastos.', 
        tipo: 'error' 
      });
      setCargando(false);
    }
  };

  // CORRECCIÓN: Ahora sí, validamos y retornamos null ANTES de dibujar el HTML, pero DESPUÉS de todos los hooks.
  if (!isOpen || !ingreso) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      {/* RESPONSIVO: flex-col y max-h-[90vh] para garantizar scroll interno */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* RESPONSIVO: shrink-0 para proteger el header, padding ajustado */}
        <div className="bg-oltech-black px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white">Añadir Gastos / Observaciones</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors shrink-0 ml-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* RESPONSIVO: flex-col en móvil para evitar que los textos se empalmen, shrink-0 */}
        <div className="bg-blue-50 px-4 sm:px-6 py-3 border-b border-blue-100 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center text-sm gap-1 sm:gap-0 shrink-0">
           <span className="font-semibold text-blue-800">Folio: {ingreso.folio}</span>
           <span className="text-blue-600">Recibido inicial: <strong>{formatearMoneda(ingreso.monto_recibido)}</strong></span>
        </div>

        {/* Contenedor escroleable */}
        <div className="overflow-y-auto">
          {mensaje.texto && (
            <div className={`mx-4 sm:mx-6 mt-4 p-3 rounded-md border-l-4 text-xs sm:text-sm font-medium ${mensaje.tipo === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
              {mensaje.texto}
            </div>
          )}

          {/* RESPONSIVO: paddings ajustados */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto del Gasto ($)</label>
              {/* RESPONSIVO: text-base sm:text-sm para evitar auto-zoom en iOS */}
              <input 
                type="number" step="0.01" min="0" name="monto_gasto" 
                value={formData.monto_gasto} onChange={handleChange} 
                className="w-full px-4 py-2.5 sm:py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-400 outline-none font-semibold text-red-600 text-base sm:text-sm" 
                placeholder="Ej. 250.00" 
              />
              <p className="text-xs text-gray-500 mt-1">Si no hubo gasto, déjalo en blanco.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones / Concepto *</label>
              {/* RESPONSIVO: text-base sm:text-sm para evitar auto-zoom en iOS */}
              <textarea 
                name="observaciones" rows="3" required
                value={formData.observaciones} onChange={handleChange} 
                className="w-full px-4 py-2.5 sm:py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none text-base sm:text-sm" 
                placeholder="Ej. Pago de 2 casetas y propina de carga..." 
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Foto del Ticket / Comprobante</label>
              <input 
                type="file" accept="image/*" capture="environment" onChange={handleImageUpload} 
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 border border-gray-200 rounded-lg p-2" 
              />
              {formData.foto_observaciones_url && (
                <div className="mt-2 h-24 w-24 border rounded-lg overflow-hidden bg-gray-50">
                  <img src={formData.foto_observaciones_url} alt="Ticket" className="h-full w-full object-cover" />
                </div>
              )}
            </div>

            {/* RESPONSIVO: w-full y botones apilados (flex-col-reverse) en móvil */}
            <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 mt-auto">
              <button type="button" onClick={onClose} disabled={cargando} className="w-full sm:w-auto px-6 py-2.5 sm:py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 flex justify-center items-center">
                Cancelar
              </button>
              <button type="submit" disabled={cargando} className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-oltech-black text-white rounded-lg font-bold hover:bg-gray-800 disabled:opacity-70 flex justify-center items-center">
                {cargando ? 'Guardando...' : 'Guardar Gastos'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default ModalGastosRuta;