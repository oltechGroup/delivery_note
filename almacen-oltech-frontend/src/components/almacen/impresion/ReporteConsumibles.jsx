// almacen-oltech-frontend/src/components/almacen/impresion/ReporteConsumibles.jsx
import { useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import LogoOltech from '../../../assets/Logo acostado.png';

function ReporteConsumibles({ categoria, consumibles, onClose }) {
    const componentRef = useRef(null);

    const fechaActual = new Date().toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const handleImprimir = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Reporte_Existencias_Insumos_${categoria?.nombre || 'General'}`,
    });

    // ==========================================
    // MOTOR DE PAGINACIÓN INTELIGENTE 
    // ==========================================
    const paginas = useMemo(() => {
        if (!consumibles || consumibles.length === 0) return [];

        const paginasCalculadas = [];
        let itemsRestantes = [...consumibles];
        let isFirst = true;

        // LÍMITES CALIBRADOS A LA BAJA PARA DEJAR UN MARGEN INFERIOR HERMOSO
        const MAX_FILAS_PRIMERA_HOJA = 18; 
        const MAX_FILAS_HOJA_MEDIA = 22;   
        const MAX_FILAS_ULTIMA_HOJA_CON_FIRMAS = 12;  

        while (itemsRestantes.length > 0 || isFirst) {
            if (isFirst) {
                if (itemsRestantes.length <= MAX_FILAS_ULTIMA_HOJA_CON_FIRMAS) {
                    paginasCalculadas.push({ items: itemsRestantes.splice(0, itemsRestantes.length), isFirst: true, isLast: true });
                } else {
                    paginasCalculadas.push({ items: itemsRestantes.splice(0, MAX_FILAS_PRIMERA_HOJA), isFirst: true, isLast: false });
                }
                isFirst = false;
            } else {
                if (itemsRestantes.length <= MAX_FILAS_ULTIMA_HOJA_CON_FIRMAS) {
                    paginasCalculadas.push({ items: itemsRestantes.splice(0, itemsRestantes.length), isFirst: false, isLast: true });
                } else {
                    paginasCalculadas.push({ items: itemsRestantes.splice(0, MAX_FILAS_HOJA_MEDIA), isFirst: false, isLast: false });
                }
            }
        }

        if (paginasCalculadas.length > 0 && !paginasCalculadas[paginasCalculadas.length - 1].isLast) {
            paginasCalculadas.push({ items: [], isFirst: false, isLast: true });
        }

        return paginasCalculadas;
    }, [consumibles]);

    return (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center overflow-y-auto pdf-main-overlay">
            
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
                    overflow: hidden; 
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
                        overflow: hidden !important;
                    }
                    .hoja-impresion:last-child {
                        page-break-after: auto !important;
                    }
                    .bg-oltech-dark { background-color: #1f2937 !important; color: white !important; }
                    .bg-gray-header { background-color: #f3f4f6 !important; }
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
                        
                        {/* ENCABEZADO ISO 9001 */}
                        <div className="shrink-0 w-full">
                            <table className="w-full border-collapse border border-gray-600 text-[10px] text-center mb-3">
                                <tbody>
                                    <tr>
                                        <td rowSpan="6" className="border border-gray-600 w-1/4 p-1 align-middle">
                                            <img src={LogoOltech} alt="OLTECH" className="mx-auto w-28 object-contain" />
                                        </td>
                                        <td rowSpan="2" className="border border-gray-600 w-2/4 p-1 font-bold text-[11px] uppercase align-middle tracking-wider">
                                            REGISTRO DE EXISTENCIAS - INSUMOS
                                        </td>
                                        <td className="border border-gray-600 w-[12.5%] p-0.5 text-left font-bold bg-gray-50">Código:</td>
                                        <td className="border border-gray-600 w-[12.5%] p-0.5 text-center font-bold">MPA-07-R02</td>
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

                            {/* METADATA DEL REPORTE */}
                            {pagina.isFirst && (
                                <div className="flex justify-between items-end border-b border-gray-300 pb-2 mb-4 text-[10px]">
                                    <div className="space-y-1">
                                        <p><span className="font-bold uppercase">Categoría:</span> {categoria?.nombre || 'General'}</p>
                                        <p><span className="font-bold uppercase">Total Artículos:</span> {consumibles.length}</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p><span className="font-bold uppercase">Fecha de Impresión:</span> {fechaActual}</p>
                                        <p className="italic text-gray-500 text-[9px]">Documento generado desde Almacén OLTECH</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* TABLA DE INVENTARIO */}
                        <div className="w-full flex-1">
                            {pagina.items.length > 0 && (
                                <table className="w-full border-collapse border border-gray-600 text-[9px] mb-2">
                                    <thead className="bg-gray-header">
                                        <tr>
                                            <th className="p-1.5 border border-gray-600 text-center w-8 uppercase">No.</th>
                                            <th className="p-1.5 border border-gray-600 text-left w-28 uppercase">Código</th>
                                            <th className="p-1.5 border border-gray-600 text-left uppercase">Descripción</th>
                                            <th className="p-1.5 border border-gray-600 text-center w-16 uppercase">Unidad</th>
                                            <th className="p-1.5 border border-gray-600 text-center w-20 uppercase">Caducidad</th>
                                            <th className="p-1.5 border border-gray-600 text-center w-16 uppercase">Sist.</th>
                                            <th className="p-1.5 border border-gray-600 text-center w-24 uppercase font-bold">C. Físico</th>
                                            <th className="p-1.5 border border-gray-600 text-left w-32 uppercase">Observaciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagina.items.map((item, localIdx) => {
                                            const globalIndex = consumibles.findIndex(c => c.id === item.id) + 1;
                                            
                                            return (
                                                <tr key={item.id} className="border-b border-gray-600">
                                                    <td className="p-1.5 border border-gray-600 text-center font-mono">{globalIndex}</td>
                                                    <td className="p-1.5 border border-gray-600 font-mono font-bold text-gray-700">{item.codigo_referencia}</td>
                                                    <td className="p-1.5 border border-gray-600 uppercase">{item.nombre}</td>
                                                    <td className="p-1.5 border border-gray-600 text-center">{item.unidad_medida || '-'}</td>
                                                    <td className="p-1.5 border border-gray-600 text-center">
                                                        {/* MODIFICADO: Ya no intentamos parsear la fecha, imprimimos el texto libre */}
                                                        {item.fecha_caducidad ? <span className="font-bold">{item.fecha_caducidad}</span> : '-'}
                                                    </td>
                                                    <td className="p-1.5 border border-gray-600 text-center font-bold bg-gray-50 text-gray-800">{item.cantidad}</td>
                                                    <td className="p-1.5 border border-gray-600 h-8"></td>
                                                    <td className="p-1.5 border border-gray-600 h-8"></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ReporteConsumibles;