// almacen-oltech-frontend/src/components/almacen/impresion/ReporteEntrada.jsx
import { useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import LogoOltech from '../../../assets/Logo acostado.png';

function ReporteEntrada({ entrada, detalles, onClose }) {
    const componentRef = useRef(null);

    const fechaEntrada = entrada?.fecha_entrada 
      ? new Date(entrada.fecha_entrada).toLocaleDateString('es-MX', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }).toUpperCase().replace(/\//g, '-')
      : '--';

    const fechaImpresion = new Date().toLocaleDateString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const handleImprimir = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Comprobante_Ingreso_${entrada?.folio || 'Sin_Folio'}`,
    });

    // ==========================================
    // MOTOR DE PAGINACIÓN INTELIGENTE (V 3.0)
    // ==========================================
    const paginas = useMemo(() => {
        if (!detalles || detalles.length === 0) return [];

        // SOLUCIÓN AL NÚMERO 1: Asignamos el índice real antes de paginar
        const detallesConIndex = detalles.map((item, index) => ({
            ...item,
            globalIndex: index + 1
        }));

        const paginasCalculadas = [];
        let itemsRestantes = [...detallesConIndex];
        let isFirst = true;

        // LÍMITES CALIBRADOS PARA APROVECHAR LA HOJA AL MÁXIMO
        const MAX_UNICA = 18;     // Si TODO cabe en 1 sola hoja (Folio + Tabla + Firmas)
        const MAX_PRIMERA = 24;   // Hoja 1 (Lleva Folio, NO lleva firmas)
        const MAX_MEDIA = 30;     // Hojas de en medio (Pura tabla, sin firmas)
        const MAX_ULTIMA = 22;    // Última hoja (Lleva tabla y firmas abajo)

        while (itemsRestantes.length > 0 || isFirst) {
            if (isFirst) {
                if (itemsRestantes.length <= MAX_UNICA) {
                    paginasCalculadas.push({ items: itemsRestantes.splice(0, itemsRestantes.length), isFirst: true, isLast: true });
                } else {
                    // Evita el salto en blanco: Si tomar MAX_PRIMERA dejaría la siguiente hoja vacía de filas, dejamos 2 filas para acompañar las firmas.
                    let tomar = MAX_PRIMERA;
                    if (itemsRestantes.length > MAX_UNICA && itemsRestantes.length <= MAX_PRIMERA) {
                        tomar = itemsRestantes.length - 2; 
                    }
                    paginasCalculadas.push({ items: itemsRestantes.splice(0, tomar), isFirst: true, isLast: false });
                }
                isFirst = false;
            } else {
                if (itemsRestantes.length <= MAX_ULTIMA) {
                    paginasCalculadas.push({ items: itemsRestantes.splice(0, itemsRestantes.length), isFirst: false, isLast: true });
                } else {
                    let tomar = MAX_MEDIA;
                    if (itemsRestantes.length > MAX_ULTIMA && itemsRestantes.length <= MAX_MEDIA) {
                        tomar = itemsRestantes.length - 2;
                    }
                    paginasCalculadas.push({ items: itemsRestantes.splice(0, tomar), isFirst: false, isLast: false });
                }
            }
        }

        return paginasCalculadas;
    }, [detalles]);

    return (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center overflow-y-auto pdf-main-overlay">
            
            <style>
                {`
                /* VISTA EN PANTALLA */
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
                    overflow: hidden; 
                }

                /* ESTILOS AISLADOS Y LIMPIOS PARA PDF */
                @media print {
                    @page { 
                        margin: 0; 
                        size: letter portrait; 
                    }
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        background: white !important;
                    }
                    .pdf-main-overlay {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        display: block !important; 
                        background: white !important;
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
                        overflow: hidden !important;
                    }
                    tr {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    .hoja-impresion:last-child {
                        page-break-after: auto !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .text-oltech-blue { color: #1e3a8a !important; }
                    .bg-gray-50 { background-color: #f9fafb !important; }
                    .bg-gray-100 { background-color: #f3f4f6 !important; }
                    .bg-green-50\\/30 { background-color: rgba(240, 253, 244, 0.3) !important; }
                    .bg-green-50 { background-color: #f0fdf4 !important; }
                    .text-green-800 { color: #166534 !important; }
                }
                `}
            </style>

            {/* BARRA DE ACCIONES */}
            <div className="sticky top-0 w-full flex justify-center py-4 bg-gray-900/50 backdrop-blur-sm print:hidden z-[10001] shrink-0">
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

            {/* LIENZO DE HOJAS */}
            <div ref={componentRef} className="w-full flex flex-col items-center bg-white">
                {paginas.map((pagina, index) => (
                    <div key={index} className="hoja-impresion text-black text-xs font-sans">
                        
                        {/* ENCABEZADO ISO 9001 (Aparece en todas las hojas) */}
                        <div className="shrink-0 w-full">
                            <table className="w-full border-collapse border border-gray-600 text-[10px] text-center mb-3">
                                <tbody>
                                    <tr>
                                        <td rowSpan="6" className="border border-gray-600 w-1/4 p-1 align-middle">
                                            <img src={LogoOltech} alt="OLTECH" className="mx-auto w-28 object-contain" />
                                        </td>
                                        <td rowSpan="2" className="border border-gray-600 w-2/4 p-1 font-bold text-[11px] uppercase align-middle tracking-wider">
                                            REGISTRO DE ENTRADAS
                                        </td>
                                        <td className="border border-gray-600 w-[12.5%] p-0.5 text-left font-bold bg-gray-50">Código:</td>
                                        <td className="border border-gray-600 w-[12.5%] p-0.5 text-center font-bold">MPA-07-R03</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-600 p-0.5 text-left font-bold bg-gray-50">Revisión:</td>
                                        <td className="border border-gray-600 p-0.5 text-center font-bold">01</td>
                                    </tr>
                                    <tr>
                                        <td rowSpan="1" className="border border-gray-600 p-1 font-bold text-[10px] uppercase">OLTECH, S.A. DE C.V.</td>
                                        <td className="border border-gray-600 p-0.5 text-left font-bold bg-gray-50">Emisión:</td>
                                        <td className="border border-gray-600 p-0.5 text-center">05/NOV/2023</td>
                                    </tr>
                                    <tr>
                                        <td rowSpan="3" className="border border-gray-600 p-1 text-center text-[8px] leading-tight">
                                            <span className="font-bold">SUSTITUYE A:</span> NUEVO<br/>
                                            Referencia a la norma ISO 9001:2015<br/>
                                            <span className="font-bold">8.5.4 Preservación</span>
                                        </td>
                                        <td className="border border-gray-600 p-0.5 text-left font-bold bg-gray-50">Vigencia:</td>
                                        <td className="border border-gray-600 p-0.5 text-center">05/NOV/2026</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-600 p-0.5 text-left font-bold bg-gray-50">Página:</td>
                                        <td className="border border-gray-600 p-0.5 text-center font-bold">{index + 1} de {paginas.length}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-600 p-0.5 text-left font-bold bg-gray-50">Resp:</td>
                                        <td className="border border-gray-600 p-0.5 text-center text-[8px] font-bold">Coord. Almacén</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* INFORMACIÓN DEL INGRESO (Solo en la página 1) */}
                            {pagina.isFirst && (
                                <div className="mb-4 mt-2">
                                    <div className="flex justify-between items-end border-b-2 border-gray-800 pb-1 mb-2">
                                        <h2 className="text-sm font-black uppercase text-oltech-blue tracking-widest">Detalles del Ingreso</h2>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase mr-2">FOLIO:</span>
                                            <span className="bg-black text-white px-3 py-1 rounded font-black tracking-widest text-sm">{entrada?.folio || 'S/F'}</span>
                                        </div>
                                    </div>
                                    <table className="w-full text-[10px] border-collapse">
                                        <tbody>
                                            <tr>
                                                <td className="py-1 w-[15%] font-bold text-gray-500 uppercase">Recepción:</td>
                                                <td className="py-1 w-[35%] font-bold text-gray-800">{fechaEntrada}</td>
                                                <td className="py-1 w-[15%] font-bold text-gray-500 uppercase text-right pr-2">ID Registro:</td>
                                                <td className="py-1 w-[35%] font-bold font-mono text-gray-800">#{entrada?.id}</td>
                                            </tr>
                                            <tr>
                                                <td className="py-1 font-bold text-gray-500 uppercase">Usuario:</td>
                                                <td className="py-1 font-bold uppercase text-gray-800">{entrada?.usuario_nombre || 'SISTEMA'}</td>
                                                <td className="py-1 font-bold text-gray-500 uppercase text-right pr-2">Total Piezas:</td>
                                                <td className="py-1 font-black text-green-700 text-sm">{entrada?.total_articulos} <span className="text-[9px] text-gray-500">PZAS</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* TABLA DE MATERIALES */}
                        <div className="w-full flex-1">
                            {pagina.items.length > 0 && (
                                <table className="w-full border-collapse border border-gray-600 text-[9px] mb-2">
                                    <thead className="bg-gray-100">
                                        <tr className="border-b-2 border-black text-black">
                                            <th className="p-1.5 border border-gray-600 text-center w-8 text-[9px] uppercase font-black">#</th>
                                            <th className="p-1.5 border border-gray-600 text-left w-20 text-[9px] uppercase font-black">Código Ref.</th>
                                            <th className="p-1.5 border border-gray-600 text-left text-[9px] uppercase font-black">Descripción</th>
                                            <th className="p-1.5 border border-gray-600 text-left w-24 text-[9px] uppercase font-black">Nombre Com.</th>
                                            <th className="p-1.5 border border-gray-600 text-center w-10 text-[9px] uppercase font-black">Und.</th>
                                            <th className="p-1.5 border border-gray-600 text-center w-16 text-[9px] uppercase font-black">Lote</th>
                                            <th className="p-1.5 border border-gray-600 text-center w-16 text-[9px] uppercase font-black">Caduc.</th>
                                            <th className="p-1.5 border border-gray-600 text-center w-12 text-[9px] uppercase font-black bg-green-50 text-green-800">Cant.</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagina.items.map((item) => (
                                            <tr key={item.detalle_id || item.id} className="border-b border-gray-600">
                                                {/* EL NÚMERO CORREGIDO */}
                                                <td className="p-1.5 border border-gray-600 text-center text-[10px] font-mono text-gray-600">{item.globalIndex}</td>
                                                
                                                <td className="p-1.5 border border-gray-600 text-left text-[10px] font-bold font-mono text-oltech-blue">{item.codigo_referencia}</td>
                                                <td className="p-1.5 border border-gray-600 text-left text-[9px] font-medium uppercase leading-tight">{item.consumible_nombre || item.nombre}</td>
                                                <td className="p-1.5 border border-gray-600 text-left text-[9px] text-gray-600 italic uppercase leading-tight">{item.nombre_comercial || '-'}</td>
                                                <td className="p-1.5 border border-gray-600 text-center text-[9px]">{item.unidad_medida}</td>
                                                <td className="p-1.5 border border-gray-600 text-center text-[9px] font-mono">{item.lote_ingresado || item.lote || '-'}</td>
                                                <td className="p-1.5 border border-gray-600 text-center text-[9px]">
                                                    {(item.fecha_caducidad_ingresada || item.fecha_caducidad) ? new Date(item.fecha_caducidad_ingresada || item.fecha_caducidad).toLocaleDateString('es-MX', {day: '2-digit', month: '2-digit', year: '2-digit'}) : '-'}
                                                </td>
                                                <td className="p-1.5 border border-gray-600 text-center text-xs font-black bg-green-50/30 text-green-800">
                                                    {item.cantidad_ingresada || item.cantidad}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* SECCIÓN DE OBSERVACIONES Y FIRMAS (Solo en la última hoja) */}
                        {pagina.isLast && (
                            <div className="w-full shrink-0 mt-auto pt-4">
                                
                                {/* Observaciones */}
                                <div className="mb-6 border border-gray-400 rounded p-2 bg-gray-50/50">
                                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wider mb-1">Observaciones del Ingreso:</p>
                                    <p className="text-[11px] text-gray-800 italic leading-snug">
                                        {entrada?.observaciones ? `"${entrada.observaciones}"` : "Ninguna observación registrada."}
                                    </p>
                                </div>



                                {/* Footer */}
                                <div className="mt-8 pt-3 border-t border-gray-200 text-center">
                                    <p className="text-[8px] text-gray-400 uppercase tracking-widest">
                                        Comprobante interno de recepción generado el {fechaImpresion} • Sistema de Control de Inventarios OLTECH
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ReporteEntrada;