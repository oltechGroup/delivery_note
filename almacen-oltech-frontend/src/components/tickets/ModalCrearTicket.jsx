// almacen-oltech-frontend/src/components/tickets/ModalCrearTicket.jsx
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalCrearTicket({ isOpen, onClose, onTicketGuardado }) {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Formulario base
  const [formData, setFormData] = useState({
    asunto: '',
    descripcion: '',
    prioridad_id: '1' // 1: Baja, 2: Media, 3: Alta, 4: Crítica
  });

  // Estado para guardar las imágenes convertidas a Base64
  const [imagenesBase64, setImagenesBase64] = useState([]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Función para convertir archivo de imagen a Base64
  const convertirABase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Manejador del input de archivos (Múltiples imágenes)
  const handleArchivos = async (e) => {
    const archivos = Array.from(e.target.files);
    try {
      const base64Array = await Promise.all(archivos.map(file => convertirABase64(file)));
      // Agregamos las nuevas imágenes a las que ya estaban (por si selecciona en varias tandas)
      setImagenesBase64(prev => [...prev, ...base64Array]);
    } catch (err) {
      console.error('Error al procesar imágenes:', err);
      setError('Ocurrió un error al cargar las imágenes.');
    }
  };

  const eliminarImagen = (index) => {
    const nuevasImagenes = [...imagenesBase64];
    nuevasImagenes.splice(index, 1);
    setImagenesBase64(nuevasImagenes);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await axios.post('http://localhost:4000/api/tickets', {
        ...formData,
        prioridad_id: parseInt(formData.prioridad_id),
        imagenes: imagenesBase64
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Limpiamos todo al terminar con éxito
      setFormData({ asunto: '', descripcion: '', prioridad_id: '1' });
      setImagenesBase64([]);
      
      onTicketGuardado(); 
      onClose();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar el ticket. Verifica tu conexión.');
    } finally {
      setCargando(false);
    }
  };

  const handleCerrarModal = () => {
    setFormData({ asunto: '', descripcion: '', prioridad_id: '1' });
    setImagenesBase64([]);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado */}
        <div className="bg-oltech-black px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
            <svg className="w-5 h-5 text-oltech-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            <span>Levantar Nuevo Ticket</span>
          </h2>
          <button onClick={handleCerrarModal} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-md">
              <p className="text-xs sm:text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Asunto (Problema o Solicitud) *</label>
              <input type="text" name="asunto" required value={formData.asunto} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none" 
                placeholder="Ej. La impresora de etiquetas no funciona" />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción Detallada *</label>
              <textarea name="descripcion" required value={formData.descripcion} onChange={handleChange} rows="3"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none resize-none" 
                placeholder="Explica qué estabas haciendo y qué error apareció..." />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Prioridad *</label>
              <select name="prioridad_id" value={formData.prioridad_id} onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none bg-white">
                <option value="1">Baja (Dudas, solicitudes que no detienen operación)</option>
                <option value="2">Media (Falla en un proceso no crítico)</option>
                <option value="3">Alta (No puedo realizar remisiones/cotizaciones)</option>
                <option value="4">Crítica (El sistema está totalmente caído / Caída de servidor)</option>
              </select>
            </div>

            {/* SECCIÓN DE IMÁGENES */}
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Adjuntar Evidencia (Imágenes)</label>
              
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                    <p className="text-xs text-gray-500">PNG, JPG o JPEG</p>
                  </div>
                  <input type="file" className="hidden" multiple accept="image/*" onChange={handleArchivos} />
                </label>
              </div>

              {/* Previsualización de imágenes cargadas */}
              {imagenesBase64.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {imagenesBase64.map((img, index) => (
                    <div key={index} className="relative group">
                      <img src={img} alt={`Evidencia ${index + 1}`} className="h-20 w-full object-cover rounded-md border border-gray-200" />
                      <button type="button" onClick={() => eliminarImagen(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 mt-auto">
            <button type="button" onClick={handleCerrarModal} disabled={cargando}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center">
              Cancelar
            </button>
            <button type="submit" disabled={cargando}
              className="w-full sm:w-auto px-6 py-2.5 bg-oltech-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 flex items-center justify-center">
              {cargando ? 'Enviando...' : 'Enviar Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModalCrearTicket;