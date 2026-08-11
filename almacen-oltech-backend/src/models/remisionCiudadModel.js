// almacen-oltech-backend/src/models/remisionCiudadModel.js
const pool = require('../config/database');

// ==========================================
// MÓDULO: REMISIONES DE CIUDAD / HOSPITALES
// ==========================================

const getAllRemisionesCiudad = async (filtros = {}) => {
    let query = `
        SELECT 
            r.id, 
            r.no_solicitud, 
            r.fecha_creacion, 
            r.fecha_cirugia, 
            r.paciente, 
            r.cliente, 
            r.procedimiento_id,
            p.nombre AS procedimiento_nombre,
            r.medico_id,
            m.nombre_completo AS medico_nombre,
            r.unidad_medica_id,
            um.nombre AS unidad_medica_nombre,
            r.ciudad_id,
            c.nombre AS ciudad_nombre,
            r.usuario_creador_id,
            CONCAT_WS(' ', u.nombre, u.apellido_p, u.apellido_m) AS creador_nombre,
            r.estado_remision_id,
            er.nombre AS estado_nombre,
            r.usuario_conciliador_id,
            CONCAT_WS(' ', uc.nombre, uc.apellido_p, uc.apellido_m) AS conciliador_nombre,
            r.fecha_conciliacion,
            r.observaciones
        FROM remision_ciudad r
        LEFT JOIN procedimiento p ON r.procedimiento_id = p.id
        LEFT JOIN medicos m ON r.medico_id = m.id
        LEFT JOIN unidad_medica um ON r.unidad_medica_id = um.id
        LEFT JOIN ciudades c ON r.ciudad_id = c.id
        LEFT JOIN usuarios u ON r.usuario_creador_id = u.id
        LEFT JOIN usuarios uc ON r.usuario_conciliador_id = uc.id
        LEFT JOIN estado_remision er ON r.estado_remision_id = er.id
        WHERE 1=1
    `;
    
    const values = [];
    let contadorParams = 1;

    // Aislamiento Geográfico (Multi-Tenant)
    if (filtros.ciudad_id) {
        query += ` AND r.ciudad_id = $${contadorParams}`;
        values.push(filtros.ciudad_id);
        contadorParams++;
    }
    
    if (filtros.unidad_medica_id) {
        query += ` AND r.unidad_medica_id = $${contadorParams}`;
        values.push(filtros.unidad_medica_id);
        contadorParams++;
    }

    query += ` ORDER BY r.fecha_creacion DESC`;
    
    const { rows } = await pool.query(query, values);
    return rows;
};

