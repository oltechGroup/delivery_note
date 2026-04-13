// almacen-oltech-backend/src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Inicializamos la aplicación
const app = express();

// --- MIDDLEWARES ---
// Permitir peticiones desde el frontend (React)
app.use(cors()); 

// SOLUCIÓN AL ERROR 413: Parsear el cuerpo de las peticiones a JSON con límite ampliado
// Aumentamos a 50mb para permitir recibir las imágenes en Base64 del INE y las firmas
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// Conectamos el nuevo módulo de ingresos de efectivo
app.use('/api/ingresos-efectivo', require('./routes/ingresosEfectivoRoutes'));

// Exportamos la app configurada para que server.js la pueda encender
module.exports = app;