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

// NUEVAS PÁGINAS (Módulo Efectivo)
import ReportarEfectivo from './pages/ReportarEfectivo';
import AuditoriaEfectivo from './pages/AuditoriaEfectivo';

// NUEVAS PÁGINAS (Módulo Cotizaciones)
import Cotizaciones from './pages/Cotizaciones';
import NuevaCotizacion from './pages/NuevaCotizacion';
import Firmas from './pages/Firmas'; // <-- Importamos la nueva página de firmas

// Componentes de Estructura
import Layout from './components/layout/Layout';

// Función auxiliar para limpiar la codificación de la base de datos
const limpiarRol = (texto) => {
  if (!texto) return '';
  return texto.replace(/‚/g, 'é');
};

// 🛡️ COMPONENTE GUARDIÁN REFORZADO
const RutaProtegida = ({ children, rolesPermitidos = [] }) => {
  const { estaAutenticado, usuario } = useAuth();

  // 1. Si no hay sesión, al login directo
  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si la ruta exige roles específicos, revisamos si el usuario tiene permiso
  if (rolesPermitidos.length > 0) {
    const rolActual = limpiarRol(usuario?.rol); 
    
    // Si el rol del usuario no está en la lista de invitados a esta ruta...
    if (!rolesPermitidos.includes(rolActual)) {
      // REDIRECCIÓN INTELIGENTE
      if (rolActual === 'Ventas') {
        return <Navigate to="/auditoria-efectivo" replace />;
      }
      if (rolActual === 'Cotizaciones') {
        return <Navigate to="/cotizaciones" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 3. Si pasó todas las pruebas, lo dejamos ver la página
  return children;
};

// COMPONENTE DE REDIRECCIÓN INICIAL
const RedireccionInicial = () => {
  const { usuario } = useAuth();
  const rolActual = limpiarRol(usuario?.rol);
  
  if (rolActual === 'Ventas') {
    return <Navigate to="/auditoria-efectivo" replace />;
  }
  if (rolActual === 'Cotizaciones') {
    return <Navigate to="/cotizaciones" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Routes>
      {/* Ruta Pública */}
      <Route path="/login" element={<Login />} />

      {/* Rutas Privadas: Envolvemos todo en el Layout */}
      <Route path="/" element={<RutaProtegida><Layout /></RutaProtegida>}>
        
        <Route index element={<RedireccionInicial />} />
        
        {/* Nivel 1: Acceso Universal */}
        <Route path="dashboard" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Operaciones', 'Biomédicos', 'Encargado de almacén', 'Almacén']}>
            <Dashboard />
          </RutaProtegida>
        } />
        
        {/* Nivel 2: Acceso de Almacén */}
        <Route path="almacen" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Operaciones', 'Biomédicos', 'Encargado de almacén', 'Almacén']}>
            <Almacen />
          </RutaProtegida>
        } />

        {/* Nivel 3: Acceso de Remisiones */}
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

        {/* Nivel 4: Acceso Administrativo */}
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

        {/* ========================================== */}
        {/* NIVEL 5: MÓDULO DE EFECTIVO                */}
        {/* ========================================== */}
        <Route path="reportar-efectivo" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Operaciones', 'Biomédicos']}>
            <ReportarEfectivo />
          </RutaProtegida>
        } />

        <Route path="auditoria-efectivo" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Operaciones', 'Ventas']}>
            <AuditoriaEfectivo />
          </RutaProtegida>
        } />

        {/* ========================================== */}
        {/* NUEVO NIVEL 6: MÓDULO DE COTIZACIONES      */}
        {/* ========================================== */}
        <Route path="cotizaciones" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Biomédicos', 'Cotizaciones']}>
            <Cotizaciones />
          </RutaProtegida>
        } />
        
        <Route path="cotizaciones/nueva" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Biomédicos', 'Cotizaciones']}>
            <NuevaCotizacion />
          </RutaProtegida>
        } />

        {/* NUEVA RUTA: GESTIÓN DE FIRMAS (Exclusivo Sistemas) */}
        <Route path="firmas" element={
          <RutaProtegida rolesPermitidos={['Sistemas']}>
            <Firmas />
          </RutaProtegida>
        } />

      </Route>

      {/* Ruta Comodín */}
      <Route path="*" element={<RedireccionInicial />} />
    </Routes>
  );
}

export default App;