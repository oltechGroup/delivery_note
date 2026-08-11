// almacen-oltech-backend/src/routes/licitacionRoutes.js
const express = require('express');
const router = express.Router();

// Importamos el controlador de licitaciones
const licitacionController = require('../controllers/licitacionController');

// Importamos los middlewares de seguridad
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// ==========================================
// DEFINICIÓN DE PERMISOS (Multi-Rol)
// ==========================================
// Roles que pueden registrar lo que se usó en el quirófano (Nivel 1)
const rolesCreacion = ['Sistemas', 'Biomédicos', 'Técnico']; 

// Roles que tienen la autoridad para auditar y dar el visto bueno (Nivel 2)
const rolesAprobacion = ['Sistemas', 'Operaciones', 'Encargado de almacén', 'Coordinador'];

// Roles que pueden consultar el historial (La suma de todos los anteriores)
const rolesLectura = [...new Set([...rolesCreacion, ...rolesAprobacion])];
const fileUpload = require('express-fileupload');

// ==========================================
// RUTAS: INVENTARIO LOCAL (Sedes/Hospitales)
// ==========================================
router.get('/inventario', verificarToken, checkRole(rolesLectura), licitacionController.obtenerInventarioLocal);

// ==========================================
// RUTAS: LECTURA E HISTORIAL
// ==========================================
// Nota: El controlador (licitacionController.js) ya se encarga de filtrar
// para que el usuario solo vea las hojas de su propia ciudad/hospital.
router.get('/hojas-consumo', verificarToken, checkRole(rolesLectura), licitacionController.obtenerHojasConsumo);
router.get('/hojas-consumo/:id', verificarToken, checkRole(rolesLectura), licitacionController.obtenerHojaPorId);

// ==========================================
// RUTAS: OPERACIÓN QUIRÓFANO (Creación)
// ==========================================
router.post('/hojas-consumo', verificarToken, checkRole(rolesCreacion), licitacionController.crearHojaConsumo);

// ==========================================
// RUTAS: AUDITORÍA Y CIERRE (Aprobación)
// ==========================================
router.patch('/hojas-consumo/:id/autorizar', verificarToken, checkRole(rolesAprobacion), licitacionController.autorizarHojaConsumo);
router.post('/:id/subir-firma', verificarToken, fileUpload(), licitacionController.subirArchivoFirmado);

module.exports = router;