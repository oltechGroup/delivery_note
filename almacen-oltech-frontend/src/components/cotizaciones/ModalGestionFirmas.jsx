// almacen-oltech-frontend/src/components/cotizaciones/ModalGestionFirmas.jsx
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import FirmaCanvas from '../efectivo/FirmaCanvas'; // Reutilizamos tu componente existente

function ModalGestionFirmas({ isOpen, onClose }) {
  const [nombreFirma, setNombreFirma] = useState('');
  const [firmaUrl, setFirmaUrl] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const { token } = useAuth();

  if (!isOpen) return null;

  const limpiarFormulario = () => {
    setNombreFirma('');
    setFirmaUrl(null);
    setError('');
    setExito('');
  };

  const handleCerrar = () => {
    limpiarFormulario();
    onClose();
  };

  // NUEVO: Función para convertir el Base64 del Canvas a un Archivo Físico para Multer
  const base64ToFile = (base64String, filename) => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleGuardarFirma = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    if (!nombreFirma.trim()) {
      return setError('Por favor, ingresa el nombre de la firma (Ej. Ana Karen Zavaleta).');
    }

    if (!firmaUrl) {
      return setError('Debes realizar el trazo de la firma en el recuadro blanco.');
    }

    setCargando(true);

    try {
      // NUEVO: Creamos el FormData para enviarlo a Multer
      const formData = new FormData();
      formData.append('nombre', nombreFirma.toUpperCase());
      
      // Convertimos el Base64 que nos dio el canvas a un archivo real y lo adjuntamos
      const archivoFirma = base64ToFile(firmaUrl, 'firma.png');
      formData.append('firma_url', archivoFirma);

      // Enviamos el FormData (axios configura automáticamente el header multipart/form-data)
      await axios.post('http://localhost:4000/api/cotizaciones/firmas', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setExito('¡Firma registrada exitosamente en el catálogo!');
      setTimeout(() => {
        handleCerrar();
      }, 2000);
      
    } catch (err) {
      console.error('Error al guardar firma:', err);
      setError(err.response?.data?.mensaje || 'Error al comunicarse con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* ENCABEZADO */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Alta de Nueva Firma</h2>
            <p className="text-xs text-gray-500 mt-1">Uso exclusivo de Sistemas para formatos oficiales.</p>
          </div>
          <button onClick={handleCerrar} className="text-gray-400 hover:text-red-500 transition-colors p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* CUERPO DEL MODAL */}
        <div className="p-6 overflow-y-auto">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100">{error}</div>}
          {exito && <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm font-medium rounded-lg border border-green-100">{exito}</div>}

          <form onSubmit={handleGuardarFirma} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre del Firmante</label>
              <input 
                type="text" 
                value={nombreFirma} 
                onChange={(e) => setNombreFirma(e.target.value)}
                placeholder=""
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-oltech-pink outline-none uppercase font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Trazo de la Firma</label>
              <p className="text-xs text-gray-500 mb-2">Dibuja la firma en el recuadro inferior. Asegúrate de que quede centrada.</p>
              
              <div className="bg-gray-100 p-2 rounded-lg flex justify-center">
                <FirmaCanvas onFirmaLista={(url) => setFirmaUrl(url)} />
              </div>
            </div>

            {/* BOTONES */}
            <div className="pt-4 flex flex-col-reverse sm:flex-row justify-end sm:space-x-3 gap-y-2 sm:gap-y-0">
              <button 
                type="button" 
                onClick={handleCerrar}
                className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                disabled={cargando}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="w-full sm:w-auto px-6 py-2.5 bg-oltech-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-md flex justify-center items-center disabled:opacity-50"
                disabled={cargando}
              >
                {cargando ? 'Guardando...' : 'Guardar Firma en Catálogo'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

export default ModalGestionFirmas;