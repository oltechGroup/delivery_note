// almacen-oltech-frontend/src/components/licitaciones/PDFHojaConsumo.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../hooks/useAuth';
import LogoOltech from '../../assets/Logo acostado.png';

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

  // Filtrar insumos externos: La licitación no debe ver materiales comprados por fuera.
  const insumosOficiales = hoja.detalles.filter(d => !d.es_insumo_externo);

  // Formateador de moneda
  const formatoMoneda = (monto) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto || 0);

  // Formateador de fecha
  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return '';
    return new Date(fechaStr).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  };

  const totalCalculado = insumosOficiales.reduce((acc, curr) => acc + (parseFloat(curr.precio_unitario) * curr.cantidad_utilizada || 0), 0);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex flex-col items-center overflow-y-auto pdf-main-overlay">
      
      <style>
        {`
        .hoja-impresion {
          background: white;
          width: 21.59cm;
          min-height: 27.94cm;
          padding: 1.5cm;
          margin: 2rem auto;
          box-shadow: 0 0 40px rgba(0,0,0,0.6);
          position: relative;
          flex-shrink: 0;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }

        @media print {
          @page { margin: 0; size: letter portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .hoja-impresion {
            margin: 0 !important;
            padding: 1.2cm 1.5cm !important;
            width: 21.59cm !important;
            height: 27.94cm !important;
            box-shadow: none !important;
            page-break-after: always !important;
          }
          .hoja-impresion:last-child { page-break-after: auto !important; }
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
            <span>Imprimir Hoja HRAEI</span>
          </button>
        </div>
      </div>

      {/* LIENZO DEL DOCUMENTO */}
      <div ref={componentRef} className="w-full flex flex-col items-center bg-gray-900 sm:bg-transparent overflow-x-auto">
        <div className="hoja-impresion text-black text-xs font-sans">
          
          {/* ENCABEZADO OFICIAL */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
            <img src={LogoOltech} alt="OLTECH" className="w-40 object-contain" />
            <div className="text-right">
              <h1 className="text-[13px] font-black uppercase tracking-wide">Reporte de Consumo Quirúrgico</h1>
              <h2 className="text-[10px] font-bold text-gray-600 uppercase">Sistemas de Osteosíntesis y Endoprótesis</h2>
              <p className="text-[11px] font-bold mt-2">FOLIO: <span className="text-red-600 font-mono text-sm">{hoja.folio}</span></p>
              <p className="text-[9px] mt-1">Fecha de Emisión: {formatearFecha(hoja.fecha_creacion)}</p>
            </div>
          </div>

          {/* DATOS CLÍNICOS Y NORMATIVOS */}
          <div className="border border-black rounded-lg p-3 mb-4 bg-gray-50/50">
            <div className="grid grid-cols-12 gap-x-2 gap-y-3 text-[10px]">
              <div className="col-span-8">
                <span className="font-bold uppercase text-gray-600">Nombre del Paciente:</span>
                <div className="font-black uppercase text-xs border-b border-gray-400">{hoja.paciente}</div>
              </div>
              <div className="col-span-4">
                <span className="font-bold uppercase text-gray-600">CURP:</span>
                <div className="font-black uppercase text-xs border-b border-gray-400 font-mono">{hoja.curp}</div>
              </div>

              <div className="col-span-6">
                <span className="font-bold uppercase text-gray-600">Hospital / Sede:</span>
                <div className="font-bold uppercase border-b border-gray-400">{hoja.hospital_nombre}</div>
              </div>
              <div className="col-span-6">
                <span className="font-bold uppercase text-gray-600">No. de Contrato / Convenio:</span>
                <div className="font-bold uppercase border-b border-gray-400">{hoja.numero_contrato}</div>
              </div>

              <div className="col-span-4">
                <span className="font-bold uppercase text-gray-600">Clave HRAEI:</span>
                <div className="font-bold uppercase border-b border-gray-400">{hoja.clave_hraei}</div>
              </div>
              <div className="col-span-4">
                <span className="font-bold uppercase text-gray-600">Clave CIE-10:</span>
                <div className="font-bold uppercase border-b border-gray-400">{hoja.clave_cie_10}</div>
              </div>
              <div className="col-span-4">
                <span className="font-bold uppercase text-gray-600">No. de Renglón:</span>
                <div className="font-bold uppercase border-b border-gray-400">{hoja.numero_renglon || 'N/A'}</div>
              </div>

              <div className="col-span-12">
                <span className="font-bold uppercase text-gray-600">Tipo de Cirugía Realizada:</span>
                <div className="font-bold uppercase border-b border-gray-400">{hoja.tipo_cirugia || 'NO ESPECIFICADA'}</div>
              </div>
            </div>
          </div>

          {/* TABLA DE MATERIALES EMPLEADOS */}
          <div className="flex-1">
            <h3 className="text-[10px] font-black uppercase mb-1 bg-black text-white px-2 py-1 inline-block">Material Empleado</h3>
            <table className="w-full border-collapse border border-black text-[9px] text-center">
              <thead className="bg-gray-200 font-bold uppercase">
                <tr>
                  <th className="border border-black p-1 w-8">Cant.</th>
                  <th className="border border-black p-1 w-12">Und.</th>
                  <th className="border border-black p-1">Descripción del Bien / Servicio</th>
                  <th className="border border-black p-1 w-20">Lote</th>
                  <th className="border border-black p-1 w-16">Caduc.</th>
                  <th className="border border-black p-1 w-20">C. Unitario</th>
                  <th className="border border-black p-1 w-20">Monto</th>
                </tr>
              </thead>
              <tbody>
                {insumosOficiales.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-black p-1.5 font-bold">{item.cantidad_utilizada}</td>
                    <td className="border border-black p-1.5">{item.unidad_medida}</td>
                    <td className="border border-black p-1.5 text-left uppercase font-bold">
                      {item.pieza_descripcion || item.nombre_catalogo || item.set_descripcion}
                      {item.marca && <div className="text-[8px] font-normal italic text-gray-600">Marca: {item.marca}</div>}
                    </td>
                    <td className="border border-black p-1.5 font-mono">{item.lote || 'N/A'}</td>
                    <td className="border border-black p-1.5">{item.fecha_caducidad || 'N/A'}</td>
                    <td className="border border-black p-1.5">{formatoMoneda(item.precio_unitario)}</td>
                    <td className="border border-black p-1.5 font-bold bg-gray-50">{formatoMoneda(item.cantidad_utilizada * item.precio_unitario)}</td>
                  </tr>
                ))}
                {/* Fila de Total */}
                <tr className="bg-gray-200">
                  <td colSpan="6" className="border border-black p-1.5 text-right font-black uppercase">Subtotal / Monto Total de los Sistemas:</td>
                  <td className="border border-black p-1.5 font-black text-[11px]">{formatoMoneda(totalCalculado)}</td>
                </tr>
              </tbody>
            </table>
            
            {/* ÁREA DE ETIQUETAS */}
            <div className="mt-4 border-2 border-dashed border-gray-400 p-2 min-h-[100px] flex items-center justify-center rounded bg-gray-50/50">
              <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest text-center">
                [ Espacio reservado para adherir las etiquetas físicas de los productos utilizados ]<br/>
                <span className="font-normal text-[8px] lowercase">(Requerido para la validación de uso y comprobación para pago)</span>
              </span>
            </div>
          </div>

          {/* SECCIÓN DE FIRMAS Y VALIDACIÓN */}
          <div className="mt-auto pt-6">
            <p className="text-[8px] text-justify font-medium mb-8 leading-tight">
              Bajo protesta de decir verdad, los firmantes certifican que los materiales descritos en este documento fueron suministrados y utilizados en su totalidad en el procedimiento quirúrgico del paciente mencionado. Este formato se expide para los fines administrativos y legales correspondientes, conforme a lo dispuesto en la normativa de Compras MX.
            </p>

            <div className="grid grid-cols-3 gap-6 text-center text-[10px] font-bold">
              
              <div className="flex flex-col items-center justify-end">
                <div className="w-full border-b border-black mb-1 h-12"></div>
                <p className="uppercase">{hoja.nombre_medico_adscrito || 'MÉDICO ADSCRITO'}</p>
                <p className="text-[8px] font-normal">Médico Adscrito / Tratante</p>
              </div>

              <div className="flex flex-col items-center justify-end">
                <div className="w-full border-b border-black mb-1 h-12"></div>
                <p className="uppercase">{hoja.jefe_servicio || 'JEFE DE SERVICIO'}</p>
                <p className="text-[8px] font-normal">Jefe de Servicio de Traumatología y Ortopedia</p>
              </div>

              <div className="flex flex-col items-center justify-end">
                <div className="w-full border-b border-black mb-1 h-12"></div>
                <p className="uppercase">{hoja.encargado_nombre || '__________________________'}</p>
                <p className="text-[8px] font-normal">Validación OLTECH S.A. de C.V.</p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default PDFHojaConsumo;