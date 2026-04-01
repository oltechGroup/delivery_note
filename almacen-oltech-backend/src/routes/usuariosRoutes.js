// almacen-oltech-backend/src/routes/usuariosRoutes.js
const express = require('express');
const router = express.Router();

// Importamos el controlador
const usuariosController = require('../controllers/usuariosController');

// Importamos los middlewares de seguridad
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// =========================================================================
// RUTAS DE LECTURA (Ver usuarios)
// =========================================================================
// Sistemas administra, Operaciones audita/supervisa
router.get('/', verificarToken, checkRole(['Sistemas', 'Operaciones']), usuariosController.obtenerUsuarios);

// =========================================================================
// RUTAS DE ESCRITURA (Crear y modificar usuarios)
// =========================================================================
// SOLO Sistemas puede alterar la información o el acceso de los usuarios
router.post('/', verificarToken, checkRole(['Sistemas']), usuariosController.crearUsuario);
router.put('/:id', verificarToken, checkRole(['Sistemas']), usuariosController.actualizarUsuario);
router.patch('/:id/estado', verificarToken, checkRole(['Sistemas']), usuariosController.cambiarEstado);
router.patch('/:id/contrasena', verificarToken, checkRole(['Sistemas']), usuariosController.restablecerContrasena);

// =========================================================================
// RUTA PERSONAL (Auto-gestión)
// =========================================================================
// Cualquier usuario logueado puede cambiar su propia contraseña. 
// La seguridad (que sea SU id) se valida dentro del controlador, por eso no lleva checkRole.
router.patch('/:id/mi-contrasena', verificarToken, usuariosController.cambiarMiContrasena);

module.exports = router;