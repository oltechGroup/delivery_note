const pool = require('../config/database');

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
    
    // El $1 se reemplaza de forma segura por userName para evitar inyecciones SQL
    const { rows } = await pool.query(query, [userName]);
    return rows[0]; // Retorna el usuario si lo encuentra, o undefined si no existe
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
            r.nombre AS rol_nombre,
            e.nombre AS estado_nombre
        FROM usuarios u
        INNER JOIN roles r ON u.rol_id = r.id
        INNER JOIN estado_usuario e ON u.estado_usuario_id = e.id
        ORDER BY u.id ASC
    `;
    
    const { rows } = await pool.query(query);
    return rows;
};

module.exports = {
    findByUserName,
    createUser,
    getAllUsers
};