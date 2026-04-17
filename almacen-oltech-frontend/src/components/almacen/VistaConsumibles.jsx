// almacen-oltech-frontend/src/components/almacen/VistaConsumibles.jsx
import { useState } from 'react';
import VistaCategoriasConsumibles from './VistaCategoriasConsumibles';
import VistaInventarioConsumibles from './VistaInventarioConsumibles';

function VistaConsumibles() {
  // Estado para saber qué categoría hemos seleccionado.
  // Si es null, mostramos la cuadrícula de tarjetas.
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  return (
    // RESPONSIVO: Se agrega w-full para garantizar que el contenedor siempre ocupe el 100% en cualquier dispositivo.
    // Los paddings y márgenes reales para móvil ya se gestionan dentro de los componentes hijos.
    <div className="w-full animate-in fade-in duration-300">
      {/* Si no hay categoría seleccionada, mostramos las tarjetas */}
      {!categoriaSeleccionada ? (
        <VistaCategoriasConsumibles onSelectCategoria={setCategoriaSeleccionada} />
      ) : (
        /* Si hay una categoría, mostramos su inventario específico */
        <VistaInventarioConsumibles 
          categoria={categoriaSeleccionada} 
          onVolver={() => setCategoriaSeleccionada(null)} 
        />
      )}
    </div>
  );
}

export default VistaConsumibles;