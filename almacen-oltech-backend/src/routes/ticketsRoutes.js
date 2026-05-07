// almacen-oltech-backend/src/routes/ticketsRoutes.js
const express = require('express');
const router = express.Router();

// Importamos el controlador que acabamos de crear
const ticketsController = require('../controllers/ticketsController');

// Importamos los middlewares de seguridad que ya tienes en tu proyecto
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// =========================================================================
// RUTAS UNIVERSALES (Cualquier usuario logueado)
// =========================================================================

// Para que cualquier usuario vea los tickets que ÉL mismo ha levantado
router.get('/mis-tickets', verificarToken, ticketsController.obtenerMisTickets);

// Para que cualquier usuario pueda crear un nuevo ticket
router.post('/', verificarToken, ticketsController.crearTicket);

// Para ver el detalle de un ticket (Lo usan todos para ver cómo va su reporte)
router.get('/:id', verificarToken, ticketsController.verDetalleTicket);


// =========================================================================
// RUTAS EXCLUSIVAS PARA TI (Rol: Sistemas)
// =========================================================================

// Para ver TODO el panel de control de tickets (Todos los usuarios)
router.get('/', verificarToken, checkRole(['Sistemas']), ticketsController.obtenerTodosTickets);

// Para que Sistemas pueda tomar un ticket y cambiarlo a "En Revisión" o "Cancelado"
router.patch('/:id/estado', verificarToken, checkRole(['Sistemas']), ticketsController.cambiarEstadoTicket);

// Para que Sistemas marque el ticket como "Resuelto" con sus observaciones
router.patch('/:id/resolver', verificarToken, checkRole(['Sistemas']), ticketsController.resolverTicketFinal);

module.exports = router;