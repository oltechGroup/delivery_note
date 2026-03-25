//almacen-oltech/src/hooks/useAuth.jsx
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// Este hook nos permite extraer rápidamente el usuario, el token o las funciones de login/logout 
// desde cualquier componente de nuestra app con solo escribir: const { usuario, logout } = useAuth();
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  
  return context;
};