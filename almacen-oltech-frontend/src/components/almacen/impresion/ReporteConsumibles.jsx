// almacen-oltech-frontend/src/components/almacen/impresion/ReporteConsumibles.jsx
import { forwardRef } from 'react';

const ReporteConsumibles = forwardRef(({ categoria, consumibles }, ref) => {
  const fechaActual = new Date().toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    // Agregamos p-8 (padding más grande) para dar aire interno,
    // y max-w-5xl mx-auto para que si alguien lo ve en una pantalla gigante, no se estire de más.
    <div className="font-sans text-sm p-8 w-full max-w-5xl mx-auto" ref={ref}>
      
      {/* AQUÍ ESTÁ LA MAGIA DE LOS MÁRGENES DE IMPRESIÓN.
        Inyectamos una etiqueta <style> que solo afecta la impresión.
        Le estamos diciendo a la impresora que deje 1.5 cm por cada lado.
        Esto evita que la tabla salga cortada o pegada al borde del papel.
      */}
      <style type="text/css" media="print">
        {`
          @page { size: portrait; margin: 1.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        `}
      </style>

      {/* --- ENCABEZADO DEL REPORTE --- */}
      <div className="mb-6 border-b-2 border-black pb-4 text-center">
        <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">Registro de existencias - Insumos</h1>
        <div className="flex justify-between items-end px-2">
          <div className="text-left">
            <p><span className="font-bold">Categoría:</span> {categoria?.nombre || 'General'}</p>
            <p><span className="font-bold">Total Artículos:</span> {consumibles.length}</p>
          </div>
          <div className="text-right">
            <p><span className="font-bold">Fecha de Impresión:</span> {fechaActual}</p>
            <p className="mt-2 text-xs italic text-gray-600">Documento generado desde Almacén OLTECH</p>
          </div>
        </div>
      </div>

      {/* --- TABLA PRINCIPAL --- */}
      <table className="w-full border-collapse border border-black" style={{ pageBreakInside: 'auto' }}>
        
        <thead className="bg-gray-100" style={{ display: 'table-header-group' }}>
          <tr className="border-b-2 border-black text-black">
            <th className="p-2 border border-black text-center w-12 text-xs uppercase">No.</th>
            <th className="p-2 border border-black text-left w-32 text-xs uppercase">Código</th>
            <th className="p-2 border border-black text-left text-xs uppercase">Descripción</th>
            <th className="p-2 border border-black text-center w-20 text-xs uppercase">Unidad</th>
            <th className="p-2 border border-black text-center w-24 text-xs uppercase">Caducidad</th>
            <th className="p-2 border border-black text-center w-20 text-xs uppercase bg-gray-50">Sist.</th>
            <th className="p-2 border border-black text-center w-32 text-xs uppercase font-extrabold">C. Físico</th>
            <th className="p-2 border border-black text-left w-48 text-xs uppercase">Observaciones</th>
          </tr>
        </thead>
        
        <tbody>
          {consumibles.map((item, index) => (
            <tr key={item.id} className="border-b border-black hover:bg-gray-50" style={{ pageBreakInside: 'avoid' }}>
              <td className="p-2 border border-black text-center text-xs font-mono">{index + 1}</td>
              <td className="p-2 border border-black text-left text-xs font-bold font-mono">{item.codigo_referencia}</td>
              <td className="p-2 border border-black text-left text-xs font-medium">{item.nombre}</td>
              <td className="p-2 border border-black text-center text-xs">{item.unidad_medida || '-'}</td>
              <td className="p-2 border border-black text-center text-xs">
                {item.fecha_caducidad ? new Date(item.fecha_caducidad).toLocaleDateString() : '-'}
              </td>
              <td className="p-2 border border-black text-center text-xs bg-gray-50 text-gray-500 font-mono">{item.cantidad}</td>
              
              {/* Columnas en blanco para el conteo manual */}
              {/* Ajusté un poquito la altura h-10 para que quepan más filas por hoja */}
              <td className="p-2 border border-black text-center h-10"></td>
              <td className="p-2 border border-black text-left h-10"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- PIE DE FIRMAS AL FINAL DEL DOCUMENTO --- */}
      <div className="mt-16 flex justify-around items-center pt-8 border-t border-gray-300" style={{ pageBreakInside: 'avoid' }}>
        <div className="text-center w-64">
          <div className="border-b border-black w-full h-8 mb-2"></div>
          <p className="font-bold text-sm">Realizado por (Nombre y Firma)</p>
        </div>
        <div className="text-center w-64">
          <div className="border-b border-black w-full h-8 mb-2"></div>
          <p className="font-bold text-sm">Validado por (Jefe de Almacén)</p>
        </div>
      </div>
      
    </div>
  );
});

ReporteConsumibles.displayName = 'ReporteConsumibles';

export default ReporteConsumibles;