// almacen-oltech-frontend/src/components/almacen/ModalAjusteStock.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalAjusteStock({ isOpen, onClose, onGuardado, consumible, tipoAjuste }) {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [cantidad, setCantidad] = useState(1);

  // Configuraciones visuales dependiendo si suma o resta
  const esSuma = tipoAjuste === 'sumar';
  const colorTema = esSuma ? 'green' : 'red';
  const titulo = esSuma ? 'Sumar Stock (Entrada)' : 'Restar Stock (Salida, Merma o Ajuste)';
  const verbo = esSuma ? 'Agregar' : 'Quitar';

  useEffect(() => {
    if (isOpen) {
      setCantidad(1);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !consumible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación de seguridad para no quedar en números negativos
    if (!esSuma && cantidad > consumible.cantidad) {
      setError(`No puedes restar ${cantidad}. Solo tienes ${consumible.cantidad} en stock.`);
      return;
    }

    if (cantidad <= 0) {
      setError('La cantidad debe ser mayor a cero.');
      return;
    }

    setError('');
    setCargando(true);

    try {
      // Si es resta, mandamos el número en negativo al backend
      const cantidadFinal = esSuma ? parseInt(cantidad) : -Math.abs(parseInt(cantidad));

      await axios.patch(`http://localhost:4000/api/almacen/consumibles/${consumible.id}/stock`, {
        cantidad_a_sumar: cantidadFinal
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      onGuardado();
      onClose();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al actualizar el stock.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      {/* RESPONSIVO: flex-col y max-h-[90vh] para que no se pierda al abrir el teclado en móviles */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado Dinámico */}
        {/* RESPONSIVO: shrink-0 protege el header y ajuste de padding */}
        <div className={`px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shrink-0 ${esSuma ? 'bg-green-600' : 'bg-red-600'}`}>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
            <span>{esSuma ? '➕' : '➖'}</span>
            <span>{titulo}</span>
          </h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors shrink-0 ml-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Formulario */}
        {/* RESPONSIVO: overflow-y-auto asegura scroll si el teclado numérico es muy grande */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md">
              <p className="text-xs sm:text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Tarjeta de información del insumo */}
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 text-center">
            <p className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase">{consumible.codigo_referencia}</p>
            <p className="text-xs sm:text-sm font-bold text-gray-800 mt-1">{consumible.nombre}</p>
            <div className="mt-2 sm:mt-3 inline-block bg-white border border-gray-200 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-sm">
              <span className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium mr-2">Stock Actual:</span>
              <span className="text-sm sm:text-base font-bold text-oltech-blue">{consumible.cantidad}</span>
            </div>
          </div>

          {/* Input de Cantidad */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 text-center">
              ¿Cuántas piezas vas a {verbo.toLowerCase()}?
            </label>
            <div className="flex items-center justify-center">
              {/* RESPONSIVO: text-base en móvil previene auto-zoom en iOS */}
              <input 
                type="number" min="1" required autoFocus
                value={cantidad} onChange={(e) => setCantidad(e.target.value)}
                className={`w-32 px-4 py-2.5 sm:py-3 rounded-lg border focus:outline-none text-center font-bold text-base sm:text-2xl shadow-sm ${
                  esSuma 
                    ? 'border-gray-300 focus:ring-2 focus:ring-green-500 text-green-700 bg-green-50' 
                    : 'border-gray-300 focus:ring-2 focus:ring-red-500 text-red-700 bg-red-50'
                }`} 
              />
            </div>
          </div>

          {/* Botones */}
          {/* RESPONSIVO: flex-col-reverse en móvil para apilar, botones al w-full */}
          <div className="pt-4 flex flex-col-reverse sm:flex-row sm:justify-between gap-3 sm:gap-4 sm:space-x-0 mt-auto">
            <button type="button" onClick={onClose} disabled={cargando} className="w-full py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200 flex justify-center items-center text-sm sm:text-base">
              Cancelar
            </button>
            <button type="submit" disabled={cargando} className={`w-full py-2.5 text-white rounded-lg font-bold shadow-md transition-colors disabled:opacity-70 flex items-center justify-center space-x-2 text-sm sm:text-base ${
              esSuma ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}>
              {cargando && <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              <span>{cargando ? 'Guardando...' : `Confirmar`}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ModalAjusteStock;