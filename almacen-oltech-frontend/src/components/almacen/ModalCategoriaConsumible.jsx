// almacen-oltech-frontend/src/components/almacen/ModalCategoriaConsumible.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalCategoriaConsumible({ isOpen, onClose, onGuardado }) {
  const { token } = useAuth();
  const [nombre, setNombre] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Limpiar el campo de texto cada vez que se abre la ventana
  useEffect(() => {
    if (isOpen) {
      setNombre('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre de la categoría no puede estar vacío.');
      return;
    }

    setError('');
    setCargando(true);

    try {
      // Hacemos la petición a la nueva ruta del backend que creamos
      await axios.post('http://localhost:4000/api/almacen/categorias-consumibles', 
        { nombre: nombre.toUpperCase() }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onGuardado(); // Le avisa a la pantalla que recargue las tarjetas
      onClose();    // Cierra la ventana
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear la categoría de insumo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado */}
        <div className="bg-oltech-black px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Nueva Clasificación</h2>
            <p className="text-oltech-pink text-xs font-medium mt-1">Categoría para Insumos a Granel</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Categoría *</label>
            <input 
              type="text" 
              autoFocus
              required 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none uppercase" 
              placeholder="Ej. MATERIAL DE CURACIÓN" 
            />
            <p className="text-xs text-gray-500 mt-2">
              Esta categoría agrupará tus insumos sueltos (Ej. SUTURAS, JERINGAS, VENDAS).
            </p>
          </div>

          {/* Botones */}
          <div className="pt-4 border-t border-gray-100 flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={cargando}
              className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={cargando}
              className="px-6 py-2 bg-oltech-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 flex items-center">
              {cargando ? 'Guardando...' : 'Crear Categoría'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ModalCategoriaConsumible;