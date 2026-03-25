// src/pages/Almacen.jsx
import { useState } from 'react';
import VistaCategorias from '../components/almacen/VistaCategorias';
import VistaInventario from '../components/almacen/VistaInventario';
import VistaConsumibles from '../components/almacen/VistaConsumibles';

function Almacen() {
  // Pestaña principal: 'sets' o 'consumibles'
  const [seccionActiva, setSeccionActiva] = useState('sets');
  
  // Sub-navegación dentro de la sección de sets
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Navegación Principal (Pestañas Superiores Estilo Switch) */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <button
          onClick={() => setSeccionActiva('sets')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
            seccionActiva === 'sets' 
              ? 'bg-oltech-black text-white shadow-md' 
              : 'bg-transparent text-gray-500 hover:bg-gray-50'
          }`}
        >
          📦 Equipos y Sets (Por Categoría)
        </button>
        <button
          onClick={() => setSeccionActiva('consumibles')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${
            seccionActiva === 'consumibles' 
              ? 'bg-oltech-black text-white shadow-md' 
              : 'bg-transparent text-gray-500 hover:bg-gray-50'
          }`}
        >
          ⚙️ Inventario de Insumos (Consumibles)
        </button>
      </div>

      {/* Contenido Dinámico dependiendo de la pestaña */}
      {seccionActiva === 'sets' ? (
        // MUNDO 1: LOS SETS Y CATEGORÍAS (Lo que ya construimos)
        !categoriaSeleccionada ? (
          <VistaCategorias onSelectCategoria={setCategoriaSeleccionada} />
        ) : (
          <VistaInventario 
            categoria={categoriaSeleccionada} 
            onVolver={() => setCategoriaSeleccionada(null)} 
          />
        )
      ) : (
        // MUNDO 2: EL INVENTARIO DE INSUMOS A GRANEL (En construcción...)
        <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-100 text-center animate-in zoom-in duration-300">
    {/* Contenido Dinámico dependiendo de la pestaña */}
      {seccionActiva === 'sets' ? (
        !categoriaSeleccionada ? (
          <VistaCategorias onSelectCategoria={setCategoriaSeleccionada} />
        ) : (
          <VistaInventario 
            categoria={categoriaSeleccionada} 
            onVolver={() => setCategoriaSeleccionada(null)} 
          />
        )
      ) : (
        // MUNDO 2: EL INVENTARIO DE INSUMOS A GRANEL
        <VistaConsumibles /> // <--- REEMPLAZA EL LETRERO TEMPORAL CON ESTO
      )}    
        </div>
      )}

    </div>
  );
}

export default Almacen;