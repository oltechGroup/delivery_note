// almacen-oltech-frontend/src/pages/ReportarEfectivo.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import FirmaCanvas from '../components/efectivo/FirmaCanvas';
import ModalGastosRuta from '../components/efectivo/ModalGastosRuta';

// NUEVO: Función utilitaria para formatear números como moneda (Ej. 1500 -> $1,500.00)
const formatearMoneda = (cantidad) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(cantidad || 0);
};

function ReportarEfectivo() {
  const { token, usuario } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  
  // Pestañas (Tabs)
  const [pestanaActiva, setPestanaActiva] = useState('nuevo'); // 'nuevo' o 'historial'
  
  // Estado para el historial del biomédico
  const [misIngresos, setMisIngresos] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  
  // Estado para el modal de gastos
  const [modalGastosAbierto, setModalGastosAbierto] = useState(false);
  const [ingresoParaGastos, setIngresoParaGastos] = useState(null);

  // Estado del formulario de nuevo reporte
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

  // Cargar el historial cuando cambien a la pestaña 'historial'
  useEffect(() => {
    if (pestanaActiva === 'historial') {
      cargarMisIngresos();
    }
  }, [pestanaActiva]);

  // Función para cargar los ingresos creados por el usuario logueado
  const cargarMisIngresos = async () => {
    setCargandoHistorial(true);
    try {
      const respuesta = await axios.get('http://localhost:4000/api/ingresos-efectivo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filtramos para mostrar SOLO los del usuario logueado y que NO estén autorizados (ID 3)
      const misPendientes = respuesta.data.filter(
        ingreso => ingreso.usuario_recibe_id === usuario.id && ingreso.estado_id !== 3
      );
      
      setMisIngresos(misPendientes);
    } catch (err) {
      console.error('Error al cargar historial:', err);
    } finally {
      setCargandoHistorial(false);
    }
  };

  // Manejar cambios en inputs de texto
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Convertir imágenes subidas (INE o Evidencia) a Base64
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

  // Recibir la firma
  const handleFirmaLista = (firmaBase64) => {
    setFormData(prev => ({ ...prev, firma_url: firmaBase64 }));
  };

  // Enviar el nuevo reporte al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ texto: '', tipo: '' });

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

      setMensaje({ texto: '¡Ingreso reportado exitosamente! Ahora puedes añadir gastos en la pestaña "Mis Reportes".', tipo: 'exito' });
      
      // Limpiamos y mandamos a la pestaña del historial después de 2 segundos
      setTimeout(() => {
        window.location.reload(); 
      }, 2000);

    } catch (error) {
      setMensaje({ 
        texto: error.response?.data?.mensaje || 'Error al conectar con el servidor.', 
        tipo: 'error' 
      });
      setCargando(false);
    }
  };

  // Abrir modal de gastos
  const handleAbrirGastos = (ingreso) => {
    setIngresoParaGastos(ingreso);
    setModalGastosAbierto(true);
  };

  return (
    // RESPONSIVO: px-4 para no pegar a los bordes en celular
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-12 px-0 sm:px-0">
      
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Efectivo</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Reporta cobros y registra gastos de ruta asociados.</p>
        </div>
      </div>

      {/* Pestañas de Navegación */}
      {/* RESPONSIVO: overflow-x-auto y whitespace-nowrap para deslizar en móviles */}
      <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap">
        <button 
          onClick={() => setPestanaActiva('nuevo')}
          className={`py-3 px-4 sm:px-6 font-medium text-sm transition-colors border-b-2 ${pestanaActiva === 'nuevo' ? 'border-oltech-pink text-oltech-pink bg-white rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Nuevo Reporte
        </button>
        <button 
          onClick={() => setPestanaActiva('historial')}
          className={`py-3 px-4 sm:px-6 font-medium text-sm transition-colors border-b-2 ${pestanaActiva === 'historial' ? 'border-oltech-pink text-oltech-pink bg-white rounded-t-lg' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Mis Reportes Pendientes
        </button>
      </div>

      {mensaje.texto && (
        <div className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base font-medium border-l-4 ${mensaje.tipo === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
          {mensaje.texto}
        </div>
      )}

      {/* CONTENIDO PESTAÑA: NUEVO REPORTE */}
      {pestanaActiva === 'nuevo' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
          
          {/* SECCIÓN 1: DATOS GENERALES */}
          <div className="p-4 sm:p-6 border-b border-gray-100 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center space-x-2">
              <span className="bg-oltech-pink text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full inline-flex items-center justify-center text-xs sm:text-sm shrink-0">1</span>
              <span>Datos del Cobro Inicial</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Folio de Registro (Automático)</label>
                <input type="text" readOnly value={formData.folio} className="w-full px-4 py-2.5 sm:py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 font-mono text-base sm:text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de quien paga *</label>
                <input type="text" name="nombre_quien_paga" required value={formData.nombre_quien_paga} onChange={handleChange} className="w-full px-4 py-2.5 sm:py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none text-base sm:text-sm" placeholder="Ej. Dr. Martínez / Hospital Ángeles" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Razón del ingreso *</label>
                <input type="text" name="razon" required value={formData.razon} onChange={handleChange} className="w-full px-4 py-2.5 sm:py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none text-base sm:text-sm" placeholder="Ej. Pago por excedente de consumibles en cirugía" />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: MONTOS */}
          <div className="p-4 sm:p-6 border-b border-gray-100 space-y-4 bg-gray-50">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center space-x-2">
              <span className="bg-oltech-pink text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full inline-flex items-center justify-center text-xs sm:text-sm shrink-0">2</span>
              <span>Desglose Monetario</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Acordado ($) *</label>
                <input type="number" step="0.01" min="0" name="monto_acordado" required value={formData.monto_acordado} onChange={handleChange} className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-base sm:text-lg font-semibold text-gray-700" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Recibido ($) *</label>
                <input type="number" step="0.01" min="0" name="monto_recibido" required value={formData.monto_recibido} onChange={handleChange} className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none text-base sm:text-lg font-semibold text-green-600" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diferencia (Deuda o a favor)</label>
                <div className={`w-full px-4 py-2.5 sm:py-3 rounded-lg border text-base sm:text-lg font-bold ${formData.diferencia > 0 ? 'bg-red-50 border-red-200 text-red-600' : formData.diferencia < 0 ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
                  {formatearMoneda(formData.diferencia)}
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: EVIDENCIAS */}
          <div className="p-4 sm:p-6 border-b border-gray-100 space-y-4 sm:space-y-6">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 flex items-center space-x-2">
              <span className="bg-oltech-pink text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full inline-flex items-center justify-center text-xs sm:text-sm shrink-0">3</span>
              <span>Evidencias y Firmas</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto del INE (Requerido) *</label>
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e, 'foto_ine_url')} className="w-full text-xs sm:text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-pink-50 file:text-oltech-pink hover:file:bg-pink-100 border border-gray-200 rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto del Dinero / Recibo (Opcional)</label>
                  <input type="file" accept="image/*" capture="environment" onChange={(e) => handleImageUpload(e, 'foto_evidencia_url')} className="w-full text-xs sm:text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-200 rounded-lg p-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Firma de Conformidad *</label>
                <FirmaCanvas onFirmaLista={handleFirmaLista} />
              </div>
            </div>
          </div>

          {/* BOTÓN ENVIAR */}
          <div className="p-4 sm:p-6 bg-gray-50 flex sm:justify-end">
            {/* RESPONSIVO: w-full y justify-center en móvil */}
            <button type="submit" disabled={cargando} className="w-full sm:w-auto px-8 py-3 bg-oltech-black text-white rounded-lg font-bold text-base sm:text-lg hover:bg-gray-800 transition-colors disabled:opacity-70 shadow-lg flex items-center justify-center space-x-2">
              {cargando ? <span>Procesando...</span> : <span>Guardar Reporte Inicial</span>}
            </button>
          </div>
        </form>
      )}

      {/* CONTENIDO PESTAÑA: MIS REPORTES EN PROCESO */}
      {pestanaActiva === 'historial' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
             <h2 className="font-semibold text-gray-800 text-sm sm:text-base">Tus reportes pendientes de entregar a Ventas</h2>
             <p className="text-xs sm:text-sm text-gray-500">Aquí puedes añadir gastos de ruta (casetas, gasolina) antes de entregar el efectivo físico.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {/* RESPONSIVO: whitespace-nowrap */}
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap">
                  <th className="p-3 sm:p-4 font-semibold">Folio</th>
                  <th className="p-3 sm:p-4 font-semibold">Cliente</th>
                  <th className="p-3 sm:p-4 font-semibold text-right">Recibido</th>
                  <th className="p-3 sm:p-4 font-semibold text-right">Gastos</th>
                  <th className="p-3 sm:p-4 font-semibold text-right">Final a Entregar</th>
                  <th className="p-3 sm:p-4 font-semibold text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cargandoHistorial ? (
                  <tr><td colSpan="6" className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">Cargando tus reportes...</td></tr>
                ) : misIngresos.length === 0 ? (
                  <tr><td colSpan="6" className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">No tienes reportes pendientes. ¡Todo en orden!</td></tr>
                ) : (
                  misIngresos.map(ingreso => (
                    <tr key={ingreso.id} className="hover:bg-gray-50">
                      <td className="p-3 sm:p-4 font-bold text-gray-900 text-xs sm:text-sm whitespace-nowrap">{ingreso.folio}</td>
                      <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-700 whitespace-nowrap">{ingreso.nombre_quien_paga}</td>
                      
                      <td className="p-3 sm:p-4 text-right font-medium text-gray-600 text-xs sm:text-sm whitespace-nowrap">
                        {formatearMoneda(ingreso.monto_recibido)}
                      </td>
                      <td className="p-3 sm:p-4 text-right text-red-500 text-xs sm:text-sm whitespace-nowrap">
                        {parseFloat(ingreso.monto_gasto) > 0 ? `-${formatearMoneda(ingreso.monto_gasto)}` : formatearMoneda(0)}
                      </td>
                      <td className="p-3 sm:p-4 text-right font-bold text-green-700 text-sm sm:text-base whitespace-nowrap">
                        {formatearMoneda(ingreso.monto_final)}
                      </td>
                      
                      <td className="p-3 sm:p-4 text-center whitespace-nowrap">
                        <button 
                          onClick={() => handleAbrirGastos(ingreso)}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-50 text-blue-700 rounded-lg text-xs sm:text-sm font-semibold hover:bg-blue-100 transition-colors border border-blue-200 w-full sm:w-auto"
                        >
                          Añadir / Editar Gastos
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL PARA AGREGAR GASTOS */}
      <ModalGastosRuta 
        isOpen={modalGastosAbierto}
        onClose={() => setModalGastosAbierto(false)}
        ingreso={ingresoParaGastos}
        onGuardadoExitoso={cargarMisIngresos}
      />

    </div>
  );
}

export default ReportarEfectivo;