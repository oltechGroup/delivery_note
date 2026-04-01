// almacen-oltech-frontend/src/components/almacen/VistaCategoriasConsumibles.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import Buscador from './Buscador';
import ModalCategoriaConsumible from './ModalCategoriaConsumible'; // Lo crearemos en el siguiente paso

function VistaCategoriasConsumibles({ onSelectCategoria }) {
  const { token } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false); 

  // Función para cargar las categorías de consumibles desde el backend
  const cargarCategorias = async () => {
    setCargando(true);
    try {
      const respuesta = await axios.get('http://localhost:4000/api/almacen/categorias-consumibles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategorias(respuesta.data);
    } catch (err) {
      console.error('Error al cargar categorías de consumibles:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, [token]);

  // Filtramos las tarjetas en tiempo real según lo que escribas en el buscador
  const categoriasFiltradas = categorias.filter(cat => 
    cat.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Encabezado y Buscador Global */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <span>⚙️</span>
            <span>Clasificación de Insumos</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Selecciona una categoría para ver o gestionar sus consumibles.</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Buscador 
            valor={busqueda} 
            onBuscar={setBusqueda} 
            placeholder="Buscar categoría de insumo..." 
          />
          <button 
            onClick={() => setModalAbierto(true)}
            className="bg-oltech-black text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors shadow-md flex items-center space-x-2 whitespace-nowrap"
            title="Nueva Categoría de Insumo"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* Cuadrícula de Tarjetas (Cards) */}
      {cargando ? (
        <div className="text-center py-10 text-gray-500 flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-oltech-pink mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando categorías...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categoriasFiltradas.map((cat) => (
            <div 
              key={cat.id} 
              onClick={() => onSelectCategoria(cat)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-oltech-pink hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-pink-50 transition-colors">
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-oltech-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Cat #{cat.id}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 group-hover:text-oltech-black mb-1">{cat.nombre}</h3>
              <p className="text-sm font-medium text-gray-500">
                <span className="text-oltech-blue font-bold">{cat.total_consumibles || 0}</span> Insumos distintos
              </p>
            </div>
          ))}
          {categoriasFiltradas.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
              No se encontraron categorías de insumos con ese nombre.
            </div>
          )}
        </div>
      )}
      
      {/* Modal para Crear Categoría de Consumible */}
      <ModalCategoriaConsumible 
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardado={cargarCategorias}
      />
    </div>
  );
}

export default VistaCategoriasConsumibles;