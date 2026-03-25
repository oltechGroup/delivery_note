// almacen-oltech-frontend/src/components/almacen/ModalSet.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalSet({ isOpen, onClose, onGuardado, categoriaId }) {
  const { token } = useAuth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Datos principales del Set (El contenedor / Caja)
  const [codigo, setCodigo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  
  // Lista dinámica de piezas que conforman este Set
  const [composicion, setComposicion] = useState([]);

  // Lista de sugerencias para la unidad de medida (Texto Libre)
  const sugerenciasUnidad = ['PIEZA', 'HOLE', 'MM', 'Ф', 'PAR', 'CAJA'];

  useEffect(() => {
    if (isOpen) {
      // Limpiar el formulario al abrir
      setCodigo('');
      setDescripcion('');
      setComposicion([]);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const agregarFilaPieza = () => {
    // Ahora 'unidad_medida' es texto libre, ponemos 'PIEZA' por defecto
    setComposicion([...composicion, { 
      codigo: '', 
      descripcion: '', 
      unidad_medida: 'PIEZA', 
      cantidad_pieza: 1
    }]);
  };

  const actualizarFila = (index, campo, valor) => {
    const nuevaComposicion = [...composicion];
    nuevaComposicion[index][campo] = valor;
    setComposicion(nuevaComposicion);
  };

  const eliminarFila = (index) => {
    setComposicion(composicion.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!codigo.trim() || !descripcion.trim()) {
      setError('El código y la descripción del Set son obligatorios.');
      return;
    }

    const composicionValida = composicion.every(c => 
      c.codigo.trim() && 
      c.descripcion.trim() && 
      c.unidad_medida.trim() && // Validamos que la unidad no esté vacía
      c.cantidad_pieza > 0
    );
    
    if (!composicionValida && composicion.length > 0) {
      setError('Asegúrate de llenar el código, descripción, unidad de medida y cantidad (>0) en todas las piezas del contenido.');
      return;
    }

    setError('');
    setCargando(true);

    try {
      await axios.post('http://localhost:4000/api/almacen/sets', {
        codigo: codigo.toUpperCase(),
        descripcion: descripcion.toUpperCase(),
        categoria_id: categoriaId,
        estado_id: 1,
        composicion: composicion.map(c => ({
          codigo: c.codigo.toUpperCase(),
          descripcion: c.descripcion.toUpperCase(),
          unidad_medida: c.unidad_medida.toUpperCase(), // Se manda como texto puro
          cantidad_pieza: parseInt(c.cantidad_pieza)
        }))
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      onGuardado();
      onClose();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar el equipo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado */}
        <div className="bg-oltech-black px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Registrar Nuevo Equipo</h2>
            <p className="text-oltech-pink text-sm font-medium">Set Maestro / Contenedor</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Sección 1: Datos Generales */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide border-b border-gray-200 pb-2 mb-4">
              1. Identificación del Set (Caja)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Código del Set *</label>
                <input type="text" required autoFocus value={codigo} onChange={(e) => setCodigo(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none uppercase font-mono text-sm bg-white" placeholder="Ej. F16AB-PA00386-1-1" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Set *</label>
                <input type="text" required value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none uppercase bg-white" placeholder="Ej. SET DE INSTRUMENTAL DE CADERA NEOS" />
              </div>
            </div>
          </div>

          {/* Sección 2: Composición Interna */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <div>
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">2. Contenido del Set</h3>
                <p className="text-xs text-gray-500">Registra manualmente las piezas que van dentro de esta caja.</p>
              </div>
              <button type="button" onClick={agregarFilaPieza} className="text-oltech-pink hover:text-pink-700 font-bold text-sm flex items-center space-x-1 bg-pink-50 hover:bg-pink-100 px-4 py-2 rounded-lg transition-colors border border-pink-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                <span>Añadir Pieza al Set</span>
              </button>
            </div>

            {composicion.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-500 text-sm font-medium">No hay piezas agregadas.</p>
                <p className="text-gray-400 text-xs mt-1">Haz clic en "Añadir Pieza al Set" para empezar a registrar el contenido.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {composicion.map((item, index) => (
                  <div key={index} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                    <button type="button" onClick={() => eliminarFila(index)} className="absolute -top-3 -right-3 bg-white border border-gray-200 text-gray-400 hover:text-white hover:bg-red-500 hover:border-red-500 transition-colors p-1.5 rounded-full shadow-sm" title="Quitar pieza">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>

                    <div className="flex items-center space-x-2 mb-3">
                      <span className="bg-oltech-blue text-white text-xs font-bold px-2 py-1 rounded-md">Pieza #{index + 1}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      {/* Fila 1 */}
                      <div className="col-span-1 md:col-span-4">
                        <label className="block text-xs font-bold text-gray-600 mb-1">CÓDIGO (Ref)</label>
                        <input type="text" required value={item.codigo} onChange={(e) => actualizarFila(index, 'codigo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-oltech-blue font-mono text-sm uppercase" placeholder="Ej. F16AB-PA00498" />
                      </div>
                      
                      <div className="col-span-1 md:col-span-8">
                        <label className="block text-xs font-bold text-gray-600 mb-1">DESCRIPCIÓN / NOMBRE DE LA PIEZA</label>
                        <input type="text" required value={item.descripcion} onChange={(e) => actualizarFila(index, 'descripcion', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-oltech-blue text-sm uppercase" placeholder="Ej. PRUEBA DE CABEZA FEMORAL 36 S" />
                      </div>

                      {/* Fila 2 */}
                      <div className="col-span-1 md:col-span-6">
                        <label className="block text-xs font-bold text-gray-600 mb-1">UNIDAD MEDIDA</label>
                        {/* INPUT CON DATALIST (Magia del Texto Libre + Sugerencias) */}
                        <input 
                          type="text" 
                          list={`unidades-sugeridas-${index}`} 
                          required 
                          value={item.unidad_medida} 
                          onChange={(e) => actualizarFila(index, 'unidad_medida', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-oltech-blue text-sm uppercase bg-white" 
                          placeholder="Ej. PIEZA, HOLE, MM" 
                        />
                        <datalist id={`unidades-sugeridas-${index}`}>
                          {sugerenciasUnidad.map(u => (
                            <option key={u} value={u} />
                          ))}
                        </datalist>
                      </div>

                      <div className="col-span-1 md:col-span-6">
                        <label className="block text-xs font-bold text-gray-600 mb-1">CANTIDAD EN EL SET</label>
                        <input type="number" min="1" required value={item.cantidad_pieza} onChange={(e) => actualizarFila(index, 'cantidad_pieza', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-oltech-blue text-sm font-bold text-center" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Pie del Modal */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 shrink-0">
          <button type="button" onClick={onClose} disabled={cargando} className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-200 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} disabled={cargando} className="px-6 py-2 bg-oltech-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 flex items-center space-x-2">
            {cargando && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            )}
            <span>{cargando ? 'Procesando...' : 'Guardar Set y Piezas'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default ModalSet;