// almacen-oltech-backend/src/models/remisionModel.js
const pool = require('../config/database');

// ==========================================
// MÓDULO: PROCEDIMIENTOS (Catálogo dinámico)
// ==========================================

const getAllProcedimientos = async () => {
    const query = `SELECT id, nombre FROM procedimiento ORDER BY nombre ASC`;
    const { rows } = await pool.query(query);
    return rows;
};

const createProcedimiento = async (nombre) => {
    const query = `
        INSERT INTO procedimiento (nombre) 
        VALUES ($1) 
        RETURNING id, nombre;
    `;
    const { rows } = await pool.query(query, [nombre]);
    return rows[0];
};

// ==========================================
// MÓDULO: REMISIONES MAESTRAS
// ==========================================

const getAllRemisiones = async () => {
    // Hacemos JOIN con todas las tablas relacionadas para que el frontend 
    // reciba nombres y no solo números de ID
    const query = `
        SELECT 
            r.id, 
            r.no_solicitud, 
            r.fecha_creacion, 
            r.fecha_cirugia, 
            r.paciente, 
            r.procedimiento_id,
            p.nombre AS procedimiento_nombre,
            r.medico_id,
            m.nombre_completo AS medico_nombre,
            r.unidad_medica_id,
            um.nombre AS unidad_medica_nombre,
            r.usuario_creador_id,
            u.nombre AS creador_nombre,
            r.estado_remision_id,
            er.nombre AS estado_nombre
        FROM remision r
        LEFT JOIN procedimiento p ON r.procedimiento_id = p.id
        LEFT JOIN medicos m ON r.medico_id = m.id
        LEFT JOIN unidad_medica um ON r.unidad_medica_id = um.id
        LEFT JOIN usuarios u ON r.usuario_creador_id = u.id
        LEFT JOIN estado_remision er ON r.estado_remision_id = er.id
        ORDER BY r.fecha_creacion DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

const getRemisionById = async (id) => {
    const query = `
        SELECT 
            r.*,
            p.nombre AS procedimiento_nombre,
            m.nombre_completo AS medico_nombre,
            um.nombre AS unidad_medica_nombre,
            u.nombre AS creador_nombre,
            er.nombre AS estado_nombre
        FROM remision r
        LEFT JOIN procedimiento p ON r.procedimiento_id = p.id
        LEFT JOIN medicos m ON r.medico_id = m.id
        LEFT JOIN unidad_medica um ON r.unidad_medica_id = um.id
        LEFT JOIN usuarios u ON r.usuario_creador_id = u.id
        LEFT JOIN estado_remision er ON r.estado_remision_id = er.id
        WHERE r.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};

const createRemision = async (remisionData) => {
    const { 
        no_solicitud, 
        fecha_cirugia, 
        paciente, 
        procedimiento_id, 
        medico_id, 
        unidad_medica_id, 
        usuario_creador_id, 
        estado_remision_id 
    } = remisionData;

    const query = `
        INSERT INTO remision 
        (no_solicitud, fecha_cirugia, paciente, procedimiento_id, medico_id, unidad_medica_id, usuario_creador_id, estado_remision_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
        RETURNING *;
    `;
    
    // Permitimos que algunos campos vayan null si aún no se tienen los datos completos
    const values = [
        no_solicitud || null, 
        fecha_cirugia || null, 
        paciente || null, 
        procedimiento_id || null, 
        medico_id || null, 
        unidad_medica_id || null, 
        usuario_creador_id, 
        estado_remision_id || 1 // Por defecto asignamos 1 ("En proceso")
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const updateEstadoRemision = async (id, estado_remision_id) => {
    const query = `
        UPDATE remision 
        SET estado_remision_id = $1 
        WHERE id = $2 
        RETURNING id, estado_remision_id;
    `;
    const { rows } = await pool.query(query, [estado_remision_id, id]);
    return rows[0];
};

// ==========================================
// MÓDULO: DETALLES DE LA REMISIÓN (Sets, Piezas y Consumibles)
// ==========================================

const getDetallesByRemision = async (remision_id) => {
    const query = `
        SELECT 
            rd.id,
            rd.remision_id,
            rd.set_id,
            s.codigo AS set_codigo,
            s.descripcion AS set_descripcion,
            rd.pieza_id,
            p.codigo AS pieza_codigo,
            p.descripcion AS pieza_descripcion,
            rd.consumible_id,
            c.codigo_referencia AS consumible_codigo,
            c.nombre AS consumible_nombre,
            rd.cantidad_despachada,
            rd.cantidad_consumo,
            rd.cantidad_retorno
        FROM remision_detalle rd
        LEFT JOIN sets s ON rd.set_id = s.id
        LEFT JOIN piezas p ON rd.pieza_id = p.id
        LEFT JOIN consumible c ON rd.consumible_id = c.id
        WHERE rd.remision_id = $1
        ORDER BY rd.id ASC
    `;
    const { rows } = await pool.query(query, [remision_id]);
    return rows;
};

const addDetalleRemision = async (detalleData) => {
    // Añadimos consumible_id a los parámetros
    const { remision_id, set_id, pieza_id, consumible_id, cantidad_despachada } = detalleData;
    const query = `
        INSERT INTO remision_detalle 
        (remision_id, set_id, pieza_id, consumible_id, cantidad_despachada) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *;
    `;
    
    // Puede ser un Set, una Pieza o un Consumible
    const values = [
        remision_id, 
        set_id || null, 
        pieza_id || null, 
        consumible_id || null,
        cantidad_despachada
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const updateCantidadesDetalle = async (id, cantidadesData) => {
    const { cantidad_consumo, cantidad_retorno } = cantidadesData;
    const query = `
        UPDATE remision_detalle 
        SET cantidad_consumo = $1, cantidad_retorno = $2
        WHERE id = $3 
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [cantidad_consumo, cantidad_retorno, id]);
    return rows[0];
};

module.exports = {
    getAllProcedimientos,
    createProcedimiento,
    getAllRemisiones,
    getRemisionById,
    createRemision,
    updateEstadoRemision,
    getDetallesByRemision,
    addDetalleRemision,
    updateCantidadesDetalle
};