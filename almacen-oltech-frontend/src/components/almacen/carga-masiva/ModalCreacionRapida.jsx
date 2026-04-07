// almacen-oltech-frontend/src/components/almacen/carga-masiva/ModalCreacionRapida.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../hooks/useAuth';

function ModalCreacionRapida({ isOpen, onClose, onProductoCreado, categoriaId }) {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  const sugerenciasUnidad = ['PIEZA', 'HOLE', 'MM', 'Ф', 'PAR', 'CAJA'];

  const [formData, setFormData] = useState({
    codigo_referencia: '',
    nombre: '',
    nombre_comercial: '', // NUEVO
    precio: '',           // NUEVO
    unidad_medida: 'PIEZA'
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ 
        codigo_referencia: '', 
        nombre: '', 
        nombre_comercial: '', // LIMPIAR
        precio: '',           // LIMPIAR
        unidad_medida: 'PIEZA'
      });
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
      setError('Código, nombre y unidad son obligatorios.');
      return;
    }

    setError('');
    setCargando(true);

    try {
      // 1. Creamos el producto en la BD con cantidad 0
      const respuesta = await axios.post('http://localhost:4000/api/almacen/consumibles', {
        codigo_referencia: formData.codigo_referencia.toUpperCase(),
        nombre: formData.nombre.toUpperCase(),
        nombre_comercial: formData.nombre_comercial.trim() ? formData.nombre_comercial.toUpperCase() : null,
        precio: formData.precio ? parseFloat(formData.precio) : null,
        unidad_medida: formData.unidad_medida.toUpperCase(),
        cantidad: 0, 
        lote: null,
        fecha_caducidad: null,
        categoria_id: categoriaId 
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      // 2. Le pasamos el producto RECIÉN CREADO al carrito incluyendo los nuevos campos
      const nuevoProducto = respuesta.data.consumible;
      onProductoCreado({
        id: nuevoProducto.id,
        codigo_referencia: nuevoProducto.codigo_referencia,
        nombre: nuevoProducto.nombre,
        nombre_comercial: nuevoProducto.nombre_comercial,
        precio: nuevoProducto.precio,
        unidad_medida: nuevoProducto.unidad_medida,
        cantidad: 0, 
        lote: null,
        fecha_caducidad: null
      });
      
      onClose();    
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al registrar el insumo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-green-200">
        
        {/* Encabezado Especial Inbound */}
        <div className="bg-green-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              <span>Crear Insumo al Vuelo</span>
            </h2>
            <p className="text-green-100 text-xs font-medium mt-0.5">El producto se añadirá directo al carrito.</p>
          </div>
          <button onClick={onClose} className="text-green-100 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">CÓDIGO DE REFERENCIA *</label>
            <input 
              type="text" name="codigo_referencia" required autoFocus 
              value={formData.codigo_referencia} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none uppercase font-mono text-sm" 
              placeholder="Ej. REF-8923-00" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">NOMBRE / DESCRIPCIÓN *</label>
            <input 
              type="text" name="nombre" required 
              value={formData.nombre} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none uppercase text-sm" 
              placeholder="Ej. TORNILLO ESPONJOSA 3.5X14" 
            />
          </div>

          {/* NUEVO: NOMBRE COMERCIAL */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">NOMBRE COMERCIAL (OPCIONAL)</label>
            <input 
              type="text" name="nombre_comercial" 
              value={formData.nombre_comercial} onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none uppercase text-sm italic" 
              placeholder="Ej. MARCA O LÍNEA" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">UNIDAD *</label>
              <input 
                type="text" name="unidad_medida" list="unidades-sugeridas-rapida" required 
                value={formData.unidad_medida} onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none uppercase bg-white text-sm"
              />
              <datalist id="unidades-sugeridas-rapida">
                {sugerenciasUnidad.map(u => <option key={u} value={u} />)}
              </datalist>
            </div>

            {/* NUEVO: PRECIO */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">PRECIO UNITARIO</label>
              <input 
                type="number" name="precio" step="0.01" min="0"
                value={formData.precio} onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none text-sm font-bold" 
                placeholder="$ 0.00"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={cargando} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={cargando} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-70 flex items-center space-x-2">
              {cargando && <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              <span>{cargando ? 'Guardando...' : 'Crear y Añadir'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ModalCreacionRapida;