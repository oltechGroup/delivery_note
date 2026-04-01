// almacen-oltech-backend/src/controllers/usuariosController.js
const usuarioModel = require('../models/usuarioModel');
const { hashPassword, comparePassword } = require('../utils/encrypter'); // NUEVO: Importamos comparePassword

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
        const { nombre, apellido_p, apellido_m, user_name, contrasena, rol_id, estado_usuario_id } = req.body;

        if (!nombre || !apellido_p || !user_name || !contrasena || !rol_id || !estado_usuario_id) {
            return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben estar llenos.' });
        }

        const contrasenaHash = await hashPassword(contrasena);

        const nuevoUsuarioData = {
            nombre,
            apellido_p,
            apellido_m,
            user_name,
            contrasena: contrasenaHash,
            rol_id,
            estado_usuario_id
        };

        const usuarioCreado = await usuarioModel.createUser(nuevoUsuarioData);

        res.status(201).json({
            mensaje: 'Usuario creado exitosamente',
            usuario: usuarioCreado
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
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
        const { id } = req.params;
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
 * Restablece la contraseña de un usuario por una nueva (Usado por Sistemas)
 */
const restablecerContrasena = async (req, res) => {
    try {
        const { id } = req.params;
        const { nueva_contrasena } = req.body;

        if (!nueva_contrasena) {
            return res.status(400).json({ mensaje: 'La nueva contraseña es requerida.' });
        }

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

/**
 * NUEVO: Permite a un usuario cambiar su propia contraseña verificando la actual
 */
const cambiarMiContrasena = async (req, res) => {
    try {
        const { id } = req.params;
        const { contrasena_actual, nueva_contrasena } = req.body;

        // 1. Validar que vengan ambos datos
        if (!contrasena_actual || !nueva_contrasena) {
            return res.status(400).json({ mensaje: 'Debes enviar la contraseña actual y la nueva.' });
        }

        // Seguridad: Asegurarse de que el usuario logueado solo cambie SU propia contraseña
        if (req.usuario.id !== parseInt(id)) {
            return res.status(403).json({ mensaje: 'No tienes permiso para cambiar la contraseña de otro usuario.' });
        }

        // 2. Buscar al usuario en la BD para obtener su contraseña encriptada actual
        // Reutilizamos el user_name que viene en el token (req.usuario.user_name)
        const usuarioBd = await usuarioModel.findByUserName(req.usuario.user_name);
        
        if (!usuarioBd) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado en la base de datos.' });
        }

        // 3. Comparar la contraseña actual ingresada con la guardada
        const isMatch = await comparePassword(contrasena_actual, usuarioBd.contrasena);
        if (!isMatch) {
            return res.status(401).json({ mensaje: 'La contraseña actual es incorrecta.' });
        }

        // 4. Si todo está bien, encriptar la nueva y guardarla
        const nuevaContrasenaHash = await hashPassword(nueva_contrasena);
        const usuarioActualizado = await usuarioModel.updatePassword(id, nuevaContrasenaHash);

        res.json({
            mensaje: 'Contraseña actualizada exitosamente.',
            usuario: usuarioActualizado
        });

    } catch (error) {
        console.error('Error al cambiar la propia contraseña:', error);
        res.status(500).json({ mensaje: 'Error interno al procesar el cambio de contraseña.' });
    }
};


module.exports = {
    obtenerUsuarios,
    crearUsuario,
    actualizarUsuario,
    cambiarEstado,
    restablecerContrasena,
    cambiarMiContrasena // Exportamos la nueva función
};