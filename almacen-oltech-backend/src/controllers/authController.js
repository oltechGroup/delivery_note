//almacen-oltech-backend/src/controllers/authController.js
const jwt = require('jsonwebtoken');
const { comparePassword } = require('../utils/encrypter');
const usuarioModel = require('../models/usuarioModel');

/**
 * Función para iniciar sesión en el sistema
 */
const login = async (req, res) => {
    try {
        const { user_name, contrasena } = req.body;

        // 1. Validar que el frontend nos mandó ambos datos
        if (!user_name || !contrasena) {
            return res.status(400).json({ mensaje: 'Por favor, ingresa tu usuario y contraseña.' });
        }

        // 2. Buscar al usuario en la base de datos
        const usuario = await usuarioModel.findByUserName(user_name);
        
        // Si no existe, damos un mensaje genérico por seguridad (para que no adivinen usuarios)
        if (!usuario) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
        }

        // 3. Validar si el usuario fue dado de baja (Inactivo)
        if (usuario.estado_nombre === 'Inactivo') {
            return res.status(403).json({ mensaje: 'Tu cuenta está inactiva. Contacta al departamento de Sistemas.' });
        }

        // 4. Comparar la contraseña ingresada contra el hash guardado en Postgres
        const isMatch = await comparePassword(contrasena, usuario.contrasena);
        if (!isMatch) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
        }

        // 5. Crear el Token JWT (El "Gafete Digital")
        // Aquí guardamos quién es y qué rol tiene, para que las siguientes peticiones sepan si dejarlo pasar o no.
        const payload = {
            id: usuario.id,
            user_name: usuario.user_name,
            rol: usuario.rol_nombre
        };

        // Firmamos el token. Le ponemos una caducidad de 8 horas (un turno laboral estándar)
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET || 'secreto_desarrollo_oltech', 
            { expiresIn: '8h' }
        );

        // 6. Enviar la respuesta al frontend (¡IMPORTANTE! Jamás enviamos la contraseña de vuelta)
        res.json({
            mensaje: '¡Bienvenido a ALMACÉN OLTECH!',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                apellido_p: usuario.apellido_p,
                rol: usuario.rol_nombre
            }
        });

    } catch (error) {
        console.error('Error en el proceso de login:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

module.exports = {
    login
};