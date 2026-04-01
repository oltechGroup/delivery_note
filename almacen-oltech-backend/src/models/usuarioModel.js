// almacen-oltech-backend/src/models/usuarioModel.js
const pool = require('../config/database');

/**
 * Función de limpieza interna para corregir errores de codificación
 * que vienen desde la base de datos de PostgreSQL en Windows.
 */
const limpiarRol = (nombreRol) => {
    if (!nombreRol) return '';
    return nombreRol
        .replace(/‚/g, 'é') // Corrige Biom‚dicos -> Biomédicos
        .replace(/ß/g, 'á') // Corrige AlmacÚn o similares si aparecen
        .trim(); // Quita espacios vacíos al principio o al final por si acaso
};

/**
 * Busca un usuario por su nombre de usuario (user_name)
 * Hace un JOIN con roles y estado_usuario para traer la información completa
 */
const findByUserName = async (userName) => {
    const query = `
        SELECT 
            u.id, 
            u.nombre, 
            u.apellido_p, 
            u.apellido_m, 
            u.user_name, 
            u.contrasena, 
            u.rol_id, 
            r.nombre AS rol_nombre,
            u.estado_usuario_id,
            e.nombre AS estado_nombre
        FROM usuarios u
        INNER JOIN roles r ON u.rol_id = r.id
        INNER JOIN estado_usuario e ON u.estado_usuario_id = e.id
        WHERE u.user_name = $1
    `;
    
    const { rows } = await pool.query(query, [userName]);
    
    const usuario = rows[0];
    
    // Si encontramos al usuario, le limpiamos el nombre del rol ANTES de mandarlo al Controller
    if (usuario) {
        usuario.rol_nombre = limpiarRol(usuario.rol_nombre);
    }
    
    return usuario;
};

/**
 * Crea un nuevo usuario en la base de datos
 */
const createUser = async (usuarioData) => {
    const { nombre, apellido_p, apellido_m, user_name, contrasena, rol_id, estado_usuario_id } = usuarioData;
    
    const query = `
        INSERT INTO usuarios 
        (nombre, apellido_p, apellido_m, user_name, contrasena, rol_id, estado_usuario_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, nombre, user_name;
    `;
    
    const values = [nombre, apellido_p, apellido_m, user_name, contrasena, rol_id, estado_usuario_id];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

/**
 * Obtiene la lista de todos los usuarios (Ideal para el panel de Sistemas)
 */
const getAllUsers = async () => {
    const query = `
        SELECT 
            u.id, 
            u.nombre, 
            u.apellido_p, 
            u.apellido_m, 
            u.user_name, 
            u.rol_id,
            r.nombre AS rol_nombre,
            u.estado_usuario_id,
            e.nombre AS estado_nombre
        FROM usuarios u
        INNER JOIN roles r ON u.rol_id = r.id
        INNER JOIN estado_usuario e ON u.estado_usuario_id = e.id
        ORDER BY u.id ASC
    `;
    
    const { rows } = await pool.query(query);

    // Limpiamos el rol de todos los usuarios de la lista antes de mandarlos al Frontend
    const usuariosLimpios = rows.map(user => {
        return {
            ...user,
            rol_nombre: limpiarRol(user.rol_nombre)
        };
    });

    return usuariosLimpios;
};

/**
 * Actualiza los datos generales de un usuario (sin tocar contraseña ni estado)
 */
const updateUser = async (id, usuarioData) => {
    const { nombre, apellido_p, apellido_m, user_name, rol_id } = usuarioData;
    
    const query = `
        UPDATE usuarios 
        SET nombre = $1, apellido_p = $2, apellido_m = $3, user_name = $4, rol_id = $5
        WHERE id = $6
        RETURNING id, nombre, user_name;
    `;
    
    const values = [nombre, apellido_p, apellido_m, user_name, rol_id, id];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

/**
 * Activa o Inactiva a un usuario
 */
const updateStatus = async (id, estado_usuario_id) => {
    const query = `
        UPDATE usuarios 
        SET estado_usuario_id = $1
        WHERE id = $2
        RETURNING id, estado_usuario_id;
    `;
    
    const { rows } = await pool.query(query, [estado_usuario_id, id]);
    return rows[0];
};

/**
 * Restablece la contraseña de un usuario
 */
const updatePassword = async (id, nuevaContrasenaHash) => {
    const query = `
        UPDATE usuarios 
        SET contrasena = $1
        WHERE id = $2
        RETURNING id, user_name;
    `;
    
    const { rows } = await pool.query(query, [nuevaContrasenaHash, id]);
    return rows[0];
};

module.exports = {
    findByUserName,
    createUser,
    getAllUsers,
    updateUser,
    updateStatus,
    updatePassword
};