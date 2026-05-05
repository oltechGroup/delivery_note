// almacen-oltech-frontend/src/pages/NuevaCotizacion.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

// Importamos la imagen del membrete
import bgCotizacion from '../assets/cotizaciones.jpeg';

function NuevaCotizacion() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  
  // ESTADO DE FECHA (Modificable)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  
  const [clienteTexto, setClienteTexto] = useState('');
  const [firmaSeleccionada, setFirmaSeleccionada] = useState('');
  const [firmas, setFirmas] = useState([]);
  const [detalles, setDetalles] = useState([]);

  // ESTADOS PARA SOBRESCRIBIR TOTALES (Modo Natural)
  const [subtotalEscrito, setSubtotalEscrito] = useState('');
  const [ivaEscrito, setIvaEscrito] = useState('');
  const [totalEscrito, setTotalEscrito] = useState('');

  useEffect(() => {
    const cargarFirmas = async () => {
      try {
        const res = await axios.get('http://localhost:4000/api/cotizaciones/firmas', { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setFirmas(res.data);
      } catch (err) {
        console.error("Error al cargar firmas:", err);
      }
    };
    cargarFirmas();
  }, [token]);

  const agregarFilaManual = () => {
    const nuevoDetalle = {
      id_temp: Date.now() + Math.random(),
      partida: detalles.length + 1, // Sugerimos un número consecutivo por defecto, pero ahora es editable
      descripcion: '', 
      unidad: 'PIEZA',
      cantidad: 1,
      precio_unitario: 0,
      importe: 0
    };
    setDetalles(prev => [...prev, nuevoDetalle]);
  };

  const actualizarCampoDetalle = (id_temp, campo, valor) => {
    setDetalles(prev => prev.map(d => {
      if (d.id_temp === id_temp) {
        const nuevoD = { ...d, [campo]: valor };
        if (campo === 'cantidad' || campo === 'precio_unitario') {
          const cant = parseFloat(nuevoD.cantidad) || 0;
          const precio = parseFloat(nuevoD.precio_unitario) || 0;
          nuevoD.importe = cant * precio;
        }
        return nuevoD;
      }
      return d;
    }));
  };

  const quitarFila = (id_temp) => {
    setDetalles(prev => prev.filter(d => d.id_temp !== id_temp));
  };

  // CÁLCULOS AUTOMÁTICOS
  const subtotalAuto = detalles.reduce((sum, item) => sum + (parseFloat(item.importe) || 0), 0);
  const ivaAuto = subtotalAuto * 0.16;
  const totalAuto = subtotalAuto + ivaAuto;

  // LÓGICA DE TOTALES
  const desformatearDinero = (textoMoneda) => {
    if (!textoMoneda) return 0;
    const num = parseFloat(textoMoneda.replace(/[^0-9.-]+/g, ""));
    return isNaN(num) ? 0 : num;
  };

  const subtotalMostrar = subtotalEscrito !== '' ? subtotalEscrito : new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(subtotalAuto);
  const ivaMostrar = ivaEscrito !== '' ? ivaEscrito : new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(ivaAuto);
  const totalMostrar = totalEscrito !== '' ? totalEscrito : new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalAuto);

  const subtotalParaBD = subtotalEscrito !== '' ? desformatearDinero(subtotalEscrito) : subtotalAuto;
  const ivaParaBD = ivaEscrito !== '' ? desformatearDinero(ivaEscrito) : ivaAuto;
  const totalParaBD = totalEscrito !== '' ? desformatearDinero(totalEscrito) : totalAuto;

  const formatearDinero = (monto) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);
  
  const formatearFechaLarga = (fechaString) => {
    if (!fechaString) return '';
    const [year, month, day] = fechaString.split('-');
    const fechaObj = new Date(year, month - 1, day);
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return fechaObj.toLocaleDateString('es-MX', opciones);
  };

  const handleGuardarCotizacion = async () => {
    if (!clienteTexto.trim()) return setError('Debes ingresar los datos del cliente.');
    if (detalles.length === 0) return setError('Debes agregar al menos un material.');
    if (detalles.some(d => d.descripcion.trim() === '')) return setError('Todas las partidas deben tener una descripción.');
    if (!firmaSeleccionada) return setError('Debes seleccionar la firma.');

    setCargando(true);
    setError('');

    try {
      await axios.post('http://localhost:4000/api/cotizaciones', {
        fecha, 
        cliente_texto: clienteTexto.toUpperCase(),
        subtotal: subtotalParaBD, 
        iva: ivaParaBD,
        total: totalParaBD,
        firma_id: parseInt(firmaSeleccionada),
        detalles: detalles.map((d, index) => ({
          partida: parseInt(d.partida) || (index + 1), // Aseguramos mandar la partida escrita o un respaldo
          descripcion: d.descripcion.toUpperCase(), 
          unidad: d.unidad.toUpperCase(),
          cantidad: parseInt(d.cantidad) || 0,
          precio_unitario: parseFloat(d.precio_unitario) || 0,
          importe: parseFloat(d.importe) || 0
        }))
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert('¡Cotización guardada exitosamente!');
      navigate('/cotizaciones'); 
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al guardar.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen pb-12 pt-4 px-2 sm:px-4 animate-in fade-in duration-300 relative z-0">
      
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;1,400&display=swap');
          
          .evitar-corte {
              break-inside: avoid;
          }
          
          .escritorio-vista {
              display: flex;
              justify-content: center;
              width: 100%;
              padding-bottom: 2rem;
              position: relative;
          }
          
          .lienzo-documento {
              width: 19.03cm;
              min-height: 25.58cm;
              background-color: transparent; 
              position: relative;
              z-index: 10;
              text-align: left;
              padding-bottom: 2rem;
          }

          .fondo-pantalla-fijo {
              position: absolute;
              top: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 19.03cm;
              height: 25.58cm;
              background-image: url(${bgCotizacion});
              background-size: 19.03cm 25.58cm;
              background-repeat: no-repeat;
              box-shadow: 0 20px 50px rgba(0,0,0,0.15);
              z-index: 5;
              pointer-events: none; 
          }
          
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
            .escritorio-vista { display: block !important; overflow: visible !important; }
            
            .fondo-pantalla-fijo { display: none !important; } 

            .lienzo-documento {
              margin: 0 !important;
              width: 19.03cm !important;
              min-height: 100% !important; 
              box-shadow: none !important;
              background-image: none !important; 
              background-color: transparent !important;
            }
            
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

            .no-print { display: none !important; }
          }
        `}
      </style>

      {/* BARRA SUPERIOR CON FECHA MODIFICABLE */}
      <div className="max-w-[22cm] mx-auto bg-white p-3 sm:p-4 rounded-xl shadow-md border border-gray-200 flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 static sm:sticky top-2 sm:top-4 z-50 gap-4 sm:gap-0">
        <button onClick={() => navigate('/cotizaciones')} className="w-full sm:w-auto text-gray-500 hover:text-oltech-black font-bold text-sm flex items-center transition-colors">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Volver
        </button>
        
        <h1 className="text-base sm:text-lg font-bold text-oltech-black hidden sm:block">📝 Creador de Cotizaciones</h1>
        
        <div className="flex flex-col sm:flex-row items-center w-full sm:w-auto gap-3">
          <div className="flex items-center space-x-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200 w-full sm:w-auto justify-center">
            <span className="text-xs font-bold text-gray-500 uppercase">Fecha:</span>
            <input 
              type="date" 
              value={fecha} 
              onChange={(e) => setFecha(e.target.value)} 
              className="bg-transparent border-none outline-none text-sm font-bold text-gray-700 cursor-pointer"
            />
          </div>
          <button onClick={handleGuardarCotizacion} disabled={cargando} className="w-full sm:w-auto bg-oltech-black text-white px-6 py-2 rounded-lg font-bold shadow-md hover:bg-gray-800 disabled:opacity-50">
            {cargando ? 'Guardando...' : 'Guardar Cotización'}
          </button>
        </div>
      </div>

      {error && <div className="max-w-[22cm] mx-auto bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 font-medium mb-4">{error}</div>}

      {/* BARRA DE HERRAMIENTAS */}
      <div className="max-w-[22cm] mx-auto bg-gray-800 p-4 rounded-xl shadow-lg mb-6 flex flex-col sm:flex-row justify-between items-center relative z-40 gap-4 sm:gap-0">
        <div className="flex items-center space-x-4">
          <h3 className="text-white text-xs sm:text-sm font-bold uppercase text-oltech-pink">Paso 1. Agrega partidas</h3>
        </div>
        <button onClick={agregarFilaManual} className="w-full sm:w-auto bg-white text-oltech-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 shadow-sm">+ Agregar Fila Manual</button>
      </div>

      {/* CONTENEDOR DE VISTA PREVIA */}
      <div className="escritorio-vista">
        
        <div className="fondo-pantalla-fijo"></div>

        <div className="lienzo-documento text-black font-['Lato',_sans-serif] leading-tight">
          
          <div className="fondo-fijo-pdf" style={{ display: 'none' }}></div>

          <table className="w-full h-full border-collapse">
            <thead className="bg-transparent border-0">
                <tr><td className="h-[2.8cm] border-0 p-0 m-0"></td></tr>
            </thead>

            <tfoot className="bg-transparent border-0">
                <tr><td className="h-[2.5cm] border-0 p-0 m-0"></td></tr>
            </tfoot>

            <tbody className="border-0">
                <tr>
                    <td className="border-0 px-[1.5cm] align-top bg-white/60 backdrop-blur-[2px] rounded-lg">
                        
                        <div className="text-right mb-2 text-[9pt] font-medium pt-2">Ixtapaluca, Estado de México a {formatearFechaLarga(fecha)}</div>

                        <div className="mb-2">
                            <textarea value={clienteTexto} onChange={(e) => setClienteTexto(e.target.value)}
                                className="w-1/2 min-h-[80px] p-2 bg-yellow-50/40 border border-dashed border-gray-400 outline-none focus:border-oltech-pink resize-none font-bold uppercase text-[9pt] leading-snug"
                                placeholder="DATOS DEL CLIENTE..." />
                        </div>

                        <div className="mb-2 text-justify text-[9pt]">Reciba un cordial saludo por mi representada OLTECH S.A. DE C.V., nos es grato presentar ante usted la siguiente cotización.</div>

                        {/* TABLA PRODUCTOS */}
                        <div className="mb-1">
                            <table className="w-full border-collapse border border-black text-[8pt] bg-white/95">
                                <thead className="font-bold bg-[#b4c6e7]">
                                    <tr>
                                        <th className="border border-black p-1 w-10">PARTIDA</th>
                                        <th className="border border-black p-1">DESCRIPCIÓN</th>
                                        <th className="border border-black p-1 w-16">UNIDAD</th>
                                        <th className="border border-black p-1 w-14">CANTIDAD</th>
                                        <th className="border border-black p-1 w-20">PRECIO UNITARIO</th>
                                        <th className="border border-black p-1 w-20">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detalles.length === 0 ? (
                                        <tr><td colSpan="6" className="border border-black p-4 text-center italic text-gray-500 bg-white">Agrega filas para comenzar...</td></tr>
                                    ) : (
                                        detalles.map((d) => (
                                            <tr key={d.id_temp} className="group bg-white evitar-corte">
                                                {/* PARTIDA EDITABLE AQUÍ */}
                                                <td className="border border-black p-1 text-center font-bold align-top">
                                                    <input 
                                                      type="number" 
                                                      value={d.partida} 
                                                      onChange={(e) => actualizarCampoDetalle(d.id_temp, 'partida', e.target.value)} 
                                                      className="w-full text-center bg-transparent outline-none mt-1.5 font-bold" 
                                                    />
                                                </td>
                                                <td className="border border-black p-1 uppercase">
                                                    <textarea value={d.descripcion} onChange={(e) => actualizarCampoDetalle(d.id_temp, 'descripcion', e.target.value)}
                                                        className="w-full min-h-[35px] bg-transparent outline-none uppercase resize-none leading-tight" rows="2" />
                                                </td>
                                                <td className="border border-black p-1 text-center align-top">
                                                    <input type="text" value={d.unidad} onChange={(e) => actualizarCampoDetalle(d.id_temp, 'unidad', e.target.value)} className="w-full text-center bg-transparent outline-none uppercase mt-1.5" />
                                                </td>
                                                <td className="border border-black p-1 text-center align-top">
                                                    <input type="number" value={d.cantidad} onChange={(e) => actualizarCampoDetalle(d.id_temp, 'cantidad', e.target.value)} className="w-full text-center bg-transparent outline-none mt-1.5" />
                                                </td>
                                                <td className="border border-black p-1 text-right align-top">
                                                    <div className="flex items-center justify-end mt-1.5"><span>$</span><input type="number" step="0.01" value={d.precio_unitario} onChange={(e) => actualizarCampoDetalle(d.id_temp, 'precio_unitario', e.target.value)} className="w-[80%] text-right bg-transparent outline-none" /></div>
                                                </td>
                                                <td className="border border-black p-1 text-right align-top"><div className="mt-1">{formatearDinero(d.importe)}</div></td>
                                                <td className="border-0 p-1 absolute right-[-30px]"><button onClick={() => quitarFila(d.id_temp)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 bg-white rounded-full">✖</button></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* TOTALES CON EDICIÓN NATURAL DIRECTA */}
                        <div className="flex justify-end w-full mb-4 evitar-corte">
                            <table className="border-collapse border border-black text-[8pt] bg-white/95 w-[40%] mt-[-1px]">
                                <tbody>
                                    <tr>
                                      <td className="border border-black p-1 text-center font-bold">SUBTOTAL</td>
                                      <td className="border border-black p-0 text-right font-bold hover:bg-yellow-50 transition-colors">
                                        <input 
                                          type="text" 
                                          value={subtotalMostrar} 
                                          onChange={e => setSubtotalEscrito(e.target.value)} 
                                          placeholder={formatearDinero(subtotalAuto)}
                                          className="w-full h-full p-1 text-right bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-oltech-pink font-bold" 
                                        />
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="border border-black p-1 text-center font-bold">IVA</td>
                                      <td className="border border-black p-0 text-right font-bold hover:bg-yellow-50 transition-colors">
                                        <input 
                                          type="text" 
                                          value={ivaMostrar} 
                                          onChange={e => setIvaEscrito(e.target.value)} 
                                          placeholder={formatearDinero(ivaAuto)}
                                          className="w-full h-full p-1 text-right bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-oltech-pink font-bold" 
                                        />
                                      </td>
                                    </tr>
                                    <tr>
                                      <td className="border border-black p-1 text-center font-bold">TOTAL</td>
                                      <td className="border border-black p-0 text-right font-bold hover:bg-yellow-50 transition-colors">
                                        <input 
                                          type="text" 
                                          value={totalMostrar} 
                                          onChange={e => setTotalEscrito(e.target.value)} 
                                          placeholder={formatearDinero(totalAuto)}
                                          className="w-full h-full p-1 text-right bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-oltech-pink font-bold" 
                                        />
                                      </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* CONDICIONES */}
                        <div className="mb-8 evitar-corte bg-white/80 p-2 rounded">
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

                        {/* FIRMA SELECTOR */}
                        <div className="w-full flex flex-col items-center relative mt-4 evitar-corte bg-white/80 p-2 rounded">
                            <div className="absolute -top-10 right-0 bg-yellow-50/90 p-2 rounded border border-yellow-300 text-xs w-64 z-20 shadow-sm">
                                <label className="block font-bold mb-1">Firma para este documento:</label>
                                <select value={firmaSeleccionada} onChange={(e) => setFirmaSeleccionada(e.target.value)} className="w-full p-1 border border-gray-400 rounded outline-none cursor-pointer">
                                    <option value="">-- Seleccionar Firma --</option>
                                    {firmas.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                                </select>
                            </div>

                            <p className="font-bold text-[9pt] mb-6 text-center">Atentamente<br/>OLTECH S.A. DE C.V.</p>
                            
                            <div className="w-64 border-b border-black text-center flex flex-col items-center justify-end h-14 relative z-10">
                                {firmaSeleccionada && firmas.find(f => f.id === parseInt(firmaSeleccionada))?.firmas_url && (
                                <img src={firmas.find(f => f.id === parseInt(firmaSeleccionada)).firmas_url} alt="Firma" className="absolute bottom-0 max-h-16 pointer-events-none" />
                                )}
                            </div>
                            
                            <p className="text-[9pt] font-bold mt-1 z-10">{firmaSeleccionada ? firmas.find(f => f.id === parseInt(firmaSeleccionada))?.nombre : ''}</p>
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

export default NuevaCotizacion;