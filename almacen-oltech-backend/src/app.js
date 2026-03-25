// almacen-oltech-backend/src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Inicializamos la aplicación
const app = express();

// --- MIDDLEWARES ---
// Permitir peticiones desde el frontend (React)
app.use(cors()); 

// Parsear el cuerpo de las peticiones a JSON (vital para recibir datos de formularios)
app.use(express.json()); 

// Ver las peticiones en la consola (ej. GET /api/status 200)
app.use(morgan('dev')); 


// --- RUTAS BASE (Endpoint de prueba) ---
app.get('/api/status', (req, res) => {
    res.json({
        ok: true,
        mensaje: 'API de Almacén OLTECH funcionando correctamente 🚀'
    });
});

// --- RUTAS DE LA APLICACIÓN ---
// Conectamos las rutas de autenticación. 
// Todas las rutas dentro de authRoutes tendrán el prefijo /api/auth
app.use('/api/auth', require('./routes/authRoutes'));

// Conectamos las rutas de gestión de usuarios.
// Todas las rutas dentro de usuariosRoutes tendrán el prefijo /api/usuarios
app.use('/api/usuarios', require('./routes/usuariosRoutes'));

// Conectamos las rutas de catálogos médicos (Unidades Médicas y Médicos).
// Todas las rutas dentro de catalogosRoutes tendrán el prefijo /api/catalogos
app.use('/api/catalogos', require('./routes/catalogosRoutes'));

// Conectamos las rutas del almacén base (Categorías, Piezas y Sets).
// Todas las rutas dentro de almacenRoutes tendrán el prefijo /api/almacen
app.use('/api/almacen', require('./routes/almacenRoutes'));

// Conectamos las rutas de remisiones y procedimientos (El núcleo de la operación).
// Todas las rutas dentro de remisionRoutes tendrán el prefijo /api/remisiones
app.use('/api/remisiones', require('./routes/remisionRoutes'));

// Exportamos la app configurada para que server.js la pueda encender
module.exports = app;