// almacen-oltech-frontend/src/components/almacen/impresion/ReporteSets.jsx
import React, { forwardRef } from 'react';

const ReporteSets = forwardRef(({ categoria, dataReporte }, ref) => {
  const fechaActual = new Date().toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    // Aplicamos p-8 y max-w-5xl para consistencia visual con el de consumibles
    <div className="font-sans text-sm p-8 w-full max-w-5xl mx-auto" ref={ref}>
      
      {/* INYECCIÓN DE MÁRGENES DE IMPRESIÓN */}
      <style type="text/css" media="print">
        {`
          @page { size: portrait; margin: 1.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        `}
      </style>

      {/* --- ENCABEZADO DEL REPORTE --- */}
      <div className="mb-6 border-b-2 border-black pb-4 text-center">
        <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">Inventario - Equipos y Sets</h1>
        <div className="flex justify-between items-end px-2">
          <div className="text-left">
            <p><span className="font-bold">Categoría:</span> {categoria?.nombre || 'General'}</p>
            <p><span className="font-bold">Total Equipos listados:</span> {dataReporte.length}</p>
          </div>
          <div className="text-right">
            <p><span className="font-bold">Fecha de Impresión:</span> {fechaActual}</p>
            <p className="mt-2 text-xs italic text-gray-600">Documento generado desde Almacén OLTECH</p>
          </div>
        </div>
      </div>

      {/* --- TABLA DE INVENTARIO CON DESGLOSE --- */}
      <table className="w-full border-collapse border border-black" style={{ pageBreakInside: 'auto' }}>
        
        <thead className="bg-gray-100" style={{ display: 'table-header-group' }}>
          <tr className="border-b-2 border-black text-black">
            <th className="p-2 border border-black text-left w-32 text-xs uppercase">Código</th>
            <th className="p-2 border border-black text-left text-xs uppercase">Descripción de Pieza / Insumo</th>
            <th className="p-2 border border-black text-center w-24 text-xs uppercase">Unidad</th>
            <th className="p-2 border border-black text-center w-20 text-xs uppercase bg-gray-50">Sist.</th>
            <th className="p-2 border border-black text-center w-32 text-xs uppercase font-extrabold">C. Físico</th>
            <th className="p-2 border border-black text-left w-48 text-xs uppercase">Observaciones</th>
          </tr>
        </thead>
        
        <tbody>
          {dataReporte.map((grupoSet) => (
            <React.Fragment key={`set-${grupoSet.setId}`}>
              
              <tr className="bg-gray-800 text-white border-b-2 border-black" style={{ pageBreakAfter: 'avoid' }}>
                <td colSpan="6" className="p-2 text-left font-bold uppercase tracking-wider text-xs">
                  {grupoSet.setCodigo} | {grupoSet.setDescripcion}
                </td>
              </tr>
              
              {grupoSet.piezas.length === 0 ? (
                <tr className="border-b-2 border-black" style={{ pageBreakInside: 'avoid' }}>
                  <td colSpan="6" className="p-2 border-x border-black text-center text-xs italic text-gray-500 bg-gray-50">
                    (Equipo vacío - No tiene piezas registradas actualmente)
                  </td>
                </tr>
              ) : (
                grupoSet.piezas.map((pieza, index) => {
                  const esUltimo = index === grupoSet.piezas.length - 1;
                  const borderClass = esUltimo ? "border-b-2 border-black" : "border-b border-gray-400";
                  
                  return (
                    <tr key={`pieza-${pieza.composicion_id}`} className={`${borderClass} hover:bg-gray-50`} style={{ pageBreakInside: 'avoid' }}>
                      <td className="p-2 border-x border-black text-left text-xs font-mono font-bold pl-4 text-gray-700">↳ {pieza.pieza_codigo}</td>
                      <td className="p-2 border-x border-black text-left text-xs font-medium">{pieza.pieza_descripcion}</td>
                      <td className="p-2 border-x border-black text-center text-xs">{pieza.unidad_medida || 'PZA'}</td>
                      <td className="p-2 border-x border-black text-center text-xs bg-gray-50 text-gray-500 font-mono">{pieza.cantidad_pieza}</td>
                      
                      {/* Columnas en blanco */}
                      <td className="p-2 border-x border-black text-center h-10"></td>
                      <td className="p-2 border-x border-black text-left h-10"></td>
                    </tr>
                  );
                })
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* --- PIE DE FIRMAS --- */}
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

ReporteSets.displayName = 'ReporteSets';

export default ReporteSets;