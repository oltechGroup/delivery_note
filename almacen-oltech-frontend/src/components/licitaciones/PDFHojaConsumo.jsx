// almacen-oltech-frontend/src/components/licitaciones/PDFHojaConsumo.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../hooks/useAuth';

// IMPORTACIONES ESTÁTICAS DE IMÁGENES
import LogoOltech from '../../assets/logo-name.png';
import FranjaLateral from '../../assets/franja-lateral.png';
import FooterImg from '../../assets/footer.png';

import Hosp1 from '../../assets/hospital-1.png';
import Hosp2 from '../../assets/hospital-2.png';
import Hosp3 from '../../assets/hospital-3.png';
import Hosp4 from '../../assets/hospital-4.png';
import Hosp5 from '../../assets/hospital-5.png';
import Hosp6 from '../../assets/hospital-6.png';
import Hosp7 from '../../assets/hospital-7.png';

function PDFHojaConsumo({ hojaId, onClose }) {
  const { token } = useAuth();
  const [hoja, setHoja] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  const componentRef = useRef(null);

  const handleImprimir = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Hoja_Consumo_${hoja?.folio || 'HRAEI'}`,
  });

  useEffect(() => {
    const cargarDetalleHoja = async () => {
      setCargando(true);
      try {
        const res = await axios.get(`http://localhost:4000/api/licitaciones/hojas-consumo/${hojaId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHoja(res.data);
      } catch (err) {
        console.error('Error al cargar la hoja para impresión:', err);
        setError('No se pudieron cargar los datos de la hoja de consumo.');
      } finally {
        setCargando(false);
      }
    };

    if (hojaId) {
      cargarDetalleHoja();
    }
  }, [hojaId, token]);

  if (error) {
    return (
      <div className="fixed inset-0 z-[10000] bg-gray-900/95 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl text-center max-w-md">
          <p className="text-red-600 font-bold mb-4">{error}</p>
          <button onClick={onClose} className="px-6 py-2 bg-gray-800 text-white rounded-lg font-bold">Cerrar</button>
        </div>
      </div>
    );
  }

  if (cargando || !hoja) {
    return (
      <div className="fixed inset-0 z-[10000] bg-gray-900/95 flex flex-col items-center justify-center text-white">
        <svg className="animate-spin h-12 w-12 text-oltech-pink mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <p className="font-bold text-lg">Preparando documento normativo...</p>
      </div>
    );
  }

  // Ahora permitimos todos los insumos, para mostrar los agregados manualmente
  const insumosMostrar = hoja.detalles;

  const formatoMoneda = (monto) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto || 0);
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    return new Date(fechaStr).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const totalCalculado = insumosMostrar.reduce((acc, curr) => acc + (parseFloat(curr.precio_unitario) * curr.cantidad_utilizada || 0), 0);

  const diccionarioLogos = {
    1: Hosp1, 6: Hosp1, 
    2: Hosp2, 7: Hosp2, 
    3: Hosp3, 8: Hosp3, 
    4: Hosp4, 9: Hosp4, 
    5: Hosp5, 10: Hosp5,
    6: Hosp6, 11: Hosp6,
    7: Hosp7, 12: Hosp7 
  };
  const logoHospital = diccionarioLogos[hoja.ciudad_id] || diccionarioLogos[hoja.unidad_medica_id] || null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center overflow-y-auto pdf-main-overlay">
      
      <style>
        {`
        .hoja-impresion {
          background: white;
          width: 21.59cm;
          min-height: 27.94cm;
          margin: 2rem auto;
          position: relative;
          box-sizing: border-box;
          font-family: Arial, Helvetica, sans-serif;
          overflow: hidden;
        }

        .contenido-hoja { 
          padding: 1.5cm 2.5cm 1.5cm 1.5cm; 
          height: 100%; 
          display: flex; 
          flex-direction: column; 
          position: relative;
          z-index: 10;
        }

        @media print {
          @page { margin: 0; size: letter portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .hoja-impresion {
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always !important;
          }
          .print\\:hidden { display: none !important; }
        }
        `}
      </style>

      {/* CONTROLES SUPERIORES */}
      <div className="sticky top-0 w-full flex justify-center py-4 px-4 bg-gray-900/90 backdrop-blur-sm print:hidden z-[10001] border-b border-gray-700">
        <div className="flex space-x-4">
          <button onClick={onClose} className="bg-white text-gray-800 px-6 py-2.5 rounded-lg font-bold shadow-xl hover:bg-gray-100 transition-transform active:scale-95">
            Cerrar
          </button>
          <button onClick={handleImprimir} className="bg-oltech-pink text-white px-6 py-2.5 rounded-lg font-bold shadow-xl hover:bg-pink-700 flex items-center space-x-2 transition-transform active:scale-95">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            <span>Imprimir Hoja de Consumo</span>
          </button>
        </div>
      </div>

      {/* LIENZO DEL DOCUMENTO */}
      <div ref={componentRef} className="w-full flex flex-col items-center bg-gray-900 sm:bg-transparent overflow-x-auto">
        <div className="hoja-impresion text-black">
          
          {/* BARRA LATERAL DE COLORES */}
          <img 
            src={FranjaLateral} 
            alt="Diseño Lateral" 
            className="absolute right-0 top-0 bottom-0 h-full w-[35px] object-cover z-0" 
          />

          {/* FOOTER ANCLADO ABAJO A LA IZQUIERDA */}
          <div className="absolute bottom-[1.5cm] left-[1.5cm] z-0">
             <img src={FooterImg} alt="Contacto y QR" className="h-16 object-contain" />
          </div>

          <div className="contenido-hoja">
            
            {/* ENCABEZADO: 3 Columnas */}
            <div className="flex justify-between items-center mb-8 w-full">
              <div className="w-1/3 flex justify-start">
                <img src={LogoOltech} alt="OLTECH" className="h-16 object-contain" />
              </div>
              
              <div className="w-1/3 flex justify-center">
                {logoHospital && (
                  /* ============================================================================== */
                  /* AJUSTAR TAMAÑO DEL LOGO AQUÍ                                                   */
                  /* className="h-24" es el actual (Grande).                                        */
                  /* Cámbialo a "h-32" para extra grande o "h-16" para normal.                      */
                  /* ============================================================================== */
                  <img 
                    src={logoHospital} 
                    alt="Hospital" 
                    className="h-24 object-contain"
                    onError={(e) => e.target.style.display = 'none'} 
                  />
                )}
              </div>

              <div className="w-1/3 text-right text-[12px] text-gray-800 leading-snug font-medium">
                <p className="font-bold text-sm mb-1">Folio: <span className="text-red-600">{hoja.folio}</span></p>
                <p className="font-bold">No. Contrato: {hoja.numero_contrato || 'IB/570/2026'}</p>
              </div>
            </div>

            <h2 className="text-xl font-normal mb-4 tracking-wide">INFORMACIÓN</h2>

            {/* DATOS GENERALES (NUEVA REESTRUCTURACIÓN) */}
            <div className="flex flex-col gap-y-2 text-sm mb-8">
              
              {/* LÍNEA 1 */}
              <div className="flex w-full">
                <span className="w-32 font-normal text-gray-600">Clave CIE-10:</span>
                <span className="flex-1 border-b border-gray-300 font-bold uppercase text-gray-700">{hoja.clave_cie_10}</span>
              </div>

              {/* LÍNEA 2 */}
              <div className="flex w-full gap-4">
                <div className="flex flex-1">
                  <span className="w-24 font-normal text-gray-600">Hospital:</span>
                  <span className="flex-1 border-b border-gray-300 font-bold uppercase text-gray-700">{hoja.hospital_nombre}</span>
                </div>
                <div className="flex flex-1">
                  <span className="w-24 font-normal text-gray-600">Clave HRAEI:</span>
                  <span className="flex-1 border-b border-gray-300 font-bold uppercase text-gray-700">{hoja.clave_hraei}</span>
                </div>
              </div>

              {/* LÍNEA 3 */}
              <div className="flex w-full">
                <span className="w-32 font-normal text-gray-600">Fecha de CX:</span>
                <span className="flex-1 border-b border-gray-300 font-bold text-gray-700">{formatearFecha(hoja.fecha_creacion)}</span>
              </div>

              {/* LÍNEA 4 */}
              <div className="flex w-full gap-4">
                <div className="flex flex-1">
                  <span className="w-24 font-normal text-gray-600">Doctor:</span>
                  <span className="flex-1 border-b border-gray-300 font-bold uppercase text-gray-700">{hoja.nombre_medico_adscrito || hoja.medico_tratante_nombre}</span>
                </div>
                <div className="flex flex-1">
                  <span className="w-24 font-normal text-gray-600">Técnico:</span>
                  <span className="flex-1 border-b border-gray-300 font-bold uppercase text-gray-700">{hoja.tecnico_nombre_manual || hoja.tecnico_nombre || 'N/A'}</span>
                </div>
              </div>

              {/* LÍNEA 5 */}
              <div className="flex w-full gap-4">
                <div className="flex flex-1">
                  <span className="w-24 font-normal text-gray-600">Paciente:</span>
                  <span className="flex-1 border-b border-gray-300 font-bold uppercase text-gray-700">{hoja.paciente}</span>
                </div>
                <div className="flex flex-1">
                  <span className="w-24 font-normal text-gray-600">CURP:</span>
                  <span className="flex-1 border-b border-gray-300 font-bold uppercase text-gray-700 font-mono tracking-widest">{hoja.curp}</span>
                </div>
              </div>

            </div>

            <h2 className="text-xl font-normal mb-3 tracking-wide">CONSUMO</h2>

            {/* TABLA DE MATERIALES */}
            <div className="mb-6">
              <table className="w-full text-xs border border-gray-300">
                <thead className="bg-gray-100 border-b border-gray-300 text-left">
                  <tr>
                    <th className="p-2 border-r border-gray-300 font-normal w-24">Código</th>
                    <th className="p-2 border-r border-gray-300 font-normal">Descripción</th>
                    <th className="p-2 border-r border-gray-300 font-normal text-center w-12">Qty</th>
                    <th className="p-2 border-r border-gray-300 font-normal text-right w-20">P.U</th>
                    <th className="p-2 font-normal text-right w-24">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {insumosMostrar.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="p-2 border-r border-gray-300 text-gray-600">
                        {item.pieza_codigo || item.codigo_catalogo || item.set_codigo || '-'}
                      </td>
                      <td className="p-2 border-r border-gray-300 uppercase text-gray-800 font-medium">
                        {item.pieza_descripcion || item.nombre_catalogo || item.set_descripcion || item.descripcion_externa || item.descripcion_custom}
                      </td>
                      <td className="p-2 border-r border-gray-300 text-center">{item.cantidad_utilizada}</td>
                      <td className="p-2 border-r border-gray-300 text-right">{formatoMoneda(item.precio_unitario)}</td>
                      <td className="p-2 text-right text-gray-800">{formatoMoneda(item.cantidad_utilizada * item.precio_unitario)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="3" className="p-2 border-r border-gray-300 bg-gray-50"></td>
                    <td className="p-2 border-r border-gray-300 text-right font-normal bg-gray-50">Total</td>
                    <td className="p-2 text-right font-bold bg-gray-50 text-gray-900">{formatoMoneda(totalCalculado)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-xl font-normal mb-2 tracking-wide">NOTAS:</h2>
            <div className="border-b-2 border-gray-800 mb-6 mt-6 w-full"></div>
            <div className="border-b-2 border-gray-800 mb-6 mt-6 w-full"></div>

            {/* SECCIÓN DE FIRMAS */}
            <div className="mt-16 flex justify-center text-center text-sm">
              <div className="w-80">
                <div className="border-b border-black mb-2 h-10"></div>
                <p className="font-medium mt-2">Dr. {hoja.nombre_medico_adscrito || '_________________________'}</p>
                <p className="text-gray-700">MÉDICO ADSCRITO</p>
              </div>
            </div>

            <div className="pb-16"></div> 
          </div>
        </div>
      </div>
    </div>
  );
}

export default PDFHojaConsumo;