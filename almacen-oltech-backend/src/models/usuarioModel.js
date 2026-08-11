// almacen-oltech-backend/src/models/usuarioModel.js
const pool = require('../config/database');

const limpiarRol = (nombreRol) => {
    if (!nombreRol) return '';
    return nombreRol.replace(/‚/g, 'é').replace(/ß/g, 'á').trim();
};

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
            r_principal.nombre AS rol_nombre_legacy,
            u.estado_usuario_id,
            e.nombre AS estado_nombre,
            COALESCE(
                JSON_AGG(
                    DISTINCT JSONB_BUILD_OBJECT('id', r.id, 'nombre', r.nombre)
                ) FILTER (WHERE r.id IS NOT NULL), '[]'
            ) AS roles_detalles,
            COALESCE(
                JSON_AGG(
                    DISTINCT JSONB_BUILD_OBJECT('ciudad_id', us.ciudad_id, 'unidad_medica_id', us.unidad_medica_id)
                ) FILTER (WHERE us.id IS NOT NULL), '[]'
            ) AS sedes
        FROM usuarios u
        LEFT JOIN roles r_principal ON u.rol_id = r_principal.id
        LEFT JOIN estado_usuario e ON u.estado_usuario_id = e.id
        LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
        LEFT JOIN roles r ON ur.rol_id = r.id
        LEFT JOIN usuario_sedes us ON u.id = us.usuario_id
        WHERE u.user_name = $1
        GROUP BY u.id, r_principal.nombre, e.nombre
    `;
    
    const { rows } = await pool.query(query, [userName]);
    const usuario = rows[0];
    
    if (usuario) {
        const rolesLimpios = (usuario.roles_detalles || []).map(r => ({
            id: r.id,
            nombre: limpiarRol(r.nombre)
        }));

        usuario.roles = rolesLimpios.map(r => r.nombre);
        usuario.roles_detalles = rolesLimpios;
        usuario.rol_nombre = usuario.roles[0] || limpiarRol(usuario.rol_nombre_legacy) || '';
    }
    
    return usuario;
};

// NUEVO: Agregamos roles y sedes como parámetros separados
const createUser = async (usuarioData, roles, sedes) => {
    const client = await pool.connect();
    try {
        const { nombre, apellido_p, apellido_m, user_name, contrasena, rol_id, estado_usuario_id } = usuarioData;
        
        await client.query('BEGIN');

        const rolPrincipal = rol_id || (roles && roles.length > 0 ? roles[0] : null);

        const queryUsuario = `
            INSERT INTO usuarios 
            (nombre, apellido_p, apellido_m, user_name, contrasena, rol_id, estado_usuario_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, nombre, user_name;
        `;
        
        const valuesUsuario = [nombre, apellido_p, apellido_m, user_name, contrasena, rolPrincipal, estado_usuario_id];
        const { rows } = await client.query(queryUsuario, valuesUsuario);
        const nuevoUsuario = rows[0];

        // Guardar Roles
        let rolesAInsertar = Array.isArray(roles) && roles.length > 0 ? roles : (rolPrincipal ? [rolPrincipal] : []);
        for (let rId of rolesAInsertar) {
            await client.query(
                `INSERT INTO usuario_roles (usuario_id, rol_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [nuevoUsuario.id, rId]
            );
        }

        // Guardar Sedes (Aislamiento Geográfico)
        if (Array.isArray(sedes) && sedes.length > 0) {
            for (let s of sedes) {
                await client.query(
                    `INSERT INTO usuario_sedes (usuario_id, ciudad_id, unidad_medica_id) VALUES ($1, $2, $3)`,
                    [nuevoUsuario.id, s.ciudad_id, s.unidad_medica_id]
                );
            }
        }

        await client.query('COMMIT');
        return nuevoUsuario;

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const getAllUsers = async () => {
    const query = `
        SELECT 
            u.id, 
            u.nombre, 
            u.apellido_p, 
            u.apellido_m, 
            u.user_name, 
            u.rol_id,
            r_principal.nombre AS rol_nombre_legacy,
            u.estado_usuario_id,
            e.nombre AS estado_nombre,
            COALESCE(
                JSON_AGG(
                    DISTINCT JSONB_BUILD_OBJECT('id', r.id, 'nombre', r.nombre)
                ) FILTER (WHERE r.id IS NOT NULL), '[]'
            ) AS roles_detalles,
            COALESCE(
                JSON_AGG(
                    DISTINCT JSONB_BUILD_OBJECT('ciudad_id', us.ciudad_id, 'unidad_medica_id', us.unidad_medica_id)
                ) FILTER (WHERE us.id IS NOT NULL), '[]'
            ) AS sedes
        FROM usuarios u
        LEFT JOIN roles r_principal ON u.rol_id = r_principal.id
        LEFT JOIN estado_usuario e ON u.estado_usuario_id = e.id
        LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
        LEFT JOIN roles r ON ur.rol_id = r.id
        LEFT JOIN usuario_sedes us ON u.id = us.usuario_id
        GROUP BY u.id, r_principal.nombre, e.nombre
        ORDER BY u.id ASC
    `;
    
    const { rows } = await pool.query(query);

    return rows.map(user => {
        const rolesLimpios = (user.roles_detalles || []).map(r => ({
            id: r.id, nombre: limpiarRol(r.nombre)
        }));
        const nombresRoles = rolesLimpios.map(r => r.nombre);

        return {
            ...user,
            roles: nombresRoles,
            roles_detalles: rolesLimpios,
            rol_nombre: nombresRoles[0] || limpiarRol(user.rol_nombre_legacy) || ''
        };
    });
};

