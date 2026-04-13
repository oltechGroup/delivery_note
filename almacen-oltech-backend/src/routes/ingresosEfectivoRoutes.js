// almacen-oltech-backend/src/routes/ingresosEfectivoRoutes.js
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
// ¿Quién puede crear el reporte inicial con fotos y firmas?
const rolesCreacion = ['Biomédicos', 'Sistemas', 'Operaciones']; 

// ¿Quién puede ver la lista de ingresos?
const rolesLectura = ['Ventas', 'Biomédicos', 'Sistemas', 'Operaciones']; 

// ¿Quién puede cambiar el estado a "Autorizada"? 
const rolesAutorizacion = ['Ventas', 'Sistemas', 'Operaciones'];

// NUEVO: ¿Quién puede registrar gastos de ruta / observaciones?
// (Los Biomédicos para reportar sus gastos, y Ventas por si lo traen físico y lo capturan al final)
const rolesGastos = ['Biomédicos', 'Ventas', 'Sistemas', 'Operaciones'];

// ==========================================
// RUTAS: INGRESOS DE EFECTIVO
// ==========================================

// 1. Obtener todos los ingresos (GET /api/ingresos-efectivo)
router.get('/', verificarToken, checkRole(rolesLectura), ingresosController.obtenerHistorialIngresos);

// 2. Registrar un nuevo ingreso de efectivo (POST /api/ingresos-efectivo)
router.post('/', verificarToken, checkRole(rolesCreacion), ingresosController.registrarIngreso);

// 3. Cambiar el estado del ingreso (PATCH /api/ingresos-efectivo/:id/estado)
router.patch('/:id/estado', verificarToken, checkRole(rolesAutorizacion), ingresosController.cambiarEstadoIngreso);

// 4. NUEVO: Agregar gastos de ruta y observaciones (POST /api/ingresos-efectivo/:id/gastos)
// Usamos POST porque estamos adjuntando archivos pesados (Base64) en el body
router.post('/:id/gastos', verificarToken, checkRole(rolesGastos), ingresosController.registrarGastosRuta);

module.exports = router;