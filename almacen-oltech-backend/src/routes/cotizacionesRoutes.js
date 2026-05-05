// almacen-oltech-backend/src/routes/cotizacionesRoutes.js
const express = require('express');
const router = express.Router();

const cotizacionesController = require('../controllers/cotizacionesController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// Definición de permisos según lo que acordamos
const rolesCotizaciones = ['Cotizaciones', 'Biomédicos', 'Sistemas'];
const rolesSistemas = ['Sistemas'];

// ==========================================
// RUTAS: FIRMAS
// ==========================================
// Todos los que hacen cotizaciones necesitan ver las firmas para elegirlas en el select
router.get('/firmas', verificarToken, checkRole(rolesCotizaciones), cotizacionesController.obtenerFirmas);

// SOLO Sistemas puede registrar nuevas firmas en el canvas
router.post('/firmas', verificarToken, checkRole(rolesSistemas), cotizacionesController.crearFirma);

// ==========================================
// RUTAS: COTIZACIONES
// ==========================================
router.get('/', verificarToken, checkRole(rolesCotizaciones), cotizacionesController.obtenerCotizaciones);
router.get('/:id', verificarToken, checkRole(rolesCotizaciones), cotizacionesController.obtenerCotizacionPorId);
router.post('/', verificarToken, checkRole(rolesCotizaciones), cotizacionesController.crearCotizacion);

module.exports = router;