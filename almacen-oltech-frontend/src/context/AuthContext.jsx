//almacen-oltech-frontend/src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const tokenGuardado = localStorage.getItem('oltech_token');
    const usuarioGuardado = localStorage.getItem('oltech_usuario');

    if (tokenGuardado && usuarioGuardado) {
      setToken(tokenGuardado);
      setUsuario(JSON.parse(usuarioGuardado));
    }
    setCargando(false);
  }, []);

  const logout = () => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem('oltech_token');
    localStorage.removeItem('oltech_usuario');
    window.location.href = '/login'; 
  };

  const login = (datosUsuario, tokenRecibido) => {
    setUsuario(datosUsuario);
    setToken(tokenRecibido);
    localStorage.setItem('oltech_token', tokenRecibido);
    localStorage.setItem('oltech_usuario', JSON.stringify(datosUsuario));
  };

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // Obtenemos la URL de la petición original
        const originalRequestUrl = error.config ? error.config.url : '';

        // CORRECCIÓN: Ahora SOLO cierra sesión si es 401 (Token inválido/caducado).
        // Le quitamos el 403, porque un 403 solo significa "No tienes permiso para ESTA acción", no que tu sesión no sirva.
        if (
            error.response && 
            error.response.status === 401 &&
            !originalRequestUrl.includes('/api/auth/login')
        ) {
            console.warn('El token ha caducado. Cerrando sesión por seguridad.');
            logout(); 
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []); 

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, estaAutenticado: !!token }}>
      {!cargando && children}
    </AuthContext.Provider>
  );
};