const getRemisionCiudadById = async (id) => {
    const query = `
        SELECT 
            r.*,
            p.nombre AS procedimiento_nombre,
            m.nombre_completo AS medico_nombre,
            um.nombre AS unidad_medica_nombre,
            c.nombre AS ciudad_nombre,
            CONCAT_WS(' ', u.nombre, u.apellido_p, u.apellido_m) AS creador_nombre,
            CONCAT_WS(' ', uc.nombre, uc.apellido_p, uc.apellido_m) AS conciliador_nombre,
            er.nombre AS estado_nombre
        FROM remision_ciudad r
        LEFT JOIN procedimiento p ON r.procedimiento_id = p.id
        LEFT JOIN medicos m ON r.medico_id = m.id
        LEFT JOIN unidad_medica um ON r.unidad_medica_id = um.id
        LEFT JOIN ciudades c ON r.ciudad_id = c.id
        LEFT JOIN usuarios u ON r.usuario_creador_id = u.id
        LEFT JOIN usuarios uc ON r.usuario_conciliador_id = uc.id
        LEFT JOIN estado_remision er ON r.estado_remision_id = er.id
        WHERE r.id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};

const createRemisionCiudad = async (remisionData) => {
    const { 
        no_solicitud, 
        fecha_cirugia, 
        paciente, 
        cliente, 
        procedimiento_id, 
        medico_id, 
        unidad_medica_id, 
        ciudad_id, // <-- Clave para el aislamiento geográfico
        usuario_creador_id, 
        estado_remision_id 
    } = remisionData;

    const query = `
        INSERT INTO remision_ciudad 
        (no_solicitud, fecha_cirugia, paciente, cliente, procedimiento_id, medico_id, unidad_medica_id, ciudad_id, usuario_creador_id, estado_remision_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *;
    `;
    
    const values = [
        no_solicitud || null, 
        fecha_cirugia || null, 
        paciente || null, 
        cliente || null,
        procedimiento_id || null, 
        medico_id || null, 
        unidad_medica_id || null, 
        ciudad_id || null,
        usuario_creador_id, 
        estado_remision_id || 1
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const updateEstadoRemisionCiudad = async (id, estado_remision_id) => {
    const query = `
        UPDATE remision_ciudad 
        SET estado_remision_id = $1 
        WHERE id = $2 
        RETURNING id, estado_remision_id;
    `;
    const { rows } = await pool.query(query, [estado_remision_id, id]);
    return rows[0];
};

const updateObservacionesRemisionCiudad = async (id, observaciones) => {
    const query = `
        UPDATE remision_ciudad 
        SET observaciones = $1 
        WHERE id = $2 
        RETURNING id, observaciones;
    `;
    const { rows } = await pool.query(query, [observaciones, id]);
    return rows[0];
};

// ==========================================
// MÓDULO: DETALLES DE LA REMISIÓN DE CIUDAD
// ==========================================

const getDetallesByRemisionCiudad = async (remision_ciudad_id) => {
    const query = `
        SELECT 
            rcd.id,
            rcd.remision_ciudad_id,
            rcd.set_id,
            s.codigo AS set_codigo,
            s.descripcion AS set_descripcion,
            rcd.pieza_id,
            p.codigo AS pieza_codigo,
            p.descripcion AS pieza_descripcion,
            rcd.consumible_id,
            c.codigo_referencia AS consumible_codigo,
            c.nombre AS consumible_nombre,
            c.nombre_comercial,
            rcd.cantidad_despachada,
            rcd.cantidad_consumo,
            rcd.cantidad_retorno,
            rcd.lote,
            rcd.fecha_caducidad,
            rcd.orden,
            rcd.es_total,
            rcd.descripcion_custom
        FROM remision_ciudad_detalle rcd
        LEFT JOIN sets s ON rcd.set_id = s.id
        LEFT JOIN piezas p ON rcd.pieza_id = p.id
        LEFT JOIN consumible c ON rcd.consumible_id = c.id
        WHERE rcd.remision_ciudad_id = $1
        ORDER BY rcd.orden ASC
    `;
    const { rows } = await pool.query(query, [remision_ciudad_id]);
    return rows;
};

const addDetalleRemisionCiudad = async (detalleData) => {
    const { 
        remision_ciudad_id, set_id, pieza_id, consumible_id, cantidad_despachada, 
        lote, fecha_caducidad, orden, es_total, descripcion_custom 
    } = detalleData;
    
    const query = `
        INSERT INTO remision_ciudad_detalle 
        (remision_ciudad_id, set_id, pieza_id, consumible_id, cantidad_despachada, lote, fecha_caducidad, orden, es_total, descripcion_custom) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *;
    `;
    
    const values = [
        remision_ciudad_id, 
        set_id || null, 
        pieza_id || null, 
        consumible_id || null,
        cantidad_despachada || 0,
        lote || null,
        fecha_caducidad || null,
        orden || 0,
        es_total || false,
        descripcion_custom || null
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const updateCantidadesDetalleCiudad = async (id, cantidadesData) => {
    const { cantidad_consumo, cantidad_retorno } = cantidadesData;
    const query = `
        UPDATE remision_ciudad_detalle 
        SET cantidad_consumo = $1, cantidad_retorno = $2
        WHERE id = $3 
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [cantidad_consumo, cantidad_retorno, id]);
    return rows[0];
};

module.exports = {
    getAllRemisionesCiudad,
    getRemisionCiudadById,
    createRemisionCiudad,
    updateEstadoRemisionCiudad,
    updateObservacionesRemisionCiudad,
    getDetallesByRemisionCiudad,
    addDetalleRemisionCiudad,
    updateCantidadesDetalleCiudad
};