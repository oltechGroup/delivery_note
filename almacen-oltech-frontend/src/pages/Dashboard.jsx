import { useAuth } from '../hooks/useAuth';

function Dashboard() {
  const { usuario } = useAuth();

  return (
    <div className="space-y-6">
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
      
      {/* Aquí pondremos las tarjetas de estadísticas más adelante */}
    </div>
  );
}

export default Dashboard;