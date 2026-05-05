// almacen-oltech-backend/src/models/cotizacionesModel.js
const pool = require('../config/database');

// ==========================================
// MODELOS PARA FIRMAS
// ==========================================

const getAllFirmas = async () => {
    // Solo traemos las firmas activas para que no salgan firmas viejas en el select
    const query = "SELECT * FROM firmas WHERE estado = 'activo' ORDER BY nombre ASC";
    const { rows } = await pool.query(query);
    return rows;
};

const createFirma = async (nombre, firmas_url) => {
    const query = "INSERT INTO firmas (nombre, firmas_url) VALUES ($1, $2) RETURNING *";
    const { rows } = await pool.query(query, [nombre, firmas_url]);
    return rows[0];
};

// ==========================================
// MODELOS PARA COTIZACIONES (LECTURA)
// ==========================================

const getAllCotizaciones = async () => {
    // Traemos la lista general (Cabeceras) uniendo con la tabla de firmas 
    // y usuarios para tener los nombres listos para la vista de tabla en React
    const query = `
        SELECT 
            c.id, 
            c.fecha, 
            c.cliente_texto, 
            c.total, 
            c.creado_en,
            u.nombre AS creador_nombre,
            f.nombre AS firma_nombre
        FROM cotizaciones c
        LEFT JOIN usuarios u ON c.usuario_creador_id = u.id
        LEFT JOIN firmas f ON c.firma_id = f.id
        ORDER BY c.creado_en DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

const getCotizacionById = async (id) => {
    // 1. Buscamos la cabecera de la cotización
    const queryCabecera = `
        SELECT 
            c.*, 
            u.nombre AS creador_nombre, 
            f.nombre AS firma_nombre, 
            f.firmas_url
        FROM cotizaciones c
        LEFT JOIN usuarios u ON c.usuario_creador_id = u.id
        LEFT JOIN firmas f ON c.firma_id = f.id
        WHERE c.id = $1
    `;
    const { rows: cabeceraRows } = await pool.query(queryCabecera, [id]);

    if (cabeceraRows.length === 0) {
        return null;
    }

    const cotizacion = cabeceraRows[0];

    // 2. Buscamos todos los detalles (partidas) amarrados a esta cotización
    const queryDetalles = `
        SELECT * FROM cotizacion_detalles
        WHERE cotizacion_id = $1
        ORDER BY partida ASC
    `;
    const { rows: detallesRows } = await pool.query(queryDetalles, [id]);

    // 3. Juntamos todo en un solo objeto para mandarlo completito al frontend
    cotizacion.detalles = detallesRows;
    
    return cotizacion;
};

module.exports = {
    getAllFirmas,
    createFirma,
    getAllCotizaciones,
    getCotizacionById
};