//almacen-oltech-frontendsrc/src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';

// Creamos el contexto (la caja donde guardaremos la info)
export const AuthContext = createContext();

// Creamos el proveedor (el que va a envolver a toda la app para compartir la info)
export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Cuando la app arranca, revisamos si ya había una sesión guardada en la memoria del navegador
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('oltech_token');
    const usuarioGuardado = localStorage.getItem('oltech_usuario');

    if (tokenGuardado && usuarioGuardado) {
      setToken(tokenGuardado);
      setUsuario(JSON.parse(usuarioGuardado));
    }
    setCargando(false);
  }, []);

  // Función para guardar los datos cuando el login es exitoso
  const login = (datosUsuario, tokenRecibido) => {
    setUsuario(datosUsuario);
    setToken(tokenRecibido);
    localStorage.setItem('oltech_token', tokenRecibido);
    localStorage.setItem('oltech_usuario', JSON.stringify(datosUsuario));
  };

  // Función para cerrar sesión y borrar todo
  const logout = () => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem('oltech_token');
    localStorage.removeItem('oltech_usuario');
  };

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, estaAutenticado: !!token }}>
      {/* Mientras revisa si hay sesión guardada, no mostramos nada para evitar parpadeos */}
      {!cargando && children}
    </AuthContext.Provider>
  );
};