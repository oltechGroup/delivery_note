// almacen-oltech-backend/src/models/ingresosEfectivoModel.js
const pool = require('../config/database');

/**
 * Registra un nuevo ingreso de efectivo (Usado por Biomédicos)
 */
const crearIngreso = async (data) => {
    const { 
        folio, usuario_recibe_id, nombre_quien_paga, razon, 
        monto_acordado, monto_recibido, diferencia, 
        firma_url, foto_evidencia_url, foto_ine_url 
    } = data;
    
    const estado_id = 2; // 'En proceso'
    
    // Al crearlo, el monto_final es igual al monto_recibido (aún no hay gastos)
    const monto_final = monto_recibido;

    const query = `
        INSERT INTO ingresos_efectivo 
        (folio, usuario_recibe_id, nombre_quien_paga, razon, monto_acordado, monto_recibido, diferencia, firma_url, foto_evidencia_url, foto_ine_url, estado_id, monto_final)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *;
    `;
    
    const values = [
        folio, usuario_recibe_id, nombre_quien_paga, razon, 
        monto_acordado, monto_recibido, diferencia, 
        firma_url, foto_evidencia_url, foto_ine_url, estado_id, monto_final
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
};

/**
 * Obtiene todos los ingresos para que Ventas los audite o el Biomédico vea su historial
 * Hace JOIN con usuarios y estados para traer nombres legibles
 */
const obtenerTodosLosIngresos = async () => {
    const query = `
        SELECT 
            i.id, i.folio, i.fecha, i.nombre_quien_paga, i.razon,
            i.monto_acordado, i.monto_recibido, i.diferencia,
            i.firma_url, i.foto_evidencia_url, i.foto_ine_url,
            i.observaciones, i.monto_gasto, i.monto_final, i.foto_observaciones_url,
            i.usuario_recibe_id,
            i.estado_id, e.nombre AS estado_nombre,
            u.nombre AS biomedico_nombre, u.apellido_p AS biomedico_apellido
        FROM ingresos_efectivo i
        INNER JOIN estados_efectivo e ON i.estado_id = e.id
        INNER JOIN usuarios u ON i.usuario_recibe_id = u.id
        ORDER BY i.fecha DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
};

/**
 * Cambia el estado de un ingreso (Ej. Ventas lo pasa a 'Autorizada')
 */
const actualizarEstado = async (id, estado_id) => {
    const query = `
        UPDATE ingresos_efectivo 
        SET estado_id = $1
        WHERE id = $2
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [estado_id, id]);
    return rows[0];
};

/**
 * NUEVO: Agrega los gastos de ruta y recalcula el monto final
 */
const agregarGastosRuta = async (id, data) => {
    const { observaciones, monto_gasto, foto_observaciones_url } = data;
    
    // Primero, obtenemos el monto_recibido actual de ese registro para calcular el final
    const getQuery = 'SELECT monto_recibido FROM ingresos_efectivo WHERE id = $1';
    const result = await pool.query(getQuery, [id]);
    
    if (result.rows.length === 0) return null;
    
    const monto_recibido = parseFloat(result.rows[0].monto_recibido);
    const gasto = parseFloat(monto_gasto) || 0;
    const monto_final = monto_recibido - gasto;

    const query = `
        UPDATE ingresos_efectivo 
        SET observaciones = $1, 
            monto_gasto = $2, 
            monto_final = $3,
            foto_observaciones_url = COALESCE($4, foto_observaciones_url)
        WHERE id = $5
        RETURNING *;
    `;
    
    const values = [observaciones, gasto, monto_final, foto_observaciones_url, id];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

module.exports = {
    crearIngreso,
    obtenerTodosLosIngresos,
    actualizarEstado,
    agregarGastosRuta
};