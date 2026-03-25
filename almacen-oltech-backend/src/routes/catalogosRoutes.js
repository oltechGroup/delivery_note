// almacen-oltech-backend/src/routes/catalogosRoutes.js
const express = require('express');
const router = express.Router();

// Importamos el controlador
const catalogosController = require('../controllers/catalogosController');

// Importamos los middlewares de seguridad
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// Definimos los roles que tienen permiso para gestionar catálogos
const rolesPermitidos = ['Sistemas', 'Operaciones'];

// ==========================================
// RUTAS: UNIDADES MÉDICAS
// ==========================================

// Obtener todas las unidades médicas
router.get('/unidades', verificarToken, checkRole(rolesPermitidos), catalogosController.obtenerUnidades);

// Crear una nueva unidad médica
router.post('/unidades', verificarToken, checkRole(rolesPermitidos), catalogosController.crearUnidad);

// Actualizar una unidad médica existente
router.put('/unidades/:id', verificarToken, checkRole(rolesPermitidos), catalogosController.actualizarUnidad);


// ==========================================
// RUTAS: MÉDICOS
// ==========================================

// Obtener todos los médicos
router.get('/medicos', verificarToken, checkRole(rolesPermitidos), catalogosController.obtenerMedicos);

// Obtener médicos filtrados por una unidad médica específica (¡Clave para los selectores de React!)
router.get('/medicos/unidad/:unidad_medica_id', verificarToken, checkRole(rolesPermitidos), catalogosController.obtenerMedicosPorUnidad);

// Crear un nuevo médico
router.post('/medicos', verificarToken, checkRole(rolesPermitidos), catalogosController.crearMedico);

// Actualizar un médico existente
router.put('/medicos/:id', verificarToken, checkRole(rolesPermitidos), catalogosController.actualizarMedico);

// ==========================================
// RUTAS: PROCEDIMIENTOS
// ==========================================

router.get('/procedimientos', verificarToken, checkRole(rolesPermitidos), catalogosController.obtenerProcedimientos);
router.post('/procedimientos', verificarToken, checkRole(rolesPermitidos), catalogosController.crearProcedimiento);
router.put('/procedimientos/:id', verificarToken, checkRole(rolesPermitidos), catalogosController.actualizarProcedimiento);

module.exports = router;