// NUEVO: Agregamos roles y sedes
const updateUser = async (id, usuarioData, roles, sedes) => {
    const client = await pool.connect();
    try {
        const { nombre, apellido_p, apellido_m, user_name, rol_id } = usuarioData;
        await client.query('BEGIN');

        const rolPrincipal = rol_id || (roles && roles.length > 0 ? roles[0] : null);

        const queryUsuario = `
            UPDATE usuarios 
            SET nombre = $1, apellido_p = $2, apellido_m = $3, user_name = $4, rol_id = $5
            WHERE id = $6
            RETURNING id, nombre, user_name;
        `;
        
        const { rows } = await client.query(queryUsuario, [nombre, apellido_p, apellido_m, user_name, rolPrincipal, id]);
        const usuarioActualizado = rows[0];

        if (usuarioActualizado) {
            // Actualizar roles
            let rolesAInsertar = Array.isArray(roles) && roles.length > 0 ? roles : (rolPrincipal ? [rolPrincipal] : []);
            await client.query(`DELETE FROM usuario_roles WHERE usuario_id = $1`, [id]);
            for (let rId of rolesAInsertar) {
                await client.query(`INSERT INTO usuario_roles (usuario_id, rol_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [id, rId]);
            }

            // Actualizar Sedes
            if (Array.isArray(sedes)) {
                await client.query(`DELETE FROM usuario_sedes WHERE usuario_id = $1`, [id]);
                for (let s of sedes) {
                    await client.query(
                        `INSERT INTO usuario_sedes (usuario_id, ciudad_id, unidad_medica_id) VALUES ($1, $2, $3)`,
                        [id, s.ciudad_id, s.unidad_medica_id]
                    );
                }
            }
        }

        await client.query('COMMIT');
        return usuarioActualizado;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

const updateStatus = async (id, estado_usuario_id) => {
    const { rows } = await pool.query(`UPDATE usuarios SET estado_usuario_id = $1 WHERE id = $2 RETURNING id, estado_usuario_id;`, [estado_usuario_id, id]);
    return rows[0];
};

const updatePassword = async (id, nuevaContrasenaHash) => {
    const { rows } = await pool.query(`UPDATE usuarios SET contrasena = $1 WHERE id = $2 RETURNING id, user_name;`, [nuevaContrasenaHash, id]);
    return rows[0];
};

module.exports = { findByUserName, createUser, getAllUsers, updateUser, updateStatus, updatePassword };