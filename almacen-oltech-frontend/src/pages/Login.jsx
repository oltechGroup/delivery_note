//almacen-oltech-frontend/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth'; // Importamos el cerebro de sesión
import logo from '../assets/Logo acostado.png'; // Ajustamos la ruta del logo

function Login() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth(); // Extraemos la función mágica para iniciar sesión

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const respuesta = await axios.post('http://localhost:4000/api/auth/login', {
        user_name: userName,
        contrasena: password
      });

      const { token, usuario } = respuesta.data;
      
      // Guardamos la sesión en el contexto global
      login(usuario, token);
      
      // ¡Abrete sésamo! Nos vamos al panel principal
      navigate('/dashboard');
      
    } catch (error) {
      if (error.response && error.response.data.mensaje) {
        setError(error.response.data.mensaje);
      } else {
        setError('Error al conectar con el servidor.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* LADO IZQUIERDO: Branding */}
      <div className="hidden lg:flex w-1/2 bg-oltech-black flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-oltech-purple rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-oltech-pink rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center">
          <img src={logo} alt="Grupo OLTECH" className="w-96 mb-8 mx-auto drop-shadow-lg rounded-lg" />
          <h1 className="text-white text-3xl font-light tracking-wide mt-4">
            Sistema Integral de <span className="font-semibold text-oltech-blue">Almacén</span> y <span className="font-semibold text-oltech-pink">Remisiones</span>
          </h1>
          <p className="text-gray-400 mt-4 max-w-md mx-auto">
            Control preciso de instrumental, inventario y procedimientos de osteosíntesis.
          </p>
        </div>
      </div>

      {/* LADO DERECHO: Formulario */}
      <div className="w-full lg:w-1/2 flex justify-center items-center bg-white p-8">
        <div className="max-w-md w-full">
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logo} alt="Grupo OLTECH" className="w-48 rounded-lg bg-oltech-black p-2" />
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900">Iniciar Sesión</h2>
            <p className="text-gray-500 mt-2">Ingresa tus credenciales para acceder al panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario</label>
              <input
                type="text" required disabled={cargando}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink focus:border-oltech-pink outline-none transition-all disabled:bg-gray-100"
                placeholder="   "
                value={userName} onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password" required disabled={cargando}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-oltech-pink focus:border-oltech-pink outline-none transition-all disabled:bg-gray-100"
                placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit" disabled={cargando}
              className="w-full bg-oltech-black text-white py-3 rounded-lg font-semibold tracking-wide hover:bg-gray-900 border-2 border-transparent hover:border-oltech-pink transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {cargando ? 'Cargando...' : 'Entrar al Sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;