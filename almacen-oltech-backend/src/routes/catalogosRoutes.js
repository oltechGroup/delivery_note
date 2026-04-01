// almacen-oltech-backend/src/routes/catalogosRoutes.js
const express = require('express');
const router = express.Router();

// Importamos el controlador
const catalogosController = require('../controllers/catalogosController');

// Importamos los middlewares de seguridad
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// SEPARAMOS LOS PERMISOS PARA EVITAR QUE SE ROMPAN LOS SELECTORES DE REMISIONES
// Los que pueden ver las listas (Lectura)
const rolesLectura = ['Sistemas', 'Operaciones', 'Biomédicos', 'Encargado de almacén'];
// Los que pueden modificar los catálogos (Escritura)
const rolesEscritura = ['Sistemas', 'Operaciones'];

// ==========================================
// RUTAS: UNIDADES MÉDICAS
// ==========================================

// Obtener todas las unidades médicas (LECTURA)
router.get('/unidades', verificarToken, checkRole(rolesLectura), catalogosController.obtenerUnidades);

// Crear o actualizar una unidad médica (ESCRITURA)
router.post('/unidades', verificarToken, checkRole(rolesEscritura), catalogosController.crearUnidad);
router.put('/unidades/:id', verificarToken, checkRole(rolesEscritura), catalogosController.actualizarUnidad);


// ==========================================
// RUTAS: MÉDICOS
// ==========================================

// Obtener todos los médicos y filtrados (LECTURA)
router.get('/medicos', verificarToken, checkRole(rolesLectura), catalogosController.obtenerMedicos);
router.get('/medicos/unidad/:unidad_medica_id', verificarToken, checkRole(rolesLectura), catalogosController.obtenerMedicosPorUnidad);

// Crear o actualizar un médico (ESCRITURA)
router.post('/medicos', verificarToken, checkRole(rolesEscritura), catalogosController.crearMedico);
router.put('/medicos/:id', verificarToken, checkRole(rolesEscritura), catalogosController.actualizarMedico);

// ==========================================
// RUTAS: PROCEDIMIENTOS
// ==========================================

// Obtener procedimientos (LECTURA)
router.get('/procedimientos', verificarToken, checkRole(rolesLectura), catalogosController.obtenerProcedimientos);

// Crear o actualizar procedimientos (ESCRITURA)
router.post('/procedimientos', verificarToken, checkRole(rolesEscritura), catalogosController.crearProcedimiento);
router.put('/procedimientos/:id', verificarToken, checkRole(rolesEscritura), catalogosController.actualizarProcedimiento);

module.exports = router;