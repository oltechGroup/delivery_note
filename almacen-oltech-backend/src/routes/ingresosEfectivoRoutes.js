//almacen-oltech-backend/src/routes/ingresosEfectivoRoutes.js
const express = require('express');
const router = express.Router();

// Importamos el controlador
const ingresosController = require('../controllers/ingresosEfectivoController');

// Importamos los middlewares de seguridad
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// ==========================================
// DEFINICIÓN DE PERMISOS POR ROL
// ==========================================
// ¿Quién puede crear el reporte con fotos y firmas?
const rolesCreacion = ['Biomédicos', 'Sistemas', 'Operaciones']; 

// ¿Quién puede ver la lista de ingresos? (Ventas audita, Biomédicos ven su historial)
const rolesLectura = ['Ventas', 'Biomédicos', 'Sistemas', 'Operaciones']; 

// ¿Quién puede cambiar el estado a "Autorizada"? (Solo Ventas y los administradores)
const rolesAutorizacion = ['Ventas', 'Sistemas', 'Operaciones'];

// ==========================================
// RUTAS: INGRESOS DE EFECTIVO
// ==========================================

// 1. Obtener todos los ingresos (GET /api/ingresos-efectivo)
router.get('/', verificarToken, checkRole(rolesLectura), ingresosController.obtenerHistorialIngresos);

// 2. Registrar un nuevo ingreso de efectivo (POST /api/ingresos-efectivo)
router.post('/', verificarToken, checkRole(rolesCreacion), ingresosController.registrarIngreso);

// 3. Cambiar el estado del ingreso (PATCH /api/ingresos-efectivo/:id/estado)
router.patch('/:id/estado', verificarToken, checkRole(rolesAutorizacion), ingresosController.cambiarEstadoIngreso);

module.exports = router;