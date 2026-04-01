//almacen-oltech-frontend/src/components/usuarios/ModalCambiarContrasena.jsx
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';

function ModalCambiarContrasena({ isOpen, onClose }) {
  const { usuario, token } = useAuth();
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const [cargando, setCargando] = useState(false);

  // Si no está abierto, no renderizamos nada
  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje({ texto: '', tipo: '' });

    // 1. Validaciones básicas del frontend
    if (nuevaContrasena !== confirmarContrasena) {
      setMensaje({ texto: 'Las contraseñas nuevas no coinciden.', tipo: 'error' });
      return;
    }

    if (nuevaContrasena.length < 6) {
      setMensaje({ texto: 'La nueva contraseña debe tener al menos 6 caracteres.', tipo: 'error' });
      return;
    }

    setCargando(true);

    try {
      // 2. Enviamos la petición al backend (Necesitamos crear esta ruta en el backend después)
      await axios.patch(
        `http://localhost:4000/api/usuarios/${usuario.id}/mi-contrasena`, 
        {
          contrasena_actual: contrasenaActual,
          nueva_contrasena: nuevaContrasena
        }, 
        { 
          headers: { Authorization: `Bearer ${token}` } 
        }
      );

      setMensaje({ texto: '¡Contraseña actualizada exitosamente!', tipo: 'exito' });
      
      // Limpiamos los campos
      setContrasenaActual('');
      setNuevaContrasena('');
      setConfirmarContrasena('');

      // Cerramos el modal después de 2 segundos para que el usuario alcance a leer el éxito
      setTimeout(() => {
        onClose();
        setMensaje({ texto: '', tipo: '' });
      }, 2000);

    } catch (error) {
      setMensaje({ 
        texto: error.response?.data?.mensaje || 'Error al cambiar la contraseña.', 
        tipo: 'error' 
      });
    } finally {
      setCargando(false);
    }
  };

  const handleCerrar = () => {
    setMensaje({ texto: '', tipo: '' });
    setContrasenaActual('');
    setNuevaContrasena('');
    setConfirmarContrasena('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Encabezado */}
        <div className="bg-oltech-black px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <svg className="w-5 h-5 text-oltech-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            <span>Cambiar Mi Contraseña</span>
          </h2>
          <button onClick={handleCerrar} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Mensajes de error/éxito */}
        {mensaje.texto && (
          <div className={`px-6 pt-4`}>
            <div className={`p-3 rounded-md text-sm font-medium border-l-4 ${mensaje.tipo === 'error' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-green-50 border-green-500 text-green-700'}`}>
              {mensaje.texto}
            </div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual *</label>
            <input 
              type="password" 
              required 
              value={contrasenaActual} 
              onChange={(e) => setContrasenaActual(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none"
              placeholder="Ingresa tu contraseña actual"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña *</label>
            <input 
              type="password" 
              required 
              value={nuevaContrasena} 
              onChange={(e) => setNuevaContrasena(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña *</label>
            <input 
              type="password" 
              required 
              value={confirmarContrasena} 
              onChange={(e) => setConfirmarContrasena(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink outline-none"
              placeholder="Repite la nueva contraseña"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={cargando}
              className="w-full px-6 py-2.5 bg-oltech-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-70 flex justify-center items-center"
            >
              {cargando ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default ModalCambiarContrasena;