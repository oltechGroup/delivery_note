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

// PÁGINAS (Módulo Efectivo)
import ReportarEfectivo from './pages/ReportarEfectivo';
import AuditoriaEfectivo from './pages/AuditoriaEfectivo';

// PÁGINAS (Módulo Cotizaciones)
import Cotizaciones from './pages/Cotizaciones';
import NuevaCotizacion from './pages/NuevaCotizacion';
import Firmas from './pages/Firmas'; 

// PÁGINAS (Módulo Tickets / Help Desk)
import TicketsUsuario from './pages/TicketsUsuario';
import DashboardTickets from './pages/DashboardTickets';

// ==========================================
// NUEVAS PÁGINAS (Módulo Red de Hospitales / Licitaciones)
// ==========================================
import InventarioCiudad from './pages/InventarioCiudad';
import BandejaRemisionesCiudad from './pages/BandejaRemisionesCiudad';
import HojasConsumo from './pages/HojasConsumo';
import NuevaHojaConsumo from './pages/NuevaHojaConsumo';
import NuevaRemisionCiudad from './pages/NuevaRemisionCiudad';

// Componentes de Estructura
import Layout from './components/layout/Layout';

// Función auxiliar para limpiar la codificación de la base de datos
const limpiarRol = (texto) => {
  if (!texto) return '';
  return texto.replace(/‚/g, 'é');
};

// 🛡️ COMPONENTE GUARDIÁN REFORZADO (Soporte Multi-Rol)
const RutaProtegida = ({ children, rolesPermitidos = [] }) => {
  const { estaAutenticado, usuario } = useAuth();

  // 1. Si no hay sesión, al login directo
  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si la ruta exige roles específicos, revisamos si el usuario tiene permiso
  if (rolesPermitidos.length > 0) {
    // Normalizamos: Si el usuario tiene el array 'roles', lo usamos. Si no, usamos 'rol' como array de 1.
    const rolesUsuario = Array.isArray(usuario?.roles) 
      ? usuario.roles.map(limpiarRol) 
      : [limpiarRol(usuario?.rol)].filter(Boolean);
    
    // Verificamos si TIENE AL MENOS UN ROL dentro de los permitidos
    const tienePermiso = rolesUsuario.some(rol => rolesPermitidos.includes(rol));

    if (!tienePermiso) {
      // REDIRECCIÓN INTELIGENTE BASADA EN EL ROL
      if (rolesUsuario.includes('Técnico') || rolesUsuario.includes('Coordinador')) {
        return <Navigate to="/red-hospitales/inventario" replace />;
      }
      if (rolesUsuario.includes('Ventas')) {
        return <Navigate to="/auditoria-efectivo" replace />;
      }
      if (rolesUsuario.includes('Cotizaciones')) {
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
  
  const rolesUsuario = Array.isArray(usuario?.roles) 
    ? usuario.roles.map(limpiarRol) 
    : [limpiarRol(usuario?.rol)].filter(Boolean);
  
  // Prioridad de redirección según el rol fuerte del usuario
  if (rolesUsuario.includes('Técnico') || rolesUsuario.includes('Coordinador')) {
    return <Navigate to="/red-hospitales/inventario" replace />;
  }
  if (rolesUsuario.includes('Ventas')) {
    return <Navigate to="/auditoria-efectivo" replace />;
  }
  if (rolesUsuario.includes('Cotizaciones')) {
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
        
        {/* Nivel 2: Acceso de Almacén General */}
        <Route path="almacen" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Operaciones', 'Biomédicos', 'Encargado de almacén', 'Almacén']}>
            <Almacen />
          </RutaProtegida>
        } />

        {/* Nivel 3: Acceso de Remisiones Centrales */}
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
        {/* NIVEL 6: MÓDULO DE COTIZACIONES            */}
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

        <Route path="firmas" element={
          <RutaProtegida rolesPermitidos={['Sistemas']}>
            <Firmas />
          </RutaProtegida>
        } />

        {/* ========================================== */}
        {/* NIVEL 7: SISTEMA DE TICKETS (Help Desk)    */}
        {/* ========================================== */}
        <Route path="mis-tickets" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Operaciones', 'Biomédicos', 'Encargado de almacén', 'Almacén', 'Cotizaciones', 'Ventas', 'Técnico', 'Coordinador']}>
            <TicketsUsuario />
          </RutaProtegida>
        } />

        <Route path="panel-tickets" element={
          <RutaProtegida rolesPermitidos={['Sistemas']}>
            <DashboardTickets />
          </RutaProtegida>
        } />

        {/* ========================================== */}
        {/* NUEVO NIVEL 8: RED HOSPITALES (Licitaciones)*/}
        {/* ========================================== */}
        <Route path="red-hospitales/inventario" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Operaciones', 'Coordinador', 'Técnico', 'Encargado de almacén']}>
            <InventarioCiudad />
          </RutaProtegida>
        } />
        
        <Route path="red-hospitales/remisiones" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Operaciones', 'Coordinador', 'Técnico', 'Encargado de almacén']}>
            <BandejaRemisionesCiudad />
          </RutaProtegida>
        } />

        <Route path="hojas-consumo" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Operaciones', 'Coordinador', 'Técnico', 'Encargado de almacén', 'Biomédicos']}>
            <HojasConsumo />
          </RutaProtegida>
        } />

        <Route path="hojas-consumo/nueva" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Biomédicos', 'Técnico']}>
            <NuevaHojaConsumo />
          </RutaProtegida>
        } />

        <Route path="red-hospitales/remisiones/nueva" element={
          <RutaProtegida rolesPermitidos={['Sistemas', 'Operaciones', 'Coordinador', 'Técnico', 'Biomédicos']}>
             <NuevaRemisionCiudad />
          </RutaProtegida>
} />

      </Route>

      {/* Ruta Comodín */}
      <Route path="*" element={<RedireccionInicial />} />
    </Routes>
  );
}

export default App;