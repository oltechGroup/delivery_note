// almacen-oltech-frontend/src/components/remisiones/PDFRemision.jsx
import { useState, useMemo } from 'react';
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

  // ==========================================
  // MOTOR DE PAGINACIÓN INTELIGENTE
  // ==========================================
  const paginas = useMemo(() => {
    const paginasCalculadas = [];
    let itemsRestantes = [...detalles];
    let isFirst = true;

    // Capacidades de renglones por tipo de hoja (ajustables)
    const MAX_PRIMERA_HOJA_SIN_PIE = 25; 
    const MAX_PRIMERA_HOJA_CON_PIE = 12; 
    const MAX_HOJA_MEDIA = 35;
    const MAX_ULTIMA_HOJA = 20;

    // Si no hay items, creamos una hoja vacía
    if (itemsRestantes.length === 0) {
      return [{ items: [], isFirst: true, isLast: true }];
    }

    while (itemsRestantes.length > 0 || isFirst) {
      if (isFirst) {
        if (itemsRestantes.length <= MAX_PRIMERA_HOJA_CON_PIE) {
          // Cabe todo en la página 1, incluyendo las firmas
          paginasCalculadas.push({ items: itemsRestantes.splice(0, itemsRestantes.length), isFirst: true, isLast: true });
        } else {
          // Llenamos la página 1, pero las firmas se van a la siguiente
          paginasCalculadas.push({ items: itemsRestantes.splice(0, MAX_PRIMERA_HOJA_SIN_PIE), isFirst: true, isLast: false });
        }
        isFirst = false;
      } else {
        if (itemsRestantes.length <= MAX_ULTIMA_HOJA) {
          // Es la última página, caben los items y las firmas
          paginasCalculadas.push({ items: itemsRestantes.splice(0, itemsRestantes.length), isFirst: false, isLast: true });
        } else {
          // Hoja intermedia, la llenamos a tope
          paginasCalculadas.push({ items: itemsRestantes.splice(0, MAX_HOJA_MEDIA), isFirst: false, isLast: false });
        }
      }
    }
    return paginasCalculadas;
  }, [detalles]);

  if (!datosVistaPrevia) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-gray-600/95 flex justify-center overflow-y-auto print:bg-white print:p-0 print:block print:overflow-visible">
      
      {/* Estilos forzados para la impresora */}
      <style>
        {`
          @media print {
            @page { margin: 10mm; size: letter portrait; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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

      {/* CONTENEDOR DE PÁGINAS */}
      <div className="w-full max-w-[21.5cm] mx-auto print:max-w-none print:mx-0 flex flex-col items-center">
        {paginas.map((pagina, index) => (
          
          <div 
            key={index} 
            className="bg-white w-full max-w-[21.5cm] min-h-[27.9cm] my-8 p-[1.5cm] shadow-2xl print:shadow-none print:m-0 print:p-0 text-black text-xs font-sans relative flex flex-col"
            style={{ pageBreakAfter: index !== paginas.length - 1 ? 'always' : 'auto' }}
          >
            
            {/* ENCABEZADO ISO 9001 (Repetido en cada hoja) */}
            <table className="w-full border-collapse border border-gray-400 text-[10px] text-center mb-4">
              <tbody>
                <tr>
                  <td rowSpan="6" className="border border-gray-400 w-1/4 p-2 align-middle">
                    <img src={LogoOltech} alt="OLTECH" className="mx-auto w-32 object-contain" />
                  </td>
                  <td rowSpan="2" className="border border-gray-400 w-2/4 p-2 font-bold text-[12px] uppercase align-middle text-gray-600 tracking-wider">
                    REMISIÓN DE ENTRADA Y SALIDA DE ALMACÉN
                  </td>
                  <td className="border border-gray-400 w-[12.5%] p-1 text-left font-bold text-gray-600 bg-gray-50/50">Código:</td>
                  <td className="border border-gray-400 w-[12.5%] p-1 text-center text-gray-500">MPA-05-R02</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-1 text-left font-bold text-gray-600 bg-gray-50/50">Revisión:</td>
                  <td className="border border-gray-400 p-1 text-center text-gray-500">01</td>
                </tr>
                <tr>
                  <td rowSpan="1" className="border border-gray-400 p-1 font-bold text-[11px] uppercase align-middle text-gray-600">
                    OLTECH, S.A. DE C.V.
                  </td>
                  <td className="border border-gray-400 p-1 text-left font-bold text-gray-600 bg-gray-50/50">Emisión:</td>
                  <td className="border border-gray-400 p-1 text-center text-gray-500">05/NOV/2023</td>
                </tr>
                <tr>
                  <td rowSpan="3" className="border border-gray-400 p-1 text-center text-[9px] text-gray-500 leading-tight">
                    <span className="font-bold text-gray-600">SUSTITUYE A:</span> NUEVO<br/>
                    Referencia a la norma ISO 9001:2015<br/>
                    <span className="font-bold text-gray-600">8.5.4 Preservación</span>
                  </td>
                  <td className="border border-gray-400 p-1 text-left font-bold text-gray-600 bg-gray-50/50">Vigencia:</td>
                  <td className="border border-gray-400 p-1 text-center text-gray-500">05/NOV/2026</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-1 text-left font-bold text-gray-600 bg-gray-50/50">Página:</td>
                  <td className="border border-gray-400 p-1 text-center text-gray-500 font-bold">{index + 1} de {paginas.length}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-1 text-left font-bold text-gray-600 bg-gray-50/50">Responsable:</td>
                  <td className="border border-gray-400 p-1 text-center text-[9px] text-gray-500">Coordinador de Almacén</td>
                </tr>
              </tbody>
            </table>

            {/* FECHA Y DATOS DE CIRUGÍA (Solo en la página 1) */}
            {pagina.isFirst && (
              <>
                <div className="text-right font-bold mb-4 text-[11px]">
                  FECHA: {formatearFechaCorto(new Date().toISOString())}
                </div>

                <table className="w-full border-collapse border border-gray-400 text-[10px] mb-6">
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 p-1.5 w-1/2 font-bold bg-gray-50/50">FECHA CX: <span className="font-normal uppercase ml-1">{formatearFechaCorto(datosVistaPrevia.fechaCirugia)}</span></td>
                      <td className="border border-gray-400 p-1.5 w-1/2 font-bold bg-gray-50/50">No. DE SOLICITUD: <span className="font-bold text-black ml-1">{datosVistaPrevia.noSolicitud}</span></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-1.5 font-bold bg-gray-50/50">PACIENTE: <span className="font-normal uppercase ml-1">{datosVistaPrevia.paciente}</span></td>
                      <td className="border border-gray-400 p-1.5 font-bold bg-gray-50/50">PROCEDIMIENTO: <span className="font-normal uppercase ml-1">{datosVistaPrevia.procedimientoNombre}</span></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-1.5 font-bold bg-gray-50/50">MÉDICO: <span className="font-normal uppercase ml-1">{datosVistaPrevia.medicoNombre}</span></td>
                      <td className="border border-gray-400 p-1.5 font-bold bg-gray-50/50">UNIDAD MÉDICA: <span className="font-normal uppercase ml-1">{datosVistaPrevia.unidadMedicaNombre}</span></td>
                    </tr>
                    <tr>
                      <td colSpan="2" className="border border-gray-400 p-1.5 font-bold bg-gray-50/50">CLIENTE: <span className="font-normal"></span></td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            {/* TÍTULO MATERIAL (Solo si es la primera página o si cortó a la mitad) */}
            {pagina.isFirst && (
              <div className="text-center font-bold text-sm mb-3 uppercase underline underline-offset-2">
                MATERIAL A VISTAS
              </div>
            )}

            {/* TABLA DE EXPLOSIÓN DE MATERIALES */}
            <div className="flex-1">
              <table className="w-full border-collapse border border-gray-400 text-[9px] mb-4">
                <thead className="bg-gray-100 print:bg-gray-100">
                  <tr>
                    <th className="border border-gray-400 p-1.5 w-32 text-gray-700">LOTE / REF</th>
                    <th className="border border-gray-400 p-1.5 text-gray-700">DESCRIPCION</th>
                    <th className="border border-gray-400 p-1.5 w-16 text-center text-gray-700">DESPACHO</th>
                    <th className="border border-gray-400 p-1.5 w-16 text-center text-gray-700">CONSUMO</th>
                    <th className="border border-gray-400 p-1.5 w-16 text-center text-gray-700">RETORNO</th>
                  </tr>
                </thead>
                <tbody>
                  {pagina.items.map((d, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-400 p-1 text-center font-mono font-bold text-gray-700">{d.codigo}</td>
                      <td className="border border-gray-400 p-1 pl-2 font-medium uppercase text-gray-700">{d.descripcion}</td>
                      <td className="border border-gray-400 p-1 text-center font-bold text-[10px]">{d.cantidad_despachada}</td>
                      <td className="border border-gray-400 p-1 text-center"></td>
                      <td className="border border-gray-400 p-1 text-center"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* FIRMAS Y LEGALES (Solo en la última página) */}
            {pagina.isLast && (
              <div className="mt-auto pt-6">
                {/* TABLA DE FIRMAS LOGÍSTICAS */}
                <table className="w-full border-collapse border border-gray-400 text-[10px] mb-6">
                  <thead className="bg-gray-100 print:bg-gray-100">
                    <tr>
                      <th className="border border-gray-400 p-1.5 w-1/3 text-gray-700">Actividad</th>
                      <th className="border border-gray-400 p-1.5 w-1/3 text-gray-700">Firma</th>
                      <th className="border border-gray-400 p-1.5 w-1/3 text-gray-700">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-400 p-2 font-bold text-center text-gray-600 bg-gray-50/50">Salida de Almacén</td>
                      <td className="border border-gray-400 p-2"></td>
                      <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 font-bold text-center text-gray-600 bg-gray-50/50">Recepción por logística</td>
                      <td className="border border-gray-400 p-2"></td>
                      <td className="border border-gray-400 p-2"></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-400 p-2 font-bold text-center text-gray-600 bg-gray-50/50">Retorno a Almacén</td>
                      <td className="border border-gray-400 p-2"></td>
                      <td className="border border-gray-400 p-2"></td>
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
            )}

          </div>
        ))}
      </div>

    </div>
  );
}

export default PDFRemision;