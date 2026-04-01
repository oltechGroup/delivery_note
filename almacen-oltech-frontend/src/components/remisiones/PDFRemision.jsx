// almacen-oltech-frontend/src/components/remisiones/PDFRemision.jsx
import { useState } from 'react';
import LogoOltech from '../../assets/Logo acostado.png';

function PDFRemision({ datosVistaPrevia, detalles, onClose, onGuardarEImprimir }) {
  const [guardando, setGuardando] = useState(false);

  // Formateador de fecha
  const formatearFechaCorto = (fechaString) => {
    if (!fechaString) return '';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones).toUpperCase().replace(/\//g, '-');
  };

  const handleConfirmarImpresion = async () => {
    setGuardando(true);
    try {
      const guardadoExitoso = await onGuardarEImprimir(); 
      if (guardadoExitoso) {
        window.print();
        setTimeout(() => {
          onClose(true); 
        }, 1000);
      }
    } catch (error) {
      console.error("Error en el proceso de guardado/impresión", error);
    } finally {
      setGuardando(false);
    }
  };

  // Verifica si al menos una fila requiere mostrar la columna de Caducidad
  const mostrarColumnaCaducidad = detalles.some(d => d.imprimir_caducidad);

  if (!datosVistaPrevia) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-gray-600/95 flex justify-center overflow-y-auto print:bg-white print:p-0 print:block print:overflow-visible">
      
      {/* Estilos forzados para la impresora y paginación nativa */}
      <style>
        {`
          @media print {
            @page { margin: 10mm; size: letter portrait; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white; }
            /* Ocultar elementos UI que no deben imprimirse */
            aside, nav, header, button, .print\\:hidden { display: none !important; }
            
            /* Asegurar que el contenedor ocupe el 100% y no tenga scroll */
            html, body, #root { height: auto !important; overflow: visible !important; }
            
            /* Evitar que las filas de la tabla se corten a la mitad de la hoja */
            tr { page-break-inside: avoid; break-inside: avoid; }
            
            /* El pie de página siempre debe ir al final, evitar salto antes si es posible, 
               pero forzar si no cabe */
            tfoot { display: table-footer-group; }
          }
        `}
      </style>

      {/* BARRA DE CONTROLES FLOTANTE */}
      <div className="fixed top-6 right-8 flex space-x-4 print:hidden z-50 bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/20">
        <button 
          onClick={() => onClose(false)} 
          disabled={guardando}
          className="bg-white text-gray-700 px-6 py-2.5 rounded-lg font-bold shadow-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          ✏️ Volver a Editar
        </button>
        <button 
          onClick={handleConfirmarImpresion} 
          disabled={guardando}
          className="bg-oltech-pink text-white px-6 py-2.5 rounded-lg font-bold shadow-xl hover:bg-pink-700 flex items-center space-x-2 transition-transform active:scale-95 disabled:opacity-50"
        >
          {guardando ? (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          )}
          <span>{guardando ? 'Guardando en BD...' : 'Confirmar, Guardar e Imprimir'}</span>
        </button>
      </div>

      {/* CONTENEDOR PRINCIPAL DEL DOCUMENTO (Usando Tablas HTML Semánticas para Paginación) */}
      <div className="bg-white w-full max-w-[21.5cm] min-h-[27.9cm] my-8 p-[1cm] shadow-2xl print:shadow-none print:m-0 print:p-0 print:max-w-none text-black text-xs font-sans">
        
        <table className="w-full border-collapse">
          {/* THEAD: Encabezado ISO y Datos Generales (Se repite automáticamente en cada hoja impresa) */}
          <thead className="table-header-group">
            <tr>
              <td>
                {/* 1. ENCABEZADO ISO 9001 */}
                <table className="w-full border-collapse border border-gray-400 text-[10px] text-center mb-3 mt-2">
                  <tbody>
                    <tr>
                      <td rowSpan="6" className="border border-gray-400 w-[20%] p-1 align-middle">
                        <img src={LogoOltech} alt="OLTECH" className="mx-auto w-24 object-contain" />
                      </td>
                      <td rowSpan="2" className="border border-gray-400 w-[40%] p-2 font-black text-[12px] uppercase align-middle text-black tracking-wide">
                        REMISIÓN DE ENTRADA Y SALIDA DE ALMACÉN
                      </td>
                      <td className="border border-gray-400 w-[15%] p-1 text-left font-bold text-gray-800 bg-gray-50/50">Código:</td>
                      <td className="border border-gray-400 w-[25%] p-1 text-center text-gray-800 font-bold">MPA-05-R02</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-1 text-left font-bold text-gray-800 bg-gray-50/50">Revisión:</td>
                      <td className="border border-gray-400 p-1 text-center text-gray-800 font-bold">01</td>
                    </tr>
                    <tr>
                      <td rowSpan="1" className="border border-gray-400 p-1 font-bold text-[11px] uppercase align-middle text-black">
                        OLTECH, S.A. DE C.V.
                      </td>
                      <td className="border border-gray-400 p-1 text-left font-bold text-gray-800 bg-gray-50/50">Emisión:</td>
                      <td className="border border-gray-400 p-1 text-center text-gray-800 font-bold">05/NOV/2023</td>
                    </tr>
                    <tr>
                      <td rowSpan="3" className="border border-gray-400 p-1 text-center text-[9px] text-gray-800 leading-tight">
                        <span className="font-bold text-black">SUSTITUYE A:</span> NUEVO<br/>
                        Referencia a la norma ISO 9001:2015<br/>
                        <span className="font-bold text-black">8.5.4 Preservación</span>
                      </td>
                      <td className="border border-gray-400 p-1 text-left font-bold text-gray-800 bg-gray-50/50">Vigencia:</td>
                      <td className="border border-gray-400 p-1 text-center text-gray-800 font-bold">05/NOV/2026</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-1 text-left font-bold text-gray-800 bg-gray-50/50">Página:</td>
                      <td className="border border-gray-400 p-1 text-center text-gray-800 font-bold">Autonumeración</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-1 text-left font-bold text-gray-800 bg-gray-50/50">Resp:</td>
                      <td className="border border-gray-400 p-1 text-center text-[9px] text-gray-800 font-bold">Coord. Almacén</td>
                    </tr>
                  </tbody>
                </table>

                {/* 2. FECHA Y DATOS DE CIRUGÍA */}
                <div className="text-right font-bold mb-2 text-[10px] text-black">
                  FECHA: {formatearFechaCorto(new Date().toISOString())}
                </div>

                <table className="w-full border-collapse border border-gray-400 text-[10px] mb-4">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 p-1.5 w-1/2 font-bold bg-gray-50/50 text-black">FECHA CX: <span className="font-normal uppercase ml-1">{formatearFechaCorto(datosVistaPrevia.fechaCirugia)}</span></td>
                      <td className="border border-gray-400 p-1.5 w-1/2 font-bold bg-gray-50/50 text-black">No. DE SOLICITUD: <span className="font-bold ml-1">{datosVistaPrevia.noSolicitud}</span></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-1.5 font-bold bg-gray-50/50 text-black">PACIENTE: <span className="font-normal uppercase ml-1">{datosVistaPrevia.paciente}</span></td>
                      <td className="border border-gray-400 p-1.5 font-bold bg-gray-50/50 text-black">PROCEDIMIENTO: <span className="font-normal uppercase ml-1">{datosVistaPrevia.procedimientoNombre}</span></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-1.5 font-bold bg-gray-50/50 text-black">MÉDICO: <span className="font-normal uppercase ml-1">{datosVistaPrevia.medicoNombre}</span></td>
                      <td className="border border-gray-400 p-1.5 font-bold bg-gray-50/50 text-black">UNIDAD MÉDICA: <span className="font-normal uppercase ml-1">{datosVistaPrevia.unidadMedicaNombre}</span></td>
                    </tr>
                    <tr>
                      {/* NUEVO: Inyectando el Cliente */}
                      <td colSpan="2" className="border border-gray-400 p-1.5 font-bold bg-gray-50/50 text-black">CLIENTE: <span className="font-normal uppercase ml-1">{datosVistaPrevia.cliente || 'N/A'}</span></td>
                    </tr>
                  </tbody>
                </table>

                {/* 3. TÍTULO MATERIAL Y CABECERAS DE LA TABLA (Con color forzado ISO) */}
                <div className="text-center font-bold text-sm mb-2 uppercase underline underline-offset-2 text-black">
                  MATERIAL A VISTAS
                </div>
                
                <table className="w-full border-collapse border border-gray-600 text-[9px] mb-0">
                  <thead style={{ backgroundColor: '#e9d5ff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                    <tr>
                      <th className="border border-gray-600 p-1.5 w-32 text-black font-bold">LOTE / REF</th>
                      {mostrarColumnaCaducidad && (
                        <th className="border border-gray-600 p-1.5 w-24 text-center text-black font-bold">CADUCIDAD</th>
                      )}
                      <th className="border border-gray-600 p-1.5 text-black font-bold">DESCRIPCION</th>
                      <th className="border border-gray-600 p-1.5 w-16 text-center text-black font-bold">DESPACHO</th>
                      <th className="border border-gray-600 p-1.5 w-16 text-center text-black font-bold">CONSUMO</th>
                      <th className="border border-gray-600 p-1.5 w-16 text-center text-black font-bold">RETORNO</th>
                    </tr>
                  </thead>
                </table>
              </td>
            </tr>
          </thead>

          {/* TBODY: Contenido dinámico de ítems (El navegador lo divide si no cabe) */}
          <tbody>
            <tr>
              <td>
                <table className="w-full border-collapse border-x border-gray-600 text-[9px]">
                  <tbody>
                    {detalles.map((d, idx) => {
                      // RENDER: FILA TOTAL
                      if (d.es_total) {
                        return (
                          <tr key={idx} className="bg-gray-50 font-bold border-b border-gray-600">
                            <td colSpan={mostrarColumnaCaducidad ? 3 : 2} className="border-r border-gray-600 p-1.5 pr-4 text-right uppercase text-black">
                              {d.descripcion_custom || 'TOTAL'}
                            </td>
                            <td className="border-r border-gray-600 p-1.5 text-center text-[10px] text-black w-16">{d.cantidad_despachada}</td>
                            <td className="border-r border-gray-600 p-1.5 text-center text-[10px] text-black w-16"></td>
                            <td className="p-1.5 text-center text-[10px] text-black w-16"></td>
                          </tr>
                        );
                      }

                      // RENDER: FILA NORMAL
                      const esSetPadre = d.es_fila_set_padre;

                      return (
                        <tr key={idx} className={`border-b border-gray-600 ${esSetPadre ? 'bg-gray-50' : ''}`}>
                          <td className={`border-r border-gray-600 p-1 text-center font-mono w-32 ${esSetPadre ? 'font-black text-black' : 'font-semibold text-gray-900'}`}>
                            {d.codigo}
                          </td>
                          
                          {mostrarColumnaCaducidad && (
                            <td className="border-r border-gray-600 p-1 text-center font-semibold text-[9px] text-gray-900 w-24">
                              {d.fecha_caducidad && d.imprimir_caducidad ? formatearFechaCorto(d.fecha_caducidad) : '-'}
                            </td>
                          )}

                          <td className={`border-r border-gray-600 p-1 pl-2 uppercase align-middle ${esSetPadre ? 'font-black text-black' : 'font-semibold text-gray-900'}`}>
                            {d.descripcion}
                          </td>
                          
                          <td className={`border-r border-gray-600 p-1 text-center w-16 ${esSetPadre ? 'font-black text-black' : 'font-bold text-[10px] text-gray-900'}`}>
                            {d.cantidad_despachada}
                          </td>
                          <td className="border-r border-gray-600 p-1 text-center text-black font-bold w-16"></td>
                          <td className="p-1 text-center text-black font-bold w-16"></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>

          {/* TFOOT: Pie de firmas y notas legales (Garantiza que siempre aparezca al final) */}
          <tfoot className="table-footer-group">
            <tr>
              <td>
                <div className="pt-6">
                  {/* TABLA DE FIRMAS LOGÍSTICAS (Con color forzado ISO) */}
                  <table className="w-full border-collapse border border-gray-600 text-[10px] mb-6">
                    <thead style={{ backgroundColor: '#e9d5ff', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                      <tr>
                        <th className="border border-gray-600 p-1.5 w-1/3 text-black font-bold">Actividad</th>
                        <th className="border border-gray-600 p-1.5 w-1/3 text-black font-bold">Firma</th>
                        <th className="border border-gray-600 p-1.5 w-1/3 text-black font-bold">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-600 p-2 font-bold text-center text-black bg-gray-50/50">Salida de Almacén</td>
                        <td className="border border-gray-600 p-2"></td>
                        <td className="border border-gray-600 p-2"></td>
                      </tr>
                      <tr>
                        <td className="border border-gray-600 p-2 font-bold text-center text-black bg-gray-50/50">Recepción por logística</td>
                        <td className="border border-gray-600 p-2"></td>
                        <td className="border border-gray-600 p-2"></td>
                      </tr>
                      <tr>
                        <td className="border border-gray-600 p-2 font-bold text-center text-black bg-gray-50/50">Retorno a Almacén</td>
                        <td className="border border-gray-600 p-2"></td>
                        <td className="border border-gray-600 p-2"></td>
                      </tr>
                    </tbody>
                  </table>

                  {/* NOTAS LEGALES */}
                  <div className="text-[10px] text-justify space-y-2 mb-10 leading-tight text-gray-700">
                    <p>
                      <span className="font-bold">NOTA:</span> Estimado cliente, le informamos que, la devolución del instrumental e implantes deberá realizarse dentro de las 24 horas posteriores al término de la cirugía, en caso de que se incurra en atraso en la devolución, OLTECH aplicará una penalización equivalente a <span className="font-bold">$2,500 MXN</span> por cada día natural de atraso.
                    </p>
                    <p>
                      Asimismo, el instrumental debe ser devuelto en las mismas condiciones de limpieza y cuidado con las que se le entregó.
                    </p>
                    <p className="font-bold">
                      Agradecemos su atención y cumplimiento a estas disposiciones.
                    </p>
                  </div>

                  {/* FIRMA FINAL RECIBIDO */}
                  <div className="flex justify-between items-end mt-8 px-4 text-[11px] font-bold text-gray-700 pb-4">
                    <div className="w-1/3">RECIBIO: _________________________________</div>
                    <div className="w-1/3 text-center">FIRMA: ___________________________________</div>
                    <div className="w-1/3 text-right">FECHA: _________________________________</div>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>

        </table>
      </div>
    </div>
  );
}

export default PDFRemision;