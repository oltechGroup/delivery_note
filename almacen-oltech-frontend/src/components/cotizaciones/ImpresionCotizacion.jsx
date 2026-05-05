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

  // 1. Configuración del motor de impresión (Intacto)
  const handleImprimir = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Cotizacion_OLTECH_COT-${String(cotizacionId).padStart(4, '0')}`,
    // Cuando el usuario cierra la ventana de impresión del navegador (imprima o cancele),
    // avisamos a Cotizaciones.jsx que ya terminamos para que nos destruya.
    onAfterPrint: () => onClose(), 
  });

  // 2. Carga de datos
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

  // 3. El Gatillo Automático: 
  // Una vez que los datos se cargaron y el componente se dibujó "invisiblemente", lanzamos la impresión.
  useEffect(() => {
    if (!cargando && cotizacion && !error) {
      // Usamos un pequeñísimo timeout para asegurar que las imágenes y fuentes 
      // estén totalmente renderizadas en el "fantasma" antes de capturarlo para el PDF
      const timer = setTimeout(() => {
        handleImprimir();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [cargando, cotizacion, error, handleImprimir]);

  const formatearDinero = (monto) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);
  
  const formatearFechaLarga = (fechaString) => {
    if (!fechaString) return '';
    const fechaLimpia = fechaString.split('T')[0]; 
    const [year, month, day] = fechaLimpia.split('-');
    const fechaObj = new Date(year, month - 1, day);
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return fechaObj.toLocaleDateString('es-MX', opciones);
  };

  // Mensajes de carga o error (Visibles temporalmente si el internet es lento)
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

  // 4. Renderizado: Todo el CSS y HTML es EXACTAMENTE el mismo que tenías.
  // La única diferencia es que envolvemos todo en un div con <div style={{ display: 'none' }}>
  // para que el usuario web no vea esto en pantalla, pero react-to-print SÍ lo lea para imprimir.
  return (
    <div style={{ display: 'none' }}>
      
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
            text-align: left; /* Asegura que el texto no se centre por el contenedor padre */
          }

          /* ESTILOS NUEVOS PARA VISUALIZACIÓN EN PANTALLA */
          .escritorio-vista {
              display: block;
              width: 100%;
              overflow-x: auto;
              padding-bottom: 2rem;
              text-align: center;
          }
          
          .contenedor-centrado {
              display: inline-block;
              margin: 0 auto;
          }

          /* Ocultamos el sello fijo en la vista de pantalla normal */
          .fondo-fijo-pdf {
            display: none;
          }

          /* Reglas exclusivas para el motor de impresión PDF (INTACTAS) */
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
            .escritorio-vista { display: block !important; overflow: visible !important; }
            .contenedor-centrado { display: block !important; margin: 0 !important; }
          }
        `}
      </style>

      {/* LIENZO DE IMPRESIÓN */}
      <div className="escritorio-vista">
        <div className="contenedor-centrado">
            <div 
                ref={componentRef} 
                className="hoja-impresion text-black leading-tight"
                style={{ 
                    backgroundImage: `url(${bgCotizacion})`, 
                    backgroundSize: '19.03cm 25.58cm', 
                    backgroundRepeat: 'repeat-y' 
                }}
            >
              
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

                            {/* NUEVO BLOQUE CONTENEDOR DE SEGURIDAD (Condiciones + Firma) */}
                            <div className="evitar-corte">
                                <div className="mb-8">
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

                                <div className="w-full flex flex-col items-center relative mt-4">
                                    <p className="font-bold text-[9pt] mb-6 text-center">Atentamente<br/>OLTECH S.A. DE C.V.</p>
                                    
                                    <div className="w-64 border-b border-black text-center flex flex-col items-center justify-end h-14 relative z-10">
                                        {cotizacion.firmas_url && (
                                        <img src={cotizacion.firmas_url} alt="Firma" className="absolute bottom-0 max-h-16 pointer-events-none" />
                                        )}
                                    </div>
                                    
                                    <p className="text-[9pt] font-bold mt-1 z-10">{cotizacion.firma_nombre || '___________________________'}</p>
                                    <p className="text-[9pt] font-bold z-10">REPRESENTANTE LEGAL</p>
                                </div>
                            </div>

                        </td>
                    </tr>
                </tbody>
              </table>

            </div>
        </div>
      </div>

    </div>
  );
}

export default ImpresionCotizacion;