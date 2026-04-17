// almacen-oltec-frontend/src/components/almacen/ModalCategoria.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalCategoria({ isOpen, onClose, onGuardado }) {
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
      await axios.post('http://localhost:4000/api/almacen/categorias', 
        { nombre: nombre.toUpperCase() }, // Lo mandamos en mayúsculas para mantener el estilo de tu Excel
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onGuardado(); // Le avisa a la pantalla que recargue las tarjetas
      onClose();    // Cierra la ventana
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear la categoría.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      {/* RESPONSIVO: flex-col y max-h-[90vh] para proteger contra teclados grandes */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado */}
        {/* RESPONSIVO: shrink-0 para que no se aplaste, ajuste de padding y textos */}
        <div className="bg-oltech-black px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white">Nueva Categoría</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors shrink-0 ml-2">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Formulario */}
        {/* RESPONSIVO: overflow-y-auto y paddings ajustados */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-md">
              <p className="text-xs sm:text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Almacén / Categoría *</label>
            {/* RESPONSIVO: text-base en móvil para prevenir auto-zoom, text-sm en PC */}
            <input 
              type="text" 
              autoFocus
              required 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none uppercase text-base sm:text-sm" 
              placeholder="Ej. OSTEOSÍNTESIS" 
            />
            <p className="text-xs text-gray-500 mt-2">
              Esta categoría agrupará un conjunto de sets y piezas (Ej. HOMBRO, CADERA OMMA).
            </p>
          </div>

          {/* Botones */}
          {/* RESPONSIVO: flex-col-reverse en móvil para apilar y w-full */}
          <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 sm:space-x-0 mt-auto">
            <button type="button" onClick={onClose} disabled={cargando}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors flex justify-center items-center">
              Cancelar
            </button>
            <button type="submit" disabled={cargando}
              className="w-full sm:w-auto px-6 py-2.5 bg-oltech-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 flex justify-center items-center">
              {cargando ? 'Guardando...' : 'Crear Categoría'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default ModalCategoria;