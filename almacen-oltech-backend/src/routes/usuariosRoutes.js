// almacen-oltech-backend/src/routes/usuariosRoutes.js
const express = require('express');
const router = express.Router();

// Importamos el controlador
const usuariosController = require('../controllers/usuariosController');

// Importamos los middlewares de seguridad
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// Ruta para obtener la lista de usuarios (GET /api/usuarios)
// Pasa por 2 filtros: 1. Que traiga token válido. 2. Que su rol sea 'Sistemas'
router.get('/', verificarToken, checkRole(['Sistemas']), usuariosController.obtenerUsuarios);

// Ruta para crear un nuevo usuario (POST /api/usuarios)
// Pasa por los mismos 2 filtros de seguridad
router.post('/', verificarToken, checkRole(['Sistemas']), usuariosController.crearUsuario);

// Ruta para actualizar los datos generales de un usuario (PUT /api/usuarios/:id)
router.put('/:id', verificarToken, checkRole(['Sistemas']), usuariosController.actualizarUsuario);

// Ruta para cambiar el estado (Activo/Inactivo) de un usuario (PATCH /api/usuarios/:id/estado)
router.patch('/:id/estado', verificarToken, checkRole(['Sistemas']), usuariosController.cambiarEstado);

// Ruta para restablecer la contraseña de un usuario (PATCH /api/usuarios/:id/contrasena)
router.patch('/:id/contrasena', verificarToken, checkRole(['Sistemas']), usuariosController.restablecerContrasena);

module.exports = router;