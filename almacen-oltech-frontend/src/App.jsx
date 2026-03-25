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

// Componentes de Estructura
import Layout from './components/layout/Layout';

// 🛡️ Componente Guardián
const RutaProtegida = ({ children }) => {
  const { estaAutenticado } = useAuth();
  if (!estaAutenticado) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Routes>
      {/* Ruta Pública */}
      <Route path="/login" element={<Login />} />

      {/* Rutas Privadas */}
      <Route 
        path="/" 
        element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="remisiones" element={<Remisiones />} />
        <Route path="almacen" element={<Almacen />} />
        <Route path="catalogos" element={<Catalogos />} />
        <Route path="usuarios" element={<Usuarios />} /> 
      </Route>

      {/* Ruta Comodín */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;