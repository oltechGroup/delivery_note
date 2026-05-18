//almacen-oltech-frontend/src/components/almacen/impresion/EtiquetasSets.jsx
import { useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import Barcode from 'react-barcode';

function EtiquetasSets({ categoria, sets, onClose }) {
    const componentRef = useRef(null);

    const handleImprimir = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Etiquetas_Sets_${categoria?.nombre || 'General'}`,
    });

    // Paginación: Dependerá del tamaño de papel adhesivo. 
    // Usaremos un formato estándar: 3 columnas, varias filas. 
    // Caben aproximadamente 24 etiquetas (3x8) en una hoja carta normal.
    const ETIQUETAS_POR_PAGINA = 24;

    const paginas = useMemo(() => {
        if (!sets || sets.length === 0) return [];
        const paginasCalculadas = [];
        for (let i = 0; i < sets.length; i += ETIQUETAS_POR_PAGINA) {
            paginasCalculadas.push(sets.slice(i, i + ETIQUETAS_POR_PAGINA));
        }
        return paginasCalculadas;
    }, [sets]);

    return (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center overflow-y-auto pdf-main-overlay">
            
            <style>
                {`
                .hoja-impresion {
                    background: white;
                    width: 21.59cm;
                    height: 27.94cm;
                    padding: 1.2cm;
                    margin: 2rem auto;
                    box-shadow: 0 0 40px rgba(0,0,0,0.6);
                    position: relative;
                    flex-shrink: 0;
                    box-sizing: border-box;
                }

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
                        padding: 1.2cm !important;
                        width: 21.59cm !important;
                        height: 27.94cm !important;
                        box-shadow: none !important;
                        border: none !important;
                        page-break-after: always !important;
                        page-break-inside: avoid !important;
                    }
                    .hoja-impresion:last-child {
                        page-break-after: auto !important;
                    }
                }
                `}
            </style>

            {/* CONTROLES FLOTANTES */}
            <div className="sticky top-0 w-full flex justify-center py-3 sm:py-4 px-4 bg-gray-900/50 backdrop-blur-sm print:hidden z-[10001] shrink-0 border-b border-gray-700/50">
                <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-4">
                    <button onClick={onClose} className="w-full sm:w-auto bg-white text-gray-800 px-8 py-2.5 rounded-lg font-bold shadow-xl hover:bg-gray-100 transition-all active:scale-95 flex justify-center">
                        Cerrar Vista
                    </button>
                    <button onClick={handleImprimir} className="w-full sm:w-auto bg-oltech-pink text-white px-8 py-2.5 rounded-lg font-bold shadow-xl hover:bg-pink-700 flex items-center justify-center space-x-2 transition-all active:scale-95">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        <span>Imprimir Etiquetas</span>
                    </button>
                </div>
            </div>

            {/* LIENZO DE HOJAS */}
            <div ref={componentRef} className="w-full flex flex-col items-center bg-gray-900 sm:bg-white overflow-x-auto">
                {paginas.map((paginaItems, index) => (
                    <div key={index} className="hoja-impresion">
                        <div className="grid grid-cols-3 gap-x-4 gap-y-4 h-full content-start">
                            {paginaItems.map((item) => (
                                <div key={item.id} className="border-2 border-dashed border-gray-500 p-2 flex flex-col items-center justify-center text-center h-[2.8cm] overflow-hidden">
                                    <p className="text-[10px] font-bold text-gray-800 leading-tight line-clamp-1 w-full mb-1 shrink-0">
                                        {item.descripcion}
                                    </p>
                                    <div className="w-full flex justify-center items-center overflow-hidden [&>svg]:max-w-full [&>svg]:h-auto">
                                        <Barcode 
                                            value={item.codigo} 
                                            width={1.2} 
                                            height={35} 
                                            fontSize={10} 
                                            margin={0}
                                            displayValue={true} 
                                        />
                                    </div>
                                    <p className="text-[8px] text-gray-500 mt-0.5 font-bold uppercase shrink-0">
                                        EQUIPO / SET
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default EtiquetasSets;