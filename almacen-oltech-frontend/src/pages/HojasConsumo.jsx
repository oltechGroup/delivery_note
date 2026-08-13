// almacen-oltech-frontend/src/pages/HojasConsumo.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import Buscador from '../components/almacen/Buscador';
import PDFHojaConsumo from '../components/licitaciones/PDFHojaConsumo'; 

function HojasConsumo() {
  const { token, usuario } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null); 

  const [hojas, setHojas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [hojaSeleccionadaId, setHojaSeleccionadaId] = useState(null);

  // Estados para el Modal de Autorización
  const [modalAutorizar, setModalAutorizar] = useState({ abierto: false, hoja: null });
  const [estadoCierre, setEstadoCierre] = useState('Finalizada');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [procesando, setProcesando] = useState(false);

  // Estado para el visualizador PDF
  const [modalPdfAbierto, setModalPdfAbierto] = useState(false);
  const [hojaIdSeleccionada, setHojaIdSeleccionada] = useState(null);

  // Permisos
  const roles = Array.isArray(usuario?.roles) ? usuario.roles : [usuario?.rol].filter(Boolean);
  const puedeCrear = roles.some(r => ['Sistemas', 'Biomédicos', 'Técnico'].includes(r));
  const puedeAutorizar = roles.some(r => ['Sistemas', 'Operaciones', 'Encargado de almacén', 'Coordinador'].includes(r));

  const cargarHojas = async () => {
    setCargando(true);
    try {
      const respuesta = await axios.get('http://localhost:4000/api/licitaciones/hojas-consumo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHojas(respuesta.data);
    } catch (err) {
      setError('No se pudieron cargar las hojas de consumo.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarHojas(); }, [token]);

  // FUNCIÓN PARA SUBIR EL ARCHIVO FIRMADO
  const handleSubirFirma = async (e, hojaId) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('archivo', file);

    try {
      await axios.post(`http://localhost:4000/api/licitaciones/hojas-consumo/${hojaId}/subir-firma`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      alert('¡Firma subida correctamente!');
      cargarHojas();
    } catch (err) {
      alert('Error al subir el archivo.');
    }
  };

  const handleAutorizar = async (e) => {
    e.preventDefault();
    setProcesando(true);
    try {
      await axios.patch(`http://localhost:4000/api/licitaciones/hojas-consumo/${modalAutorizar.hoja.id}/autorizar`, {
        estado: estadoCierre,
        observaciones_cierre: observacionesCierre
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setModalAutorizar({ abierto: false, hoja: null });
      setObservacionesCierre('');
      cargarHojas();
    } catch (err) {
      setError('Error al autorizar.');
    } finally {
      setProcesando(false);
    }
  };

  // Construir la URL del archivo para el visor (Si existe)
  const urlArchivoFirmado = modalAutorizar.hoja?.archivo_firmado 
    ? `https://oltechgroup.com/uploads/firmas/${modalAutorizar.hoja.archivo_firmado}` 
    : null;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Hidden input para subir archivo */}
      <input type="file" ref={fileInputRef} onChange={(e) => handleSubirFirma(e, hojaSeleccionadaId)} className="hidden" accept="image/*,.pdf" />

      {/* BARRA SUPERIOR */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Hojas de Consumo</h2>
        </div>
        {puedeCrear && (
          <button onClick={() => navigate('/hojas-consumo/nueva')} className="bg-oltech-pink text-white px-5 py-2.5 rounded-lg font-bold hover:bg-pink-700 shadow-md">
            Nueva Hoja
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                    <th className="p-4 border-b">Folio</th>
                    <th className="p-4 border-b">Paciente</th>
                    <th className="p-4 border-b">Estado</th>
                    <th className="p-4 border-b text-center">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {hojas.map(hoja => (
                    <tr key={hoja.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-bold text-gray-800">{hoja.folio}</td>
                        <td className="p-4 text-gray-700">{hoja.paciente}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider border shadow-sm ${hoja.estado === 'Finalizada' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {hoja.estado}
                          </span>
                        </td>
                        <td className="p-4 text-center flex flex-wrap justify-center gap-2">
                            <button onClick={() => { setHojaIdSeleccionada(hoja.id); setModalPdfAbierto(true); }} className="bg-gray-100 text-gray-600 hover:text-oltech-blue hover:bg-blue-100 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">
                              Ver PDF
                            </button>
                            
                            {/* BOTÓN SUBIR FIRMA (Solo si está pendiente) */}
                            {hoja.estado === 'Pendiente Autorización' && puedeCrear && (
                                <button 
                                    onClick={() => { setHojaSeleccionadaId(hoja.id); fileInputRef.current.click(); }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors"
                                >
                                    Subir Firma
                                </button>
                            )}

                            {/* BOTÓN VALIDAR (Exclusivo para Coordinadores/Admin) */}
                            {puedeAutorizar && hoja.estado === 'Pendiente Autorización' && (
                                <button onClick={() => setModalAutorizar({ abierto: true, hoja })} className="bg-oltech-black text-white hover:bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors border border-gray-900">
                                  Validar
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
                {hojas.length === 0 && !cargando && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-500">No hay hojas de consumo registradas.</td>
                  </tr>
                )}
            </tbody>
        </table>
      </div>

      {/* MODAL DE VALIDACIÓN Y VISOR PARA EL COORDINADOR */}
      {modalAutorizar.abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                
                {/* Encabezado del Modal */}
                <div className="bg-oltech-black px-6 py-4 flex justify-between items-center shrink-0">
                  <h3 className="font-bold text-white text-lg">Validar Hoja: {modalAutorizar.hoja?.folio}</h3>
                  <button onClick={() => setModalAutorizar({ abierto: false, hoja: null })} className="text-gray-400 hover:text-white transition-colors">✖</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 bg-gray-50">
                  
                  {/* Visor del Documento Subido */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center">
                    <p className="text-sm font-bold text-gray-700 w-full mb-3 uppercase tracking-wide">Evidencia Adjunta:</p>
                    
                    {urlArchivoFirmado ? (
                      <div className="w-full flex flex-col items-center">
                        {urlArchivoFirmado.toLowerCase().endsWith('.pdf') ? (
                          <iframe src={urlArchivoFirmado} className="w-full h-64 border border-gray-300 rounded bg-gray-100" title="Documento Firmado" />
                        ) : (
                          <img src={urlArchivoFirmado} alt="Documento Firmado" className="max-w-full max-h-64 object-contain border border-gray-300 rounded bg-gray-100" />
                        )}
                        <a href={urlArchivoFirmado} target="_blank" rel="noopener noreferrer" className="mt-3 text-oltech-blue text-sm font-bold hover:underline">
                          Abrir documento en ventana completa
                        </a>
                      </div>
                    ) : (
                      <div className="w-full text-center p-4 bg-yellow-50 text-yellow-700 rounded border border-yellow-200 text-sm font-medium">
                         ⚠️ El técnico aún no ha subido el documento firmado.
                      </div>
                    )}
                  </div>

                  {/* Formrolesulario de Aprobación */}
                  <form onSubmit={handleAutorizar} className="space-y-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Resolución de Auditoría *</label>
                        <select value={estadoCierre} onChange={e => setEstadoCierre(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white font-bold outline-none focus:ring-2 focus:ring-oltech-black">
                            <option value="Finalizada">✅ Aprobar y Finalizar</option>
                            <option value="Rechazada">❌ Rechazar (Devolver al técnico)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Observaciones de la Revisión</label>
                        <textarea 
                          className="w-full border border-gray-300 p-3 rounded-lg text-sm outline-none focus:ring-2 focus:ring-oltech-black resize-none" 
                          rows="3"
                          placeholder={estadoCierre === 'Rechazada' ? "Escribe el motivo del rechazo obligatoriamente..." : "Observaciones opcionales..."} 
                          onChange={e => setObservacionesCierre(e.target.value)} 
                          required={estadoCierre === 'Rechazada'}
                          value={observacionesCierre}
                        />
                      </div>
                      
                      <div className="flex justify-end pt-2">
                        <button type="submit" disabled={procesando} className={`px-6 py-2.5 text-white rounded-lg font-bold shadow-md transition-colors flex items-center space-x-2 ${estadoCierre === 'Rechazada' ? 'bg-red-600 hover:bg-red-700' : 'bg-oltech-black hover:bg-gray-800'}`}>
                          {procesando ? 'Procesando...' : 'Confirmar Resolución'}
                        </button>
                      </div>
                  </form>

                </div>
            </div>
        </div>
      )}

      {modalPdfAbierto && (
        <PDFHojaConsumo hojaId={hojaIdSeleccionada} onClose={() => { setModalPdfAbierto(false); setHojaIdSeleccionada(null); }} />
      )}
    </div>
  );
}

export default HojasConsumo;