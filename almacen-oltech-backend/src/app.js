// almacen-oltech-backend/src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path'); // NUEVO: Importamos el módulo para manejar las rutas de las carpetas

// Inicializamos la aplicación
const app = express();

// --- MIDDLEWARES ---
// Permitir peticiones desde el frontend (React)
app.use(cors()); 

// NUEVO: LA "PUERTA" HACIA TUS IMÁGENES
// Le decimos a Express: "Si alguien pide una URL que empiece con /uploads, 
// ve a buscar ese archivo físico a la carpeta 'uploads' que está un nivel atrás de 'src'"
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// SOLUCIÓN AL ERROR 413: Parsear el cuerpo de las peticiones a JSON con límite ampliado
// (Nota: Como ahora usamos Multer, los archivos pesados ya no pasan por aquí, 
// pero es una buena práctica dejar el límite alto por si envían textos muy largos en el futuro).
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

//Se conecta el nuevo modulo de cotizacion
app.use('/api/cotizaciones', require('./routes/cotizacionesRoutes'));

// NUEVO MÓDULO: Sistema de Tickets IT
// Todas las rutas dentro de ticketsRoutes tendrán el prefijo /api/tickets
app.use('/api/tickets', require('./routes/ticketsRoutes'));

// NUEVO MÓDULO: Licitaciones y Hojas de Consumo (7 Hospitales)
// Todas las rutas dentro de licitacionRoutes tendrán el prefijo /api/licitaciones
app.use('/api/licitaciones', require('./routes/licitacionRoutes'));

// NUEVO MÓDULO: Remisiones exclusivas de Hospitales/Sedes
app.use('/api/remisiones-ciudad', require('./routes/remisionCiudadRoutes'));

// Exportamos la app configurada para que server.js la pueda encender
module.exports = app;