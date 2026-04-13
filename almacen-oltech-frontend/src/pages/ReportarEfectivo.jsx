// almacen-oltech-frontend/src/pages/ReportarEfectivo.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import FirmaCanvas from '../components/efectivo/FirmaCanvas';

function ReportarEfectivo() {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  // Estado del formulario
  const [formData, setFormData] = useState({
    folio: '',
    nombre_quien_paga: '',
    razon: '',
    monto_acordado: '',
    monto_recibido: '',
    diferencia: 0,
    firma_url: null,
    foto_evidencia_url: null,
    foto_ine_url: null
  });

  // Generar un folio automático al cargar la página (Ej. EFEC-123456)
  useEffect(() => {
    const generarFolio = () => {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      setFormData(prev => ({ ...prev, folio: `EFEC-${randomNum}` }));
    };
    generarFolio();
  }, []);

  // Calcular la diferencia automáticamente cada vez que cambien los montos
  useEffect(() => {
    const acordado = parseFloat(formData.monto_acordado) || 0;
    const recibido = parseFloat(formData.monto_recibido) || 0;
    const diff = acordado - recibido;
    setFormData(prev => ({ ...prev, diferencia: diff.toFixed(2) }));
  }, [formData.monto_acordado, formData.monto_recibido]);

  // Manejar cambios en inputs de texto
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Convertir imágenes subidas (INE o Evidencia) a Base64 para mandarlas al backend
  const handleImageUpload = (e, campo) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [campo]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Recibir la firma desde nuestro componente FirmaCanvas
  const handleFirmaLista = (firmaBase64) => {
    setFormData(prev => ({ ...prev, firma_url: firmaBase64 }));
  };

  // Enviar todo al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ texto: '', tipo: '' });

    // Validaciones extra de seguridad visual
    if (!formData.firma_url) {
      setMensaje({ texto: 'Por favor, es necesario que el cliente firme de conformidad.', tipo: 'error' });
      return;
    }
    if (!formData.foto_ine_url) {
      setMensaje({ texto: 'Es obligatorio subir la foto del INE.', tipo: 'error' });
      return;
    }

    setCargando(true);
    try {
      await axios.post('http://localhost:4000/api/ingresos-efectivo', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMensaje({ texto: '¡Ingreso reportado y enviado a Ventas exitosamente!', tipo: 'exito' });
      
      // Limpiar el formulario (excepto el folio, generamos uno nuevo)
      setTimeout(() => {
        window.location.reload(); // Recarga simple para limpiar todo, incluyendo el canvas
      }, 2000);

    } catch (error) {
      setMensaje({ 
        texto: error.response?.data?.mensaje || 'Error al conectar con el servidor.', 
        tipo: 'error' 
      });
      setCargando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Reportar Ingreso de Efectivo</h1>
        <p className="text-gray-500 text-sm mt-1">Registra los cobros realizados en campo. Esta información será auditada por Ventas.</p>
      </div>

      {mensaje.texto && (
        <div className={`p-4 rounded-lg font-medium border-l-4 ${mensaje.tipo === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* SECCIÓN 1: DATOS GENERALES */}
        <div className="p-6 border-b border-gray-100 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
            <span className="bg-oltech-pink text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">1</span>
            <span>Datos del Cobro</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Folio de Registro (Automático)</label>
              <input type="text" readOnly value={formData.folio} className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de quien paga *</label>
              <input type="text" name="nombre_quien_paga" required value={formData.nombre_quien_paga} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none" placeholder="Ej. Dr. Martínez / Hospital Ángeles" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Razón del ingreso *</label>
              <input type="text" name="razon" required value={formData.razon} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none" placeholder="Ej. Pago por excedente de consumibles en cirugía" />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: MONTOS */}
        <div className="p-6 border-b border-gray-100 space-y-4 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
            <span className="bg-oltech-pink text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">2</span>
            <span>Desglose Monetario</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Acordado ($) *</label>
              <input type="number" step="0.01" min="0" name="monto_acordado" required value={formData.monto_acordado} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-semibold text-gray-700" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto Recibido ($) *</label>
              <input type="number" step="0.01" min="0" name="monto_recibido" required value={formData.monto_recibido} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none text-lg font-semibold text-green-600" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diferencia (Deuda o a favor)</label>
              <div className={`w-full px-4 py-3 rounded-lg border text-lg font-bold ${formData.diferencia > 0 ? 'bg-red-50 border-red-200 text-red-600' : formData.diferencia < 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
                $ {formData.diferencia}
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: EVIDENCIAS */}
        <div className="p-6 border-b border-gray-100 space-y-6">
          <h2 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
            <span className="bg-oltech-pink text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-sm">3</span>
            <span>Evidencias y Firmas</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Subida de Archivos */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto del INE (Requerido) *</label>
                <input type="file" accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e, 'foto_ine_url')} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-oltech-pink hover:file:bg-pink-100 border border-gray-200 rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto del Dinero / Recibo (Opcional)</label>
                <input type="file" accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e, 'foto_evidencia_url')} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-200 rounded-lg p-2" />
              </div>
            </div>

            {/* Firma */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Firma de Conformidad *</label>
              <FirmaCanvas onFirmaLista={handleFirmaLista} />
            </div>
          </div>
        </div>

        {/* BOTÓN ENVIAR */}
        <div className="p-6 bg-gray-50 flex justify-end">
          <button type="submit" disabled={cargando} className="px-8 py-3 bg-oltech-black text-white rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-70 shadow-lg flex items-center space-x-2">
            {cargando ? (
              <span>Procesando...</span>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>Enviar Reporte a Ventas</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}

export default ReportarEfectivo;