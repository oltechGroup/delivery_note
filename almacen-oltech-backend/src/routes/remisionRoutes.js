// almacen-oltech-backend/src/routes/remisionRoutes.js
const express = require('express');
const router = express.Router();

const remisionController = require('../controllers/remisionController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const rolesOperativos = ['Sistemas', 'Operaciones', 'Almacen'];

// ==========================================
// RUTAS: CATÁLOGOS BASE PARA REMISIONES
// ==========================================
router.get('/procedimientos', verificarToken, checkRole(rolesOperativos), remisionController.obtenerProcedimientos);
router.post('/procedimientos', verificarToken, checkRole(rolesOperativos), remisionController.crearProcedimiento);

// NUEVO: Rutas para alimentar los selects de Médicos y Hospitales
router.get('/medicos', verificarToken, checkRole(rolesOperativos), remisionController.obtenerMedicos);
router.get('/unidades-medicas', verificarToken, checkRole(rolesOperativos), remisionController.obtenerUnidadesMedicas);

// ==========================================
// RUTAS: REMISIONES MAESTRAS
// ==========================================
router.get('/', verificarToken, checkRole(rolesOperativos), remisionController.obtenerRemisiones);
router.get('/:id', verificarToken, checkRole(rolesOperativos), remisionController.obtenerRemisionPorId);
router.post('/', verificarToken, checkRole(rolesOperativos), remisionController.crearRemision);
router.patch('/:id/estado', verificarToken, checkRole(rolesOperativos), remisionController.actualizarEstadoRemision);

// ==========================================
// RUTAS: CONCILIACIÓN Y RETORNO (NUEVO)
// ==========================================
// Esta es la ruta maestra que recibe los consumos, resta inventario y libera los Sets
router.post('/:id/conciliar', verificarToken, checkRole(rolesOperativos), remisionController.conciliarRemision);

// ==========================================
// RUTAS: DETALLES DE REMISIÓN (Despacho y Retorno)
// ==========================================
router.get('/:remision_id/detalles', verificarToken, checkRole(rolesOperativos), remisionController.obtenerDetallesRemision);
router.post('/:remision_id/detalles', verificarToken, checkRole(rolesOperativos), remisionController.agregarDetalleRemision);
router.patch('/detalles/:id/retorno', verificarToken, checkRole(rolesOperativos), remisionController.actualizarCantidadesRetorno);

module.exports = router;