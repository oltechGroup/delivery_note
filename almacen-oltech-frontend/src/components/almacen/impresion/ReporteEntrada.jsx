// almacen-oltech-frontend/src/components/almacen/impresion/ReporteEntrada.jsx
import React, { forwardRef } from 'react';

const ReporteEntrada = forwardRef(({ entrada, detalles }, ref) => {
  // Formateamos la fecha de entrada de forma elegante
  const fechaEntrada = entrada?.fecha_entrada 
    ? new Date(entrada.fecha_entrada).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }).toUpperCase()
    : '--';

  const fechaImpresion = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="font-sans text-sm p-8 w-full max-w-5xl mx-auto" ref={ref}>
      
      {/* CONFIGURACIÓN DE MÁRGENES NATIVOS */}
      <style type="text/css" media="print">
        {`
          @page { size: portrait; margin: 1.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        `}
      </style>

      {/* --- ENCABEZADO DEL TICKET --- */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
        <div className="text-left">
          <h1 className="text-2xl font-black uppercase tracking-tighter text-oltech-blue">Almacén OLTECH</h1>
          <p className="text-xs font-bold text-gray-600 mt-1">COMPROBANTE DE INGRESO DE MATERIAL</p>
        </div>
        <div className="text-right">
          <div className="bg-black text-white px-4 py-2 rounded text-lg font-black tracking-widest">
            {entrada?.folio || 'S/F'}
          </div>
          <p className="text-[10px] text-gray-500 mt-2 italic">ID de Registro: #{entrada?.id}</p>
        </div>
      </div>

      {/* --- INFORMACIÓN DE AUDITORÍA --- */}
      <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Fecha de Recepción</p>
          <p className="font-bold text-gray-800">{fechaEntrada}</p>
          
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-4">Usuario Responsable</p>
          <p className="font-bold text-gray-800 uppercase">{entrada?.usuario_nombre || 'SISTEMA'}</p>
        </div>
        <div className="space-y-2 border-l border-gray-300 pl-6">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Observaciones registradas</p>
          <p className="text-sm text-gray-700 italic leading-relaxed">
            {entrada?.observaciones ? `"${entrada.observaciones}"` : "SIN OBSERVACIONES ADICIONALES."}
          </p>
          <div className="pt-4 mt-2 border-t border-gray-200">
            <p className="text-[10px] text-gray-400 uppercase font-bold">Total de artículos recibidos:</p>
            <p className="text-lg font-black text-green-700">{entrada?.total_articulos} PZAS</p>
          </div>
        </div>
      </div>

      {/* --- TABLA DE MATERIALES RECIBIDOS --- */}
      <table className="w-full border-collapse border border-black" style={{ pageBreakInside: 'auto' }}>
        <thead className="bg-gray-100" style={{ display: 'table-header-group' }}>
          <tr className="border-b-2 border-black text-black">
            <th className="p-2 border border-black text-center w-12 text-[10px] uppercase font-black">#</th>
            <th className="p-2 border border-black text-left w-32 text-[10px] uppercase font-black">Código Ref.</th>
            <th className="p-2 border border-black text-left text-[10px] uppercase font-black">Descripción del Insumo</th>
            <th className="p-2 border border-black text-center w-20 text-[10px] uppercase font-black">Unidad</th>
            <th className="p-2 border border-black text-center w-24 text-[10px] uppercase font-black">Lote</th>
            <th className="p-2 border border-black text-center w-24 text-[10px] uppercase font-black">Caducidad</th>
            <th className="p-2 border border-black text-center w-24 text-[11px] uppercase font-black bg-green-50">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {detalles.map((item, index) => (
            <tr key={item.detalle_id} className="border-b border-black hover:bg-gray-50" style={{ pageBreakInside: 'avoid' }}>
              <td className="p-2 border border-black text-center text-xs font-mono text-gray-400">{index + 1}</td>
              <td className="p-2 border border-black text-left text-xs font-bold font-mono text-oltech-blue">{item.codigo_referencia}</td>
              <td className="p-2 border border-black text-left text-xs font-medium uppercase">{item.consumible_nombre}</td>
              <td className="p-2 border border-black text-center text-xs">{item.unidad_medida}</td>
              <td className="p-2 border border-black text-center text-xs font-mono">{item.lote_ingresado || '-'}</td>
              <td className="p-2 border border-black text-center text-xs">
                {item.fecha_caducidad_ingresada ? new Date(item.fecha_caducidad_ingresada).toLocaleDateString('es-MX') : '-'}
              </td>
              <td className="p-2 border border-black text-center text-sm font-black bg-green-50/30 text-green-800">
                {item.cantidad_ingresada}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- SECCIÓN DE FIRMAS --- */}
      <div className="mt-20 flex justify-between items-center" style={{ pageBreakInside: 'avoid' }}>
        <div className="text-center w-72">
          <div className="border-b border-black w-full h-10 mb-2"></div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Firma de Entrega (Transporte/Mensajería)</p>
        </div>
        <div className="text-center w-72">
          <div className="border-b border-black w-full h-10 mb-2"></div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Firma de Recepción (Almacén Oltech)</p>
          <p className="text-xs font-black mt-1 uppercase">{entrada?.usuario_nombre}</p>
        </div>
      </div>

      {/* --- FOOTER DEL DOCUMENTO --- */}
      <div className="mt-16 pt-4 border-t border-gray-100 text-center">
        <p className="text-[9px] text-gray-400 uppercase tracking-widest">
          Este documento es un comprobante interno generado el {fechaImpresion} • Almacén OLTECH 2026
        </p>
      </div>
      
    </div>
  );
});

ReporteEntrada.displayName = 'ReporteEntrada';

export default ReporteEntrada;