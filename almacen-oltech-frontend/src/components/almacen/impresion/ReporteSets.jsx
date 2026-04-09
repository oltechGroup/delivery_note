// almacen-oltech-frontend/src/components/almacen/impresion/ReporteSets.jsx
import { useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import LogoOltech from '../../../assets/Logo acostado.png';

function ReporteSets({ categoria, dataReporte, onClose }) {
    const componentRef = useRef(null);

    const fechaActual = new Date().toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const handleImprimir = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Reporte_Existencias_Sets_${categoria?.nombre || 'General'}`,
    });

    // ==========================================
    // MOTOR DE PAGINACIÓN INTELIGENTE (POR PESO)
    // ==========================================
    const paginas = useMemo(() => {
        if (!dataReporte || dataReporte.length === 0) return [];

        const todasLasFilas = [];
        dataReporte.forEach(grupo => {
            // Le damos más "peso" al encabezado del Set porque es más alto
            todasLasFilas.push({ type: 'SET_HEADER', data: grupo, peso: 1.5 });
            if (grupo.piezas.length === 0) {
                todasLasFilas.push({ type: 'EMPTY_MSG', data: null, peso: 1 });
            } else {
                grupo.piezas.forEach(p => {
                    todasLasFilas.push({ type: 'PIEZA', data: p, peso: 1 });
                });
            }
        });

        const paginasCalculadas = [];
        let indexActual = 0;
        let isFirst = true;

        // LÍMITES CALIBRADOS (Ajustado la primera hoja para quitar el hueco gigante)
        const PESO_MAX_PRIMERA_HOJA = 22; // <-- Subimos de 18 a 22 para que se llene mejor
        const PESO_MAX_HOJA_MEDIA = 24;   
        const PESO_MAX_ULTIMA_HOJA = 14;  

        while (indexActual < todasLasFilas.length) {
            let pesoAcumulado = 0;
            let itemsPagina = [];
            
            let limitePeso = isFirst ? PESO_MAX_PRIMERA_HOJA : PESO_MAX_HOJA_MEDIA;

            // Verificamos si lo que queda cabe en la hoja final con firmas
            let pesoRestante = 0;
            for (let i = indexActual; i < todasLasFilas.length; i++) {
                pesoRestante += todasLasFilas[i].peso;
            }
            if (pesoRestante <= PESO_MAX_ULTIMA_HOJA) {
                limitePeso = PESO_MAX_ULTIMA_HOJA;
            }

            while (indexActual < todasLasFilas.length && pesoAcumulado + todasLasFilas[indexActual].peso <= limitePeso) {
                itemsPagina.push(todasLasFilas[indexActual]);
                pesoAcumulado += todasLasFilas[indexActual].peso;
                indexActual++;
            }

            if (itemsPagina.length === 0 && indexActual < todasLasFilas.length) {
                 itemsPagina.push(todasLasFilas[indexActual]);
                 indexActual++;
            }

            const esRealmenteLaUltima = indexActual >= todasLasFilas.length;

            paginasCalculadas.push({ 
                items: itemsPagina, 
                isFirst: isFirst, 
                isLast: esRealmenteLaUltima 
            });

            isFirst = false;
        }

        return paginasCalculadas;
    }, [dataReporte]);

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
                    overflow: hidden; /* Mantiene limpia la vista previa */
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
                    /* Forzamos colores corporativos en el PDF */
                    .bg-oltech-dark { background-color: #1f2937 !important; color: white !important; }
                    .bg-gray-header { background-color: #f3f4f6 !important; }
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

            {/* LIENZO DE HOJAS: Solo el ref y el flex, sin clases raras */}
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
                                            REGISTRO DE EXISTENCIAS - EQUIPOS Y SETS
                                        </td>
                                        <td className="border border-gray-600 w-[12.5%] p-0.5 text-left font-bold bg-gray-50">Código:</td>
                                        <td className="border border-gray-600 w-[12.5%] p-0.5 text-center font-bold">MPA-07-R01</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-gray-600 p-0.5 text-left font-bold bg-gray-50">Revisión:</td>
                                        <td className="border border-gray-600 p-0.5 text-center font-bold">02</td>
                                    </tr>
                                    <tr>
                                        <td rowSpan="1" className="border border-gray-600 p-1 font-bold text-[10px] uppercase">OLTECH, S.A. DE C.V.</td>
                                        <td className="border border-gray-600 p-0.5 text-left font-bold bg-gray-50">Emisión:</td>
                                        <td className="border border-gray-600 p-0.5 text-center">01/ABR/2026</td>
                                    </tr>
                                    <tr>
                                        <td rowSpan="3" className="border border-gray-600 p-1 text-center text-[8px] leading-tight">
                                            <span className="font-bold">SUSTITUYE A:</span> NUEVO<br/>
                                            Referencia a la norma ISO 9001:2015<br/>
                                        </td>
                                        <td className="border border-gray-600 p-0.5 text-left font-bold bg-gray-50">Vigencia:</td>
                                        <td className="border border-gray-600 p-0.5 text-center">01/ABR/2029</td>
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
                                        <p><span className="font-bold uppercase">Total Equipos listados:</span> {dataReporte.length}</p>
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
                                <table className="w-full border-collapse border border-gray-600 text-[9px] mb-8">
                                    <thead className="bg-gray-header">
                                        <tr>
                                            <th className="p-1.5 border border-gray-600 text-left w-28 uppercase">Código</th>
                                            <th className="p-1.5 border border-gray-600 text-left uppercase">Descripción de Pieza / Insumo</th>
                                            <th className="p-1.5 border border-gray-600 text-center w-16 uppercase">Unidad</th>
                                            <th className="p-1.5 border border-gray-600 text-center w-16 uppercase">Sist.</th>
                                            <th className="p-1.5 border border-gray-600 text-center w-24 uppercase font-bold">C. Físico</th>
                                            <th className="p-1.5 border border-gray-600 text-left w-32 uppercase">Observaciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagina.items.map((fila, idx) => {
                                            if (fila.type === 'SET_HEADER') {
                                                return (
                                                    <tr key={`row-${idx}`} className="bg-oltech-dark text-white font-bold">
                                                        <td colSpan="6" className="p-1.5 border border-gray-600 uppercase tracking-wide">
                                                            📦 {fila.data.setCodigo} | {fila.data.setDescripcion}
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                            if (fila.type === 'EMPTY_MSG') {
                                                return (
                                                    <tr key={`row-${idx}`}>
                                                        <td colSpan="6" className="p-1.5 border border-gray-600 text-center italic text-gray-400">
                                                            (Equipo vacío - Sin piezas registradas)
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                            // Tipo PIEZA
                                            return (
                                                <tr key={`row-${idx}`} className="border-b border-gray-600">
                                                    <td className="p-1.5 border border-gray-600 font-mono font-bold text-gray-700">↳ {fila.data.pieza_codigo}</td>
                                                    <td className="p-1.5 border border-gray-600 uppercase">{fila.data.pieza_descripcion}</td>
                                                    <td className="p-1.5 border border-gray-600 text-center">{fila.data.unidad_medica || 'PZA'}</td>
                                                    <td className="p-1.5 border border-gray-600 text-center font-bold bg-gray-50 text-gray-800">{fila.data.cantidad_pieza}</td>
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

export default ReporteSets;