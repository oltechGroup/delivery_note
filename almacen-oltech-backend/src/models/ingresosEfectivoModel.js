//almacen-oltech-backend/src/models/ingresosEfectivoModel.js
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
    
    // Por defecto, se crea en estado 1 ('Creada') o 2 ('En proceso') si ya trae todo
    // Asumiremos que si ya tiene firma y fotos, entra como 2 ('En proceso')
    const estado_id = 2; 

    const query = `
        INSERT INTO ingresos_efectivo 
        (folio, usuario_recibe_id, nombre_quien_paga, razon, monto_acordado, monto_recibido, diferencia, firma_url, foto_evidencia_url, foto_ine_url, estado_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *;
    `;
    
    const values = [
        folio, usuario_recibe_id, nombre_quien_paga, razon, 
        monto_acordado, monto_recibido, diferencia, 
        firma_url, foto_evidencia_url, foto_ine_url, estado_id
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
};

/**
 * Obtiene todos los ingresos para que Ventas los audite
 * Hace JOIN con usuarios y estados para traer nombres legibles
 */
const obtenerTodosLosIngresos = async () => {
    const query = `
        SELECT 
            i.id, i.folio, i.fecha, i.nombre_quien_paga, i.razon,
            i.monto_acordado, i.monto_recibido, i.diferencia,
            i.firma_url, i.foto_evidencia_url, i.foto_ine_url,
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

module.exports = {
    crearIngreso,
    obtenerTodosLosIngresos,
    actualizarEstado
};