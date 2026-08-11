// almacen-oltech-frontend/src/pages/InventarioCiudad.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import Buscador from '../components/almacen/Buscador';

function InventarioCiudad() {
  const { token, usuario } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para los datos locales
  const [consumibles, setConsumibles] = useState([]);
  const [sets, setSets] = useState([]);
  
  // UI States
  const [tabActiva, setTabActiva] = useState('consumibles');
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const ITEMS_POR_PAGINA = 15;

  // Extraemos el nombre de la sede para la UI (si tiene asignada alguna)
  // En un caso real, un técnico operativo de hospital normalmente tiene 1 sola sede asignada.
  const sedeUsuario = usuario?.sedes && usuario.sedes.length > 0 
    ? usuario.sedes[0] 
    : null;

  useEffect(() => {
    const cargarInventarioLocal = async () => {
      setCargando(true);
      setError('');
      try {
        // Hacemos la petición al endpoint de licitaciones (que crearemos en el backend a continuación)
        const respuesta = await axios.get('http://localhost:4000/api/licitaciones/inventario', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setConsumibles(respuesta.data.consumibles || []);
        setSets(respuesta.data.sets || []);
      } catch (err) {
        console.error('Error al cargar inventario local:', err);
        setError('No se pudo cargar el inventario de tu unidad médica.');
      } finally {
        setCargando(false);
      }
    };

    cargarInventarioLocal();
  }, [token]);

  // Reiniciar paginación al buscar o cambiar de tab
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, tabActiva]);

  // ==========================================
  // LÓGICA DE FILTRADO Y PAGINACIÓN
  // ==========================================
  const datosActivos = tabActiva === 'consumibles' ? consumibles : sets;

  const datosFiltrados = datosActivos.filter(item => {
    const texto = tabActiva === 'consumibles' 
      ? `${item.codigo_referencia} ${item.nombre} ${item.lote || ''}` 
      : `${item.codigo} ${item.descripcion}`;
    return texto.toLowerCase().includes(busqueda.toLowerCase());
  });

  const totalPaginas = Math.ceil(datosFiltrados.length / ITEMS_POR_PAGINA);
  const indiceInicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
  const datosPaginados = datosFiltrados.slice(indiceInicio, indiceInicio + ITEMS_POR_PAGINA);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <span>🏥</span>
            <span>Inventario Local</span>
          </h2>
          <p className="text-xs sm:text-sm font-medium mt-1 text-oltech-blue bg-blue-50 inline-block px-2 py-0.5 rounded border border-blue-100">
            Sede: {sedeUsuario ? `Hospital ID: ${sedeUsuario.unidad_medica_id} | Ciudad ID: ${sedeUsuario.ciudad_id}` : 'Múltiples Sedes / Nacional'}
          </p>
        </div>

        <div className="w-full lg:w-96">
          <Buscador 
            valor={busqueda} 
            onBuscar={setBusqueda} 
            placeholder="Buscar por código, nombre o lote..." 
          />
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <button
          onClick={() => setTabActiva('consumibles')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
            tabActiva === 'consumibles' 
              ? 'bg-oltech-black text-white shadow-md' 
              : 'bg-transparent text-gray-500 hover:bg-gray-50'
          }`}
        >
          💉 Insumos a Granel ({consumibles.length})
        </button>
        <button
          onClick={() => setTabActiva('sets')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
            tabActiva === 'sets' 
              ? 'bg-oltech-black text-white shadow-md' 
              : 'bg-transparent text-gray-500 hover:bg-gray-50'
          }`}
        >
          📦 Equipos / Sets Quirúrgicos ({sets.length})
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 font-medium">
          {error}
        </div>
      )}

      {/* CONTENEDOR DE LA TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col min-h-[400px]">
        {cargando ? (
          <div className="flex-1 p-10 flex flex-col items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-oltech-pink mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-gray-500 text-sm font-medium">Cargando inventario de la sede...</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold whitespace-nowrap">
                  <th className="p-4 w-48">Código Ref.</th>
                  <th className="p-4">Descripción</th>
                  {tabActiva === 'consumibles' && <th className="p-4 w-32 text-center">Lote</th>}
                  {tabActiva === 'consumibles' && <th className="p-4 w-32 text-center">Caducidad</th>}
                  {tabActiva === 'sets' && <th className="p-4 w-32 text-center">Estado</th>}
                  <th className="p-4 w-32 text-center">Stock Físico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {datosPaginados.length > 0 ? (
                  datosPaginados.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-bold text-oltech-blue font-mono">
                          {tabActiva === 'consumibles' ? item.codigo_referencia : item.codigo}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-gray-800">
                        {tabActiva === 'consumibles' ? item.nombre : item.descripcion}
                      </td>
                      
                      {/* Columnas exclusivas de Consumibles */}
                      {tabActiva === 'consumibles' && (
                        <>
                          <td className="p-4 text-center whitespace-nowrap font-mono text-xs text-gray-600">
                            {item.lote || '-'}
                          </td>
                          <td className="p-4 text-center whitespace-nowrap text-xs font-bold text-gray-600">
                            {item.fecha_caducidad || '-'}
                          </td>
                        </>
                      )}

                      {/* Columna exclusiva de Sets */}
                      {tabActiva === 'sets' && (
                        <td className="p-4 text-center whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            item.estado_nombre?.toLowerCase() === 'activo' || item.estado_nombre?.toLowerCase() === 'disponible'
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {item.estado_nombre || 'Desconocido'}
                          </span>
                        </td>
                      )}

                      {/* Stock General */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full font-bold text-sm border ${
                          item.cantidad > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {item.cantidad}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-gray-500">
                      No se encontraron registros en tu inventario local.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINACIÓN */}
        {!cargando && totalPaginas > 1 && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between shrink-0">
            <span className="text-xs sm:text-sm text-gray-500 font-medium">
              Página <span className="font-bold text-gray-800">{paginaActual}</span> de {totalPaginas}
            </span>
            <div className="flex space-x-2">
              <button 
                onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                disabled={paginaActual === 1}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 shadow-sm"
              >
                Anterior
              </button>
              <button 
                onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 shadow-sm"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default InventarioCiudad;