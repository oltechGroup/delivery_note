//almacen-oltech-frontend/src/components/almacen/VistaCategorias.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import Buscador from './Buscador';
import ModalCategoria from './ModalCategoria';

function VistaCategorias({ onSelectCategoria }) {
  const { token } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false); 

  // Extraemos la lógica de carga para poder llamarla cuando guardemos una categoría nueva
  const cargarCategorias = async () => {
    try {
      const respuesta = await axios.get('http://localhost:4000/api/almacen/categorias', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategorias(respuesta.data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, [token]);

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const respuesta = await axios.get('http://localhost:4000/api/almacen/categorias', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategorias(respuesta.data);
      } catch (err) {
        console.error('Error al cargar categorías:', err);
      } finally {
        setCargando(false);
      }
    };
    cargarCategorias();
  }, [token]);

  // Filtramos las tarjetas en tiempo real según lo que escribas en el buscador
  const categoriasFiltradas = categorias.filter(cat => 
    cat.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Encabezado y Buscador Global */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Almacén Principal</h1>
          <p className="text-gray-500 text-sm mt-1">Selecciona una categoría para ver o editar su inventario.</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Buscador 
            valor={busqueda} 
            onBuscar={setBusqueda} 
            placeholder="Buscar almacén/categoría..." 
          />
          <button 
            onClick={() => setModalAbierto(true)}
            className="bg-oltech-black text-white p-2.5 rounded-lg hover:bg-gray-800 transition-colors shadow-md"
            title="Nueva Categoría"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          </button>
        </div>
      </div>

      {/* Cuadrícula de Tarjetas (Cards) */}
      {cargando ? (
        <div className="text-center py-10 text-gray-500">Cargando almacenes...</div>
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
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-oltech-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Cat #{cat.id}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 group-hover:text-oltech-black mb-1">{cat.nombre}</h3>
              <p className="text-sm font-medium text-gray-500">
                <span className="text-oltech-blue">{cat.total_sets || 0}</span> Sets registrados
              </p>
            </div>
          ))}
          {categoriasFiltradas.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500">
              No se encontraron categorías con ese nombre.
            </div>
          )}
        </div>
      )}
        {/* Modal para Crear Categoría */}
      <ModalCategoria 
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onGuardado={cargarCategorias}
      />
    </div>
  );
}

export default VistaCategorias;