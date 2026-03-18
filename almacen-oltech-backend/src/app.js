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
// Este pequeño endpoint nos servirá para verificar que el servidor está vivo
app.get('/api/status', (req, res) => {
    res.json({
        ok: true,
        mensaje: 'API de Almacén OLTECH funcionando correctamente 🚀'
    });
});

// Nota: Aquí más adelante conectaremos las rutas reales de tus módulos
// Ejemplo futuro: app.use('/api/remisiones', require('./routes/remisionRoutes'));


// Exportamos la app configurada para que server.js la pueda encender
module.exports = app;