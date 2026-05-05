// almacen-oltech-frontend/src/components/cotizaciones/ImpresionCotizacion.jsx
import { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../hooks/useAuth';

// Importamos la imagen del membrete
import bgCotizacion from '../../assets/cotizaciones.jpeg';

function ImpresionCotizacion({ cotizacionId, onClose }) {
  const { token } = useAuth();
  const componentRef = useRef(null);
  
  const [cotizacion, setCotizacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCotizacion = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/cotizaciones/${cotizacionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCotizacion(res.data);
      } catch (err) {
        console.error('Error al cargar la cotización:', err);
        setError('No se pudo cargar la información del documento.');
      } finally {
        setCargando(false);
      }
    };
    if (cotizacionId) fetchCotizacion();
  }, [cotizacionId, token]);

  const handleImprimir = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Cotizacion_OLTECH_COT-${String(cotizacionId).padStart(4, '0')}`,
  });

  const formatearDinero = (monto) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);
  const formatearFechaLarga = (fechaString) => {
    if (!fechaString) return '';
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones);
  };

  if (cargando) return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center">
      <div className="text-white text-xl font-bold animate-pulse">Generando documento oficial...</div>
    </div>
  );

  if (error || !cotizacion) return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center justify-center">
      <div className="bg-white p-6 rounded-lg text-red-600 font-bold">{error || 'Cotización no encontrada.'}</div>
      <button onClick={onClose} className="mt-4 bg-white text-black px-6 py-2 rounded font-bold">Cerrar</button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center overflow-y-auto py-4 sm:py-8">
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap');

          /* Contenedor principal */
          .hoja-impresion {
            background: white;
            width: 19.03cm;
            min-height: 25.58cm;
            box-shadow: 0 0 40px rgba(0,0,0,0.6);
            position: relative;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            font-family: 'Lato', sans-serif;
          }

          /* Ocultamos el sello fijo en la vista de pantalla normal */
          .fondo-fijo-pdf {
            display: none;
          }

          /* Reglas exclusivas para el motor de impresión PDF */
          @media print {
            @page { 
              margin: 0; 
              size: 19.03cm 25.58cm; 
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              margin: 0;
            }
            .hoja-impresion {
              margin: 0 !important;
              width: 19.03cm !important;
              min-height: 100% !important; 
              box-shadow: none !important;
              /* Apagamos el fondo normal en impresión para que no choque con el fijo */
              background-image: none !important; 
              background-color: transparent !important;
            }
            
            /* EL SELLO MÁGICO: Esto obligará a imprimir la imagen completa en cada página generada */
            .fondo-fijo-pdf {
              display: block !important;
              position: fixed;
              top: 0;
              left: 0;
              width: 19.03cm;
              height: 25.58cm;
              background-image: url(${bgCotizacion});
              background-size: 19.03cm 25.58cm;
              background-repeat: no-repeat;
              z-index: -1;
            }

            .evitar-corte {
                page-break-inside: avoid;
            }
            .no-print { display: none !important; }
          }
        `}
      </style>

      {/* CONTROLES SUPERIORES */}
      <div className="sticky top-0 w-full max-w-[19.03cm] flex justify-between bg-gray-900/80 backdrop-blur-md p-4 rounded-xl z-[10001] shadow-2xl mb-6 border border-gray-700 no-print">
        <button onClick={onClose} className="bg-white text-gray-800 px-6 py-2 rounded-lg font-bold hover:bg-gray-100">Cerrar</button>
        <button onClick={handleImprimir} className="bg-oltech-pink text-white px-6 py-2 rounded-lg font-bold shadow-md flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          <span>Imprimir / Guardar PDF</span>
        </button>
      </div>

      {/* LIENZO DE IMPRESIÓN */}
      <div className="w-full flex justify-center overflow-x-auto pb-8">
        <div 
            ref={componentRef} 
            className="hoja-impresion text-black leading-tight"
            style={{ 
                /* Mantenemos el fondo para la vista en pantalla (se desactiva solo en PDF) */
                backgroundImage: `url(${bgCotizacion})`, 
                backgroundSize: '19.03cm 25.58cm', 
                backgroundRepeat: 'repeat-y' 
              }}
        >
          
          {/* EL SELLO FIJO: Solo visible al imprimir, llena hojas completas siempre */}
          <div className="fondo-fijo-pdf"></div>

          <table className="w-full h-full border-collapse">
            
            <thead className="bg-transparent border-0">
                <tr>
                    <td className="h-[2.8cm] border-0 p-0 m-0"></td>
                </tr>
            </thead>

            <tfoot className="bg-transparent border-0">
                <tr>
                    <td className="h-[2.5cm] border-0 p-0 m-0"></td>
                </tr>
            </tfoot>

            <tbody className="border-0">
                <tr>
                    <td className="border-0 px-[1.5cm] align-top">
                        
                        <div className="text-right mb-2 text-[9pt] font-medium">
                        Ixtapaluca, Estado de México a {formatearFechaLarga(cotizacion.fecha)}
                        </div>

                        <div className="mb-2 whitespace-pre-wrap font-bold uppercase text-[9pt] leading-snug">
                        {cotizacion.cliente_texto}
                        </div>

                        <div className="mb-2 text-justify text-[9pt]">
                        Reciba un cordial saludo por mi representada OLTECH S.A. DE C.V., nos es grato presentar ante usted la siguiente cotización.
                        </div>

                        <div className="mb-1">
                            <table className="w-full border-collapse border border-black text-[8pt] bg-white/80">
                                <thead className="font-bold bg-[#b4c6e7]">
                                    <tr>
                                        <th className="border border-black p-1 w-10 text-center">PARTIDA</th>
                                        <th className="border border-black p-1 text-center">DESCRIPCIÓN</th>
                                        <th className="border border-black p-1 w-16 text-center">UNIDAD</th>
                                        <th className="border border-black p-1 w-14 text-center">CANTIDAD</th>
                                        <th className="border border-black p-1 w-20 text-center">PRECIO<br/>UNITARIO</th>
                                        <th className="border border-black p-1 w-20 text-center">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cotizacion.detalles.map((d) => (
                                    <tr key={d.id} className="bg-white/50 evitar-corte">
                                        <td className="border border-black p-1 text-center font-bold">{d.partida}</td>
                                        <td className="border border-black p-1 uppercase leading-tight">{d.descripcion}</td>
                                        <td className="border border-black p-1 text-center uppercase">{d.unidad}</td>
                                        <td className="border border-black p-1 text-center">{d.cantidad}</td>
                                        <td className="border border-black p-1 text-right">{formatearDinero(d.precio_unitario)}</td>
                                        <td className="border border-black p-1 text-right">{formatearDinero(d.importe)}</td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end w-full mb-4 evitar-corte">
                            <table className="border-collapse border border-black text-[8pt] bg-white/80 w-[40%] mt-[-1px]">
                                <tbody>
                                    <tr>
                                        <td className="border border-black p-1 text-center font-bold">SUBTOTAL</td>
                                        <td className="border border-black p-1 text-right font-bold">{formatearDinero(cotizacion.subtotal)}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-1 text-center font-bold">IVA</td>
                                        <td className="border border-black p-1 text-right font-bold">{formatearDinero(cotizacion.iva)}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-black p-1 text-center font-bold">TOTAL</td>
                                        <td className="border border-black p-1 text-right font-bold">{formatearDinero(cotizacion.total)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mb-8 evitar-corte">
                            <h4 className="font-bold text-[9pt] mb-1">CONDICIONES COMERCIALES</h4>
                            <ul className="text-[9pt] space-y-0 list-none ml-2 leading-tight">
                                <li>- Condiciones de Pago. Según la LAAASP.</li>
                                <li>- Entrega y Envío. CDMX y Área Metropolitana</li>
                                <li>- Vigencia. 30 días naturales a partir de su fecha de emisión.</li>
                                <li>- Método de Pago. Transferencia bancaria</li>
                                <li>- Los precios en esta cotización están en M.N</li>
                                <li>- La entrega. 10 días hábiles posteriores a la confirmación</li>
                                <li>- Señalar en su caso, el porcentaje del anticipo (SIN ANTICIPO)</li>
                                <li className="text-justify">- El porcentaje de garantía de cumplimiento será del 10%. - Penas convencionales por atraso en la entrega de bienes y/o servicios y Deducciones por incumplimiento parcial o deficiente serán del 2.5 % - El archivo adjunto de especificaciones técnicas se hace consistir en 02 fojas</li>
                            </ul>
                        </div>

                        <div className="w-full flex flex-col items-center relative mt-4 evitar-corte">
                            <p className="font-bold text-[9pt] mb-6 text-center">Atentamente<br/>OLTECH S.A. DE C.V.</p>
                            
                            <div className="w-64 border-b border-black text-center flex flex-col items-center justify-end h-14 relative z-10">
                                {cotizacion.firmas_url && (
                                <img src={cotizacion.firmas_url} alt="Firma" className="absolute bottom-0 max-h-16 pointer-events-none" />
                                )}
                            </div>
                            
                            <p className="text-[9pt] font-bold mt-1 z-10">{cotizacion.firma_nombre || '___________________________'}</p>
                            <p className="text-[9pt] font-bold z-10">REPRESENTANTE LEGAL</p>
                        </div>

                    </td>
                </tr>
            </tbody>
          </table>

        </div>
      </div>

    </div>
  );
}

export default ImpresionCotizacion;