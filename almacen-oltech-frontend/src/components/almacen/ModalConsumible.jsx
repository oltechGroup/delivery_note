// almacen-oltech-frontend/src/components/almacen/ModalConsumible.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalConsumible({ isOpen, onClose, onGuardado, categoriaId }) { 
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  // Lista de sugerencias para la unidad de medida
  const sugerenciasUnidad = ['PIEZA', 'HOLE', 'MM', 'Ф', 'PAR', 'CAJA'];

  // Estados para Lote y Caducidad
  const [incluirLote, setIncluirLote] = useState(false);
  const [incluirCaducidad, setIncluirCaducidad] = useState(false);

  // Estado del formulario ampliado con Nombre Comercial y Precio
  const [formData, setFormData] = useState({
    codigo_referencia: '',
    nombre: '',
    nombre_comercial: '',
    precio: '',
    unidad_medida: 'PIEZA', 
    cantidad: 0,
    lote: '',
    fecha_caducidad: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ 
        codigo_referencia: '', 
        nombre: '', 
        nombre_comercial: '',
        precio: '',
        unidad_medida: 'PIEZA', 
        cantidad: 0,
        lote: '',
        fecha_caducidad: ''
      });
      setIncluirLote(false);
      setIncluirCaducidad(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.codigo_referencia.trim() || !formData.nombre.trim() || !formData.unidad_medida.trim()) {
      setError('El código de referencia, el nombre y la unidad de medida son obligatorios.');
      return;
    }

    if (incluirLote && !formData.lote.trim()) {
      setError('Debes ingresar el Lote.');
      return;
    }

    if (incluirCaducidad && !formData.fecha_caducidad) {
      setError('Debes ingresar la Fecha de Caducidad.');
      return;
    }

    setError('');
    setCargando(true);

    try {
      await axios.post('http://localhost:4000/api/almacen/consumibles', {
        codigo_referencia: formData.codigo_referencia.toUpperCase(),
        nombre: formData.nombre.toUpperCase(),
        nombre_comercial: formData.nombre_comercial.trim() ? formData.nombre_comercial.toUpperCase() : null,
        precio: formData.precio ? parseFloat(formData.precio) : null,
        unidad_medida: formData.unidad_medida.toUpperCase(),
        cantidad: parseInt(formData.cantidad),
        lote: incluirLote ? formData.lote.toUpperCase() : null,
        fecha_caducidad: incluirCaducidad ? formData.fecha_caducidad : null,
        categoria_id: categoriaId 
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      onGuardado(); 
      onClose();    
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al registrar el insumo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
        
        {/* Encabezado */}
        <div className="bg-oltech-black px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Nuevo Insumo</h2>
            <p className="text-oltech-pink text-sm font-medium">Registro de stock a granel</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Código de Referencia (Fábrica) *</label>
              <input 
                type="text" name="codigo_referencia" required autoFocus 
                value={formData.codigo_referencia} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none uppercase font-mono text-sm" 
                placeholder="Ej. REF-8923-00" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre / Descripción *</label>
              <input 
                type="text" name="nombre" required 
                value={formData.nombre} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none uppercase text-sm" 
                placeholder="Ej. TORNILLO ESPONJOSA 3.5X14" 
              />
            </div>

            {/* NUEVO: NOMBRE COMERCIAL */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Comercial (Opcional)</label>
              <input 
                type="text" name="nombre_comercial" 
                value={formData.nombre_comercial} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none uppercase text-sm italic" 
                placeholder="Ej. MARCA ACME / LÍNEA PREMIUM" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Unidad de Medida *</label>
              <input 
                type="text" name="unidad_medida" list="unidades-sugeridas-consumible" required 
                value={formData.unidad_medida} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none uppercase bg-white text-sm"
              />
              <datalist id="unidades-sugeridas-consumible">
                {sugerenciasUnidad.map(u => <option key={u} value={u} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Stock Inicial *</label>
              <input 
                type="number" name="cantidad" min="0" required 
                value={formData.cantidad} onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none text-center font-bold text-lg" 
              />
            </div>
          </div>

          {/* NUEVO: PRECIO */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Precio Unitario (Opcional)</label>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-gray-500 font-bold">$</span>
              <input 
                type="number" name="precio" step="0.01" min="0"
                value={formData.precio} onChange={handleChange}
                className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none font-bold text-gray-700" 
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-2">
            <div className="flex flex-col space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                <input 
                  type="checkbox" checked={incluirLote} onChange={(e) => setIncluirLote(e.target.checked)}
                  className="w-5 h-5 text-oltech-pink bg-gray-100 border-gray-300 rounded focus:ring-oltech-pink"
                />
                <span className="text-sm font-bold text-gray-700">¿Requiere Lote?</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200">
                <input 
                  type="checkbox" checked={incluirCaducidad} onChange={(e) => setIncluirCaducidad(e.target.checked)}
                  className="w-5 h-5 text-oltech-pink bg-gray-100 border-gray-300 rounded focus:ring-oltech-pink"
                />
                <span className="text-sm font-bold text-gray-700">¿Requiere Fecha de Caducidad?</span>
              </label>
            </div>

            {(incluirLote || incluirCaducidad) && (
              <div className="grid grid-cols-2 gap-4 mt-4 bg-pink-50/50 p-4 rounded-lg border border-pink-100 animate-in fade-in slide-in-from-top-2">
                {incluirLote && (
                  <div className={!incluirCaducidad ? "col-span-2" : ""}>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Lote *</label>
                    <input 
                      type="text" name="lote" required={incluirLote}
                      value={formData.lote} onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none uppercase font-mono text-sm" 
                      placeholder="Ej. L-102938" 
                    />
                  </div>
                )}
                
                {incluirCaducidad && (
                  <div className={!incluirLote ? "col-span-2" : ""}>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de Caducidad *</label>
                    <input 
                      type="date" name="fecha_caducidad" required={incluirCaducidad}
                      value={formData.fecha_caducidad} onChange={handleChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none text-sm text-gray-700" 
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={cargando} className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={cargando} className="px-6 py-2 bg-oltech-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 flex items-center space-x-2">
              {cargando && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              )}
              <span>{cargando ? 'Guardando...' : 'Registrar Insumo'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ModalConsumible;