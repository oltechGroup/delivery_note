// almacen-oltech-backend/src/routes/remisionCiudadRoutes.js
const express = require('express');
const router = express.Router();

const remisionCiudadController = require('../controllers/remisionCiudadController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// ==========================================
// DEFINICIÓN DE PERMISOS (Multi-Rol)
// ==========================================
// Roles que pueden registrar salidas del hospital (Nivel 1)
const rolesCreacion = ['Sistemas', 'Técnico', 'Coordinador', 'Biomédicos']; 

// Roles que tienen la autoridad para auditar, conciliar y cerrar la remisión (Nivel 2)
const rolesConciliacion = ['Sistemas', 'Operaciones', 'Encargado de almacén', 'Coordinador'];

// Roles que pueden consultar el historial (La suma de todos)
const rolesLectura = [...new Set([...rolesCreacion, ...rolesConciliacion])];

// ==========================================
// RUTAS: LECTURA Y CREACIÓN (Cabecera)
// ==========================================
router.get('/', verificarToken, checkRole(rolesLectura), remisionCiudadController.obtenerRemisionesCiudad);
router.get('/:id', verificarToken, checkRole(rolesLectura), remisionCiudadController.obtenerRemisionCiudadPorId);
router.post('/', verificarToken, checkRole(rolesCreacion), remisionCiudadController.crearRemisionCiudad);
router.patch('/:id/estado', verificarToken, checkRole(rolesConciliacion), remisionCiudadController.actualizarEstadoRemisionCiudad);

// ==========================================
// RUTAS: DETALLES DE LA REMISIÓN
// ==========================================
router.get('/:remision_id/detalles', verificarToken, checkRole(rolesLectura), remisionCiudadController.obtenerDetallesRemisionCiudad);
router.patch('/detalles/:id/retorno', verificarToken, checkRole(rolesConciliacion), remisionCiudadController.actualizarCantidadesRetornoCiudad);

// ==========================================
// RUTAS: CONCILIACIÓN FINAL (Ajuste de Stock Local)
// ==========================================
router.post('/:id/conciliar', verificarToken, checkRole(rolesConciliacion), remisionCiudadController.conciliarRemisionCiudad);

module.exports = router;