// almacen-oltech-frontend/src/pages/Remisiones.jsx
import { useState } from 'react';
import VistaRemisiones from '../components/remisiones/VistaRemisiones';

function Remisiones() {
  return (
    // RESPONSIVO: p-2 para móviles pequeños, sm:p-4 para móviles grandes/tablets, md:p-8 intacto para PC
    <div className="p-2 sm:p-4 md:p-8">
      {/* Ya no necesitamos el encabezado aquí porque VistaRemisiones lo trae integrado */}
      <VistaRemisiones />
    </div>
  );
}

export default Remisiones;