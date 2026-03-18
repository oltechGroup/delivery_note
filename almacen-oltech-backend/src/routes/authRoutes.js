const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta para iniciar sesión (Método POST porque enviamos datos sensibles)
// URL final será: POST /api/auth/login
router.post('/login', authController.login);

// Exportamos el enrutador para que app.js lo pueda usar
module.exports = router;