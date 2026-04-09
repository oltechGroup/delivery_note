// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

function Dashboard() {
  const { usuario, token } = useAuth();
  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarAlertas = async () => {
      setCargando(true);
      setError('');
      try {
        const respuesta = await axios.get('http://localhost:4000/api/almacen/alertas/sets-incompletos', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAlertas(respuesta.data);
      } catch (err) {
        console.error('Error al cargar alertas:', err);
        setError('No se pudieron cargar las alertas del sistema.');
      } finally {
        setCargando(false);
      }
    };

    cargarAlertas();
  }, [token]);

  // Agrupamos las alertas por Set para que sea más fácil de leer
  const alertasAgrupadas = alertas.reduce((acc, alerta) => {
    if (!acc[alerta.set_id]) {
      acc[alerta.set_id] = {
        set_codigo: alerta.set_codigo,
        set_descripcion: alerta.set_descripcion,
        no_solicitud: alerta.no_solicitud,
        fecha_cirugia: alerta.fecha_cirugia,
        observaciones: alerta.observaciones, // <--- NUEVO: Jalamos las observaciones de la remisión
        faltantes: []
      };
    }
    acc[alerta.set_id].faltantes.push({
      pieza_codigo: alerta.pieza_codigo,
      pieza_descripcion: alerta.pieza_descripcion,
      cantidad_consumo: alerta.cantidad_consumo
    });
    return acc;
  }, {});

  const formatearFecha = (fechaString) => {
    if (!fechaString) return '';
    const opciones = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(fechaString).toLocaleDateString('es-MX', opciones).toUpperCase();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Encabezado de la página */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel Principal</h1>
        <p className="text-gray-500 mt-1">Resumen general del sistema y accesos rápidos.</p>
      </div>

      {/* Tarjeta de Bienvenida */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 border-l-4 border-l-oltech-pink">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ¡Bienvenido, {usuario?.nombre}!
        </h2>
        <p className="text-gray-600 mb-4">
          Has iniciado sesión exitosamente con el rol de <span className="font-semibold text-oltech-blue">{usuario?.rol || 'Sistemas'}</span>. 
          Usa el menú lateral para navegar entre los módulos.
        </p>
      </div>
      
      {/* SECCIÓN DE ALERTAS */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <span>Alertas de Inventario</span>
        </h3>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 font-medium">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-oltech-pink mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-gray-500 text-sm font-medium">Cargando estado del inventario...</p>
          </div>
        ) : Object.keys(alertasAgrupadas).length === 0 ? (
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-xl shadow-sm border-t border-r border-b border-gray-100 flex items-start space-x-4">
             <div className="bg-white p-2 rounded-full shadow-sm">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
             <div>
                <h4 className="text-green-800 font-bold text-lg">Todo en orden</h4>
                <p className="text-green-700 text-sm mt-1">No hay Sets incompletos en el almacén en este momento.</p>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {Object.values(alertasAgrupadas).map((set, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden flex flex-col">
                <div className="bg-amber-50 p-4 border-b border-amber-100 flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                       <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">Set Incompleto</span>
                       <span className="text-xs font-bold text-gray-500">{set.no_solicitud}</span>
                    </div>
                    <h4 className="font-bold text-oltech-blue mt-2 leading-tight">{set.set_codigo}</h4>
                    <p className="text-sm font-medium text-gray-800">{set.set_descripcion}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                     <p className="text-[10px] font-bold text-gray-400 uppercase">F. Cirugía</p>
                     <p className="text-xs font-bold text-gray-700">{formatearFecha(set.fecha_cirugia)}</p>
                  </div>
                </div>
                
                <div className="p-4 flex-1 bg-white">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-3 border-b border-gray-100 pb-2">Piezas Pendientes de Reposición:</p>
                  <ul className="space-y-2">
                    {set.faltantes.map((pieza, idx) => (
                      <li key={idx} className="flex justify-between items-center text-sm p-2 rounded bg-gray-50 hover:bg-red-50/50 transition-colors border border-gray-100">
                        <div className="min-w-0 pr-4">
                           <p className="font-bold text-gray-800 text-xs truncate">{pieza.pieza_codigo}</p>
                           <p className="text-gray-600 truncate">{pieza.pieza_descripcion}</p>
                        </div>
                        <span className="bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded text-xs shrink-0 shadow-sm border border-red-200">
                          Deuda: {pieza.cantidad_consumo}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* NUEVO: Mostrar Observaciones si existen */}
                  {set.observaciones && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-[10px] font-bold text-yellow-800 uppercase mb-1 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Observaciones de Cirugía:
                      </p>
                      <p className="text-xs text-yellow-900 font-medium italic">"{set.observaciones}"</p>
                    </div>
                  )}

                </div>
                
                <div className="bg-gray-50 p-3 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-500 font-medium">Ve al módulo de Almacén para surtir este equipo.</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default Dashboard;