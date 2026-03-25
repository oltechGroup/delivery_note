// almacen-oltech-frontend/src/pages/Remisiones.jsx
import { useState } from 'react';
// almacen-oltech-frontend/src/pages/Remisiones.jsx
import VistaRemisiones from '../components/remisiones/VistaRemisiones';

function Remisiones() {
  return (
    <div className="p-4 md:p-8">
      {/* Ya no necesitamos el encabezado aquí porque VistaRemisiones lo trae integrado */}
      <VistaRemisiones />
    </div>
  );
}

export default Remisiones;