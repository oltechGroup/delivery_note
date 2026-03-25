// almacen-oltech-frontend/src/components/almacen/ModalDetalleSet.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import ModalSurtirPieza from './ModalSurtirPieza';

function ModalDetalleSet({ isOpen, onClose, setMaestro }) {
  const { token } = useAuth();
  const [composicion, setComposicion] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // NUEVO ESTADO: Controla qué pieza se va a surtir
  const [piezaParaSurtir, setPiezaParaSurtir] = useState(null);

  // Cargar el contenido de la caja (Set)
  const cargarComposicion = async () => {
    setCargando(true);
    setError('');
    try {
      const respuesta = await axios.get(`http://localhost:4000/api/almacen/sets/${setMaestro.id}/composicion`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComposicion(respuesta.data);
    } catch (err) {
      console.error('Error al cargar la composición:', err);
      setError('No se pudo cargar el contenido de este equipo.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (isOpen && setMaestro) {
      cargarComposicion();
    }
  }, [isOpen, setMaestro, token]);

  if (!isOpen || !setMaestro) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado */}
        <div className="bg-oltech-black px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <svg className="w-6 h-6 text-oltech-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
              <span>Contenido del Equipo</span>
            </h2>
            <p className="text-gray-400 text-sm font-medium mt-1">
              <span className="text-oltech-pink">{setMaestro.codigo}</span> - {setMaestro.descripcion}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 p-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Cuerpo (Tabla de Composición) */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 font-medium mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-200 text-gray-700 text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold w-12 text-center">#</th>
                  <th className="py-3 px-4 font-bold border-r border-gray-200 w-48">Código de Pieza</th>
                  <th className="py-3 px-4 font-bold border-r border-gray-200">Descripción</th>
                  <th className="py-3 px-4 font-bold border-r border-gray-200 text-center w-24">Unidad</th>
                  <th className="py-3 px-4 font-bold border-r border-gray-200 text-center w-32">Cant. Actual</th>
                  <th className="py-3 px-4 font-bold text-center w-32 text-oltech-pink">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-800">
                {cargando ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      <svg className="animate-spin h-6 w-6 mx-auto text-oltech-pink mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Abriendo caja...
                    </td>
                  </tr>
                ) : composicion.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500 bg-gray-50/50">
                      Esta caja no tiene piezas registradas en su interior.
                    </td>
                  </tr>
                ) : (
                  composicion.map((item, index) => (
                    <tr key={item.composicion_id} className="border-b border-gray-200 hover:bg-blue-50/50 transition-colors">
                      <td className="py-3 px-4 border-r border-gray-200 text-center text-gray-400 font-bold">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 border-r border-gray-200">
                        <span className="font-mono font-bold text-oltech-blue tracking-tight">
                          {item.pieza_codigo}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-r border-gray-200 font-medium text-gray-700">
                        {item.pieza_descripcion}
                      </td>
                      <td className="py-3 px-4 border-r border-gray-200 text-center text-xs font-bold text-gray-500">
                        {item.unidad_medida || 'PZA'}
                      </td>
                      <td className="py-3 px-4 border-r border-gray-200 text-center">
                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded font-bold border border-gray-200">
                          {item.cantidad_pieza}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {/* BOTÓN MAESTRO DE SURTIR CONECTADO */}
                        <button 
                          onClick={() => setPiezaParaSurtir(item)} 
                          className="bg-oltech-pink text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-pink-700 transition-colors shadow-sm flex items-center justify-center space-x-1 mx-auto"
                          title="Surtir desde Inventario a Granel"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>
                          <span>Surtir</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL PARA SURTIR */}
        <ModalSurtirPieza 
          isOpen={!!piezaParaSurtir}
          onClose={() => setPiezaParaSurtir(null)}
          onGuardado={cargarComposicion} // Recarga la tabla de contenido al terminar
          piezaSet={piezaParaSurtir}
        />

      </div>
    </div>
  );
}

export default ModalDetalleSet;