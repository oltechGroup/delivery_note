// almacen-oltech-frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios'; 
import Catalogos from './pages/Catalogos';
import Almacen from './pages/Almacen';
import Remisiones from './pages/Remisiones'; 
import HistorialRemisiones from './pages/HistorialRemisiones'; 
import NuevaRemision from './pages/NuevaRemision';

// Componentes de Estructura
import Layout from './components/layout/Layout';

// Función auxiliar para limpiar la codificación de la base de datos (igual que en Sidebar)
const limpiarRol = (texto) => {
  if (!texto) return '';
  return texto.replace(/‚/g, 'é');
};

// 🛡️ COMPONENTE GUARDIÁN REFORZADO (Ahora verifica la sesión y el ROL)
// rolesPermitidos es un arreglo. Ejemplo: ['Sistemas', 'Operaciones']
const RutaProtegida = ({ children, rolesPermitidos = [] }) => {
  const { estaAutenticado, usuario } = useAuth();

  // 1. Si no hay sesión, al login directo
  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si la ruta exige roles específicos, revisamos si el usuario tiene permiso
  if (rolesPermitidos.length > 0) {
    const rolActual = limpiarRol(usuario?.rol); // Limpiamos "Biom‚dicos" -> "Biomédicos"
    
    // Si el rol del usuario no está en la lista de invitados a esta ruta...
    if (!rolesPermitidos.includes(rolActual)) {
      // ¡Lo rebotamos al dashboard! (Es la página segura a la que todos tienen acceso)
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 3. Si pasó todas las pruebas, lo dejamos ver la página
  return children;
};

function App() {
  return (
    <Routes>
      {/* Ruta Pública */}
      <Route path="/login" element={<Login />} />

      {/* Rutas Privadas: Envolvemos todo en el Layout para que tengan el Sidebar y Topbar */}
      <Route path="/" element={<RutaProtegida><Layout /></RutaProtegida>}>
        
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Nivel 1: Acceso Universal (Todos los roles logueados pueden entrar) */}
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Nivel 2: Acceso de Almacén (Inventario general) */}
        <Route path="almacen" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Operaciones', 'Biomédicos', 'Encargado de almacén', 'Almacén']}>
            <Almacen />
          </RutaProtegida>
        } />

        {/* Nivel 3: Acceso de Remisiones (Creación y gestión) */}
        <Route path="remisiones" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Operaciones', 'Biomédicos', 'Encargado de almacén']}>
            <Remisiones />
          </RutaProtegida>
        } />
        
        <Route path="nueva-remision" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Operaciones', 'Biomédicos', 'Encargado de almacén']}>
            <NuevaRemision />
          </RutaProtegida>
        } />

        {/* Nivel 4: Acceso Administrativo (Gerencia y TI) */}
        <Route path="historial-remisiones" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Operaciones']}>
            <HistorialRemisiones />
          </RutaProtegida>
        } />
        
        <Route path="catalogos" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Operaciones']}>
            <Catalogos />
          </RutaProtegida>
        } />
        
        <Route path="usuarios" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Operaciones']}>
            <Usuarios />
          </RutaProtegida>
        } />

      </Route>

      {/* Ruta Comodín: Si escriben cualquier cosa rara, los manda al inicio seguro */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;