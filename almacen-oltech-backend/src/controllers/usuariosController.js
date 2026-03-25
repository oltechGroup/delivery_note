// almacen-oltech-backend/src/controllers/usuariosController.js
const usuarioModel = require('../models/usuarioModel');
const { hashPassword } = require('../utils/encrypter');

/**
 * Obtiene la lista de todos los usuarios para llenar la tabla en React
 */
const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await usuarioModel.getAllUsers();
        res.json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ mensaje: 'Error al cargar la lista de usuarios.' });
    }
};

/**
 * Crea un nuevo usuario desde el formulario del Frontend
 */
const crearUsuario = async (req, res) => {
    try {
        // Recibimos los datos que React nos mandará desde el formulario
        const { nombre, apellido_p, apellido_m, user_name, contrasena, rol_id, estado_usuario_id } = req.body;

        // 1. Validar que no nos manden campos vacíos
        if (!nombre || !apellido_p || !user_name || !contrasena || !rol_id || !estado_usuario_id) {
            return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben estar llenos.' });
        }

        // 2. Encriptar la contraseña que escribiste en el formulario ANTES de guardarla
        const contrasenaHash = await hashPassword(contrasena);

        // 3. Preparar el paquete de datos
        const nuevoUsuarioData = {
            nombre,
            apellido_p,
            apellido_m, // Puede venir vacío si no tiene segundo apellido
            user_name,
            contrasena: contrasenaHash,
            rol_id,
            estado_usuario_id
        };

        // 4. Mandar a guardar a PostgreSQL
        const usuarioCreado = await usuarioModel.createUser(nuevoUsuarioData);

        // 5. Avisarle a React que todo salió bien
        res.status(201).json({
            mensaje: 'Usuario creado exitosamente',
            usuario: usuarioCreado
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        
        // Código 23505 en Postgres significa "Violación de llave única" (El user_name ya existe)
        if (error.code === '23505') {
            return res.status(400).json({ mensaje: 'El nombre de usuario ya existe. Por favor elige otro.' });
        }
        
        res.status(500).json({ mensaje: 'Error interno al crear el usuario.' });
    }
};

/**
 * Actualiza los datos generales de un usuario (nombre, username, rol)
 */
const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params; // El ID vendrá en la URL (ej. /api/usuarios/5)
        const { nombre, apellido_p, apellido_m, user_name, rol_id } = req.body;

        if (!nombre || !apellido_p || !user_name || !rol_id) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios por llenar.' });
        }

        const data = { nombre, apellido_p, apellido_m, user_name, rol_id };
        const usuarioActualizado = await usuarioModel.updateUser(id, data);

        if (!usuarioActualizado) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        res.json({
            mensaje: 'Usuario actualizado correctamente.',
            usuario: usuarioActualizado
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        if (error.code === '23505') {
            return res.status(400).json({ mensaje: 'El nombre de usuario ya está en uso por otra persona.' });
        }
        res.status(500).json({ mensaje: 'Error interno al actualizar el usuario.' });
    }
};

/**
 * Cambia el estado (Activo/Inactivo) de un usuario
 */
const cambiarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado_usuario_id } = req.body;

        if (!estado_usuario_id) {
            return res.status(400).json({ mensaje: 'El ID del nuevo estado es requerido.' });
        }

        const estadoActualizado = await usuarioModel.updateStatus(id, estado_usuario_id);

        if (!estadoActualizado) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        res.json({
            mensaje: 'Estado del usuario actualizado correctamente.',
            estado: estadoActualizado
        });
    } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        res.status(500).json({ mensaje: 'Error interno al cambiar el estado del usuario.' });
    }
};

/**
 * Restablece la contraseña de un usuario por una nueva
 */
const restablecerContrasena = async (req, res) => {
    try {
        const { id } = req.params;
        const { nueva_contrasena } = req.body;

        if (!nueva_contrasena) {
            return res.status(400).json({ mensaje: 'La nueva contraseña es requerida.' });
        }

        // Encriptamos la nueva contraseña antes de guardarla
        const contrasenaHash = await hashPassword(nueva_contrasena);

        const usuarioActualizado = await usuarioModel.updatePassword(id, contrasenaHash);

        if (!usuarioActualizado) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        res.json({
            mensaje: 'Contraseña restablecida exitosamente.',
            usuario: usuarioActualizado
        });
    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        res.status(500).json({ mensaje: 'Error interno al restablecer la contraseña.' });
    }
};

module.exports = {
    obtenerUsuarios,
    crearUsuario,
    actualizarUsuario,
    cambiarEstado,
    restablecerContrasena
};