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
  const fileInputRef = useRef(null); // Ref para el input de archivo oculto

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
      cargarHojas();
    } catch (err) {
      setError('Error al autorizar.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Hidden input para subir archivo */}
      <input type="file" ref={fileInputRef} onChange={(e) => handleSubirFirma(e, hojaSeleccionadaId)} className="hidden" accept="image/*,.pdf" />

      {/* BARRA SUPERIOR */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Hojas de Consumo</h2>
        </div>
        <button onClick={() => navigate('/hojas-consumo/nueva')} className="bg-oltech-pink text-white px-5 py-2.5 rounded-lg font-bold hover:bg-pink-700">
          Nueva Hoja
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                    <th className="p-4">Folio</th>
                    <th className="p-4">Paciente</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-center">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {hojas.map(hoja => (
                    <tr key={hoja.id} className="border-t">
                        <td className="p-4 font-bold">{hoja.folio}</td>
                        <td className="p-4">{hoja.paciente}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${hoja.estado === 'Finalizada' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{hoja.estado}</span></td>
                        <td className="p-4 text-center flex justify-center gap-2">
                            <button onClick={() => setModalPdfAbierto(true) || setHojaIdSeleccionada(hoja.id)} className="bg-gray-100 px-3 py-1 rounded text-xs font-bold">PDF</button>
                            
                            {/* BOTÓN SUBIR FIRMA (Solo para técnicos si está pendiente) */}
                            {hoja.estado === 'Pendiente Autorización' && (
                                <button 
                                    onClick={() => { setHojaSeleccionadaId(hoja.id); fileInputRef.current.click(); }}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold"
                                >
                                    Subir Firma
                                </button>
                            )}

                            {puedeAutorizar && hoja.estado === 'Pendiente Autorización' && (
                                <button onClick={() => setModalAutorizar({ abierto: true, hoja })} className="bg-black text-white px-3 py-1 rounded text-xs font-bold">Validar</button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {modalAutorizar.abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-white p-6 rounded-xl w-full max-w-sm">
                <h3 className="font-bold mb-4">Validar Hoja</h3>
                <select value={estadoCierre} onChange={e => setEstadoCierre(e.target.value)} className="w-full p-2 border mb-4">
                    <option value="Finalizada">Aprobada</option>
                    <option value="Rechazada">Rechazada</option>
                </select>
                <textarea className="w-full border p-2 mb-4" placeholder="Observaciones..." onChange={e => setObservacionesCierre(e.target.value)} />
                <button onClick={handleAutorizar} className="w-full bg-black text-white py-2 rounded">Confirmar</button>
            </div>
        </div>
      )}

      {modalPdfAbierto && (
        <PDFHojaConsumo hojaId={hojaIdSeleccionada} onClose={() => setModalPdfAbierto(false)} />
      )}
    </div>
  );
}

export default HojasConsumo;