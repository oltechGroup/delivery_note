// almacen-oltech-frontend/src/components/remisiones/PDFRemisionSoloLectura.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useReactToPrint } from 'react-to-print';
import LogoOltech from '../../assets/Logo acostado.png';

function PDFRemisionSoloLectura({ remisionMaestra, onClose }) {
  const { token } = useAuth();
  const [detalles, setDetalles] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  // Referencia para la librería de impresión
  const componentRef = useRef(null);

  // Esta función se mantiene para las fechas del encabezado (creación y cirugía)
  const formatearFechaCorto = (fechaString) => {
    if (!fechaString) return '';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones).toUpperCase().replace(/\//g, '-');
  };

  useEffect(() => {
    const cargarDetalles = async () => {
      try {
        const respuesta = await axios.get(`http://localhost:4000/api/remisiones/${remisionMaestra.id}/detalles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDetalles(respuesta.data);
      } catch (error) {
        console.error('Error al cargar detalles para impresión:', error);
      } finally {
        setCargando(false);
      }
    };
    if (remisionMaestra && remisionMaestra.id) {
      cargarDetalles();
    }
  }, [remisionMaestra, token]);

  // Hook de react-to-print (Corregido para la última versión de la librería)
  const handleImprimir = useReactToPrint({
    contentRef: componentRef, 
    documentTitle: `Remision_${remisionMaestra.no_solicitud || 'OLTECH'}`,
  });

  // ==========================================
  // MOTOR DE PAGINACIÓN INTELIGENTE
  // ==========================================
  const paginas = useMemo(() => {
    if (detalles.length === 0) return [];
    const paginasCalculadas = [];
    let itemsRestantes = [...detalles];
    let isFirst = true;

    const MAX_PRIMERA_HOJA_SIN_PIE = 24; 
    const MAX_PRIMERA_HOJA_CON_PIE = 12; 
    const MAX_HOJA_MEDIA = 28;           
    const MAX_ULTIMA_HOJA = 16;          

    while (itemsRestantes.length > 0 || isFirst) {
      if (isFirst) {
        if (itemsRestantes.length <= MAX_PRIMERA_HOJA_CON_PIE) {
          paginasCalculadas.push({ items: itemsRestantes.splice(0, itemsRestantes.length), isFirst: true, isLast: true });
        } else {
          paginasCalculadas.push({ items: itemsRestantes.splice(0, MAX_PRIMERA_HOJA_SIN_PIE), isFirst: true, isLast: false });
        }
        isFirst = false;
      } else {
        if (itemsRestantes.length <= MAX_ULTIMA_HOJA) {
          paginasCalculadas.push({ items: itemsRestantes.splice(0, itemsRestantes.length), isFirst: false, isLast: true });
        } else {
          paginasCalculadas.push({ items: itemsRestantes.splice(0, MAX_HOJA_MEDIA), isFirst: false, isLast: false });
        }
      }
    }
    
    if (paginasCalculadas.length > 0 && !paginasCalculadas[paginasCalculadas.length - 1].isLast) {
      paginasCalculadas.push({ items: [], isFirst: false, isLast: true });
    }

    return paginasCalculadas;
  }, [detalles]);

  if (cargando) {
    return (
      <div className="fixed inset-0 z-[10000] bg-gray-900/95 flex items-center justify-center">
        <div className="text-white text-xl font-bold flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-oltech-pink mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Preparando documento...
        </div>
      </div>
    );
  }

  const estaCompletada = remisionMaestra.estado_nombre?.toLowerCase().includes('completad') || remisionMaestra.estado_nombre?.toLowerCase().includes('cerrad');
  const mostrarColumnaCaducidad = detalles.some(d => d.fecha_caducidad);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center overflow-y-auto">
      
      <style>
        {`
          /* VISTA EN PANTALLA: Estilo Modal normal */
          .hoja-impresion {
            background: white;
            width: 21.59cm;
            height: 27.94cm;
            padding: 1.5cm;
            margin: 2rem auto;
            box-shadow: 0 0 40px rgba(0,0,0,0.6);
            position: relative;
            flex-shrink: 0;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
          }

          /* ESTILOS AISLADOS SOLO PARA EL PDF (react-to-print los usa) */
          @media print {
            @page { 
              margin: 0; 
              size: letter portrait; 
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .hoja-impresion {
              margin: 0 !important;
              padding: 1.5cm !important;
              width: 21.59cm !important;
              height: 27.94cm !important;
              box-shadow: none !important;
              border: none !important;
              page-break-after: always !important;
              page-break-inside: avoid !important;
              display: flex !important; 
              flex-direction: column !important;
            }
            .hoja-impresion:last-child {
              page-break-after: auto !important;
            }
            .bg-iso-purple {
              background-color: #e9d5ff !important;
            }
          }
        `}
      </style>

      {/* CONTROLES FLOTANTES */}
      <div className="sticky top-0 w-full flex justify-center py-4 bg-gray-900/50 backdrop-blur-sm z-[10001] shrink-0">
        <div className="flex space-x-4">
          <button onClick={onClose} className="bg-white text-gray-800 px-8 py-2.5 rounded-lg font-bold shadow-xl hover:bg-gray-100 transition-all active:scale-95">
            Cerrar Vista
          </button>
          <button onClick={handleImprimir} className="bg-oltech-pink text-white px-8 py-2.5 rounded-lg font-bold shadow-xl hover:bg-pink-700 flex items-center space-x-2 transition-all active:scale-95">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            <span>Generar PDF / Imprimir</span>
          </button>
        </div>
      </div>

      {/* LIENZO DE HOJAS: Le pasamos el componentRef aquí */}
      <div ref={componentRef} className="w-full flex flex-col items-center bg-white">
        {paginas.map((pagina, index) => (
          <div key={index} className="hoja-impresion text-black text-xs font-sans">
            
            {/* ENCABEZADO ISO */}
            <div className="shrink-0 w-full">
              <table className="w-full border-collapse border border-gray-600 text-[10px] text-center mb-3">
                <tbody>
                  <tr>
                    <td rowSpan="6" className="border border-gray-600 w-1/4 p-1 align-middle"><img src={LogoOltech} alt="OLTECH" className="mx-auto w-28 object-contain" /></td>
                    <td rowSpan="2" className="border border-gray-600 w-2/4 p-1 font-bold text-[11px] uppercase align-middle tracking-wider">REMISIÓN DE ENTRADA Y SALIDA DE ALMACÉN</td>
                    <td className="border border-gray-600 w-[12.5%] p-0.5 text-left font-bold bg-gray-50/50">Código:</td>
                    <td className="border border-gray-600 w-[12.5%] p-0.5 text-center font-bold">MPA-05-R02</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-600 p-0.5 text-left font-bold bg-gray-50/50">Revisión:</td>
                    <td className="border border-gray-600 p-0.5 text-center font-bold">01</td>
                  </tr>
                  <tr>
                    <td rowSpan="1" className="border border-gray-600 p-1 font-bold text-[10px] uppercase">OLTECH, S.A. DE C.V.</td>
                    <td className="border border-gray-600 p-0.5 text-left font-bold bg-gray-50/50">Emisión:</td>
                    <td className="border border-gray-600 p-0.5 text-center">05/NOV/2023</td>
                  </tr>
                  <tr>
                    <td rowSpan="3" className="border border-gray-600 p-1 text-center text-[8px] leading-tight"><span className="font-bold">SUSTITUYE A:</span> NUEVO<br/>Referencia a la norma ISO 9001:2015<br/><span className="font-bold">8.5.4 Preservación</span></td>
                    <td className="border border-gray-600 p-0.5 text-left font-bold bg-gray-50/50">Vigencia:</td>
                    <td className="border border-gray-600 p-0.5 text-center">05/NOV/2026</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-600 p-0.5 text-left font-bold bg-gray-50/50">Página:</td>
                    <td className="border border-gray-600 p-0.5 text-center font-bold">{index + 1} de {paginas.length}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-600 p-0.5 text-left font-bold bg-gray-50/50">Resp:</td>
                    <td className="border border-gray-600 p-0.5 text-center text-[8px] font-bold">Coord. Almacén</td>
                  </tr>
                </tbody>
              </table>

              {/* DATOS DE LA CX (Solo Hoja 1) */}
              {pagina.isFirst && (
                <div className="block">
                  <div className="text-right font-bold mb-2 text-[10px]">FECHA: {formatearFechaCorto(remisionMaestra.fecha_creacion)}</div>
                  <table className="w-full border-collapse border border-gray-600 text-[10px] mb-4">
                    <tbody>
                      <tr>
                        <td className="border border-gray-600 p-1.5 w-1/2 font-bold bg-gray-50/50">FECHA CX: <span className="font-normal uppercase ml-1">{formatearFechaCorto(remisionMaestra.fecha_cirugia)}</span></td>
                        <td className="border border-gray-600 p-1.5 w-1/2 font-bold bg-gray-50/50">No. DE SOLICITUD: <span className="font-bold ml-1">{remisionMaestra.no_solicitud}</span></td>
                      </tr>
                      <tr>
                        <td className="border border-gray-600 p-1.5 font-bold bg-gray-50/50">PACIENTE: <span className="font-normal uppercase ml-1">{remisionMaestra.paciente}</span></td>
                        <td className="border border-gray-600 p-1.5 font-bold bg-gray-50/50">PROCEDIMIENTO: <span className="font-normal uppercase ml-1">{remisionMaestra.procedimiento_nombre}</span></td>
                      </tr>
                      <tr>
                        <td className="border border-gray-600 p-1.5 font-bold bg-gray-50/50">MÉDICO: <span className="font-normal uppercase ml-1">{remisionMaestra.medico_nombre}</span></td>
                        <td className="border border-gray-600 p-1.5 font-bold bg-gray-50/50">UNIDAD MÉDICA: <span className="font-normal uppercase ml-1">{remisionMaestra.unidad_medica_nombre}</span></td>
                      </tr>
                      <tr>
                        <td colSpan="2" className="border border-gray-600 p-1.5 font-bold bg-gray-50/50">CLIENTE: <span className="font-normal uppercase ml-1">{remisionMaestra.cliente || 'N/A'}</span></td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="text-center font-bold text-sm mb-2 uppercase underline">MATERIAL A VISTAS</div>
                </div>
              )}
            </div>

            {/* TABLA DE MATERIALES */}
            <div className="w-full flex-1">
              {pagina.items.length > 0 && (
                <table className="w-full border-collapse border border-gray-600 text-[9px] mb-2">
                  <thead className="bg-iso-purple">
                    <tr>
                      <th className="border border-gray-600 p-1.5 w-32 text-black font-bold">LOTE / REF</th>
                      {mostrarColumnaCaducidad && <th className="border border-gray-600 p-1.5 w-24 text-center text-black font-bold">CADUCIDAD</th>}
                      <th className="border border-gray-600 p-1.5 text-black font-bold text-left pl-2">DESCRIPCIÓN</th>
                      <th className="border border-gray-600 p-1.5 w-16 text-center text-black font-bold">DESPACHO</th>
                      <th className="border border-gray-600 p-1.5 w-16 text-center text-black font-bold">CONSUMO</th>
                      <th className="border border-gray-600 p-1.5 w-16 text-center text-black font-bold">RETORNO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagina.items.map((d, idx) => {
                      if (d.es_total) {
                        return (
                          <tr key={idx} className="bg-gray-100 font-bold">
                            <td colSpan={mostrarColumnaCaducidad ? 3 : 2} className="border border-gray-600 p-1.5 pr-4 text-right uppercase">{d.descripcion_custom || 'TOTAL'}</td>
                            <td className="border border-gray-600 p-1.5 text-center font-bold">{d.cantidad_despachada}</td>
                            <td className="border border-gray-600 p-1.5 text-center font-bold">{estaCompletada ? d.cantidad_consumo : ''}</td>
                            <td className="border border-gray-600 p-1.5 text-center font-bold">{estaCompletada ? d.cantidad_retorno : ''}</td>
                          </tr>
                        );
                      }
                      const esSetPadre = d.set_codigo && !d.pieza_codigo && !d.consumible_codigo;
                      return (
                        <tr key={idx} className="border-b border-gray-600">
                          <td className={`border-r border-gray-600 p-1.5 text-center font-mono ${esSetPadre ? 'font-black bg-gray-50' : 'font-semibold'}`}>{d.pieza_codigo || d.consumible_codigo || d.set_codigo}</td>
                          {/* MODIFICADO: Solo imprimimos el string de la caducidad */}
                          {mostrarColumnaCaducidad && <td className={`border-r border-gray-600 p-1.5 text-center ${esSetPadre ? 'bg-gray-50' : ''}`}>{d.fecha_caducidad || '-'}</td>}
                          <td className={`border-r border-gray-600 p-1.5 pl-2 uppercase ${esSetPadre ? 'font-black bg-gray-50' : 'font-medium'}`}>{d.pieza_descripcion || d.consumible_nombre || d.set_descripcion}</td>
                          <td className={`border-r border-gray-600 p-1.5 text-center font-bold ${esSetPadre ? 'bg-gray-50' : ''}`}>{d.cantidad_despachada}</td>
                          <td className={`border-r border-gray-600 p-1.5 text-center font-bold ${esSetPadre ? 'bg-gray-50' : ''}`}>{estaCompletada && !esSetPadre ? d.cantidad_consumo : ''}</td>
                          <td className={`p-1 text-center font-bold ${esSetPadre ? 'bg-gray-50' : ''}`}>{estaCompletada && !esSetPadre ? d.cantidad_retorno : ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* FIRMAS */}
            {pagina.isLast && (
              <div className="w-full shrink-0 mt-auto pt-4">
                <table className="w-full border-collapse border border-gray-600 text-[10px] mb-4">
                  <thead className="bg-iso-purple">
                    <tr>
                      <th className="border border-gray-600 p-1.5 w-1/3 text-black font-bold">Actividad</th>
                      <th className="border border-gray-600 p-1.5 w-1/3 text-black font-bold">Firma</th>
                      <th className="border border-gray-600 p-1.5 w-1/3 text-black font-bold">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border border-gray-600 p-2 font-bold text-center bg-gray-50/50">Salida de Almacén</td><td className="border border-gray-600 p-2"></td><td className="border border-gray-600 p-2"></td></tr>
                    <tr><td className="border border-gray-600 p-2 font-bold text-center bg-gray-50/50">Recepción por logística</td><td className="border border-gray-600 p-2"></td><td className="border border-gray-600 p-2"></td></tr>
                    <tr><td className="border border-gray-600 p-2 font-bold text-center bg-gray-50/50">Retorno a Almacén</td><td className="border border-gray-600 p-2"></td><td className="border border-gray-600 p-2"></td></tr>
                  </tbody>
                </table>
                <div className="text-[9px] text-justify space-y-2 mb-6 leading-tight">
                  <p><span className="font-bold text-black">NOTA:</span> Estimado cliente, le informamos que, la devolución del instrumental e implantes deberá realizarse dentro de las 24 horas posteriores al término de la cirugía, en caso de que se incurra en atraso en la devolución, OLTECH aplicará una penalización equivalente a <span className="font-bold text-black">$2,500 MXN</span> por cada día natural de atraso. Asimismo, el instrumental debe ser devuelto en las mismas condiciones de limpieza y cuidado con las que se le entregó. <span className="font-bold text-black">Agradecemos su atención y cumplimiento a estas disposiciones.</span></p>
                </div>
                <div className="flex justify-between items-end mt-12 px-8 text-[11px] font-bold">
                  <div className="w-1/3 border-t border-black pt-1 text-center uppercase">RECIBIO</div>
                  <div className="w-1/3 border-t border-black pt-1 text-center uppercase mx-4">FIRMA</div>
                  <div className="w-1/3 border-t border-black pt-1 text-center uppercase">FECHA</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PDFRemisionSoloLectura;