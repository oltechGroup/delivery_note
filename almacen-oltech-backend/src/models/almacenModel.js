// almacen-oltech-backend/src/models/almacenModel.js
const pool = require('../config/database');

// ==========================================
// MÓDULO: CATEGORÍAS DE SETS
// ==========================================
const getAllCategorias = async () => {
    const query = `
        SELECT 
            c.id, 
            c.nombre, 
            COUNT(s.id)::int AS total_sets
        FROM categoria_sets c
        LEFT JOIN sets s ON c.id = s.categoria_id
        GROUP BY c.id
        ORDER BY c.nombre ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

const createCategoria = async (nombre) => {
    const query = `
        INSERT INTO categoria_sets (nombre) 
        VALUES ($1) 
        RETURNING id, nombre;
    `;
    const { rows } = await pool.query(query, [nombre]);
    return rows[0];
};

// ==========================================
// MÓDULO: CONSUMIBLES (Inventario a Granel)
// ==========================================
const getAllConsumibles = async () => {
    const query = `
        SELECT 
            c.id, 
            c.codigo_referencia, 
            c.nombre, 
            c.cantidad,
            c.unidad_medida
        FROM consumible c
        ORDER BY c.nombre ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

const createConsumible = async (data) => {
    const { codigo_referencia, nombre, unidad_medida, cantidad } = data;
    const query = `
        INSERT INTO consumible (codigo_referencia, nombre, unidad_medida, cantidad) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [codigo_referencia, nombre, unidad_medida || null, cantidad || 0]);
    return rows[0];
};

// Función para sumar (+) o restar (-) stock manualmente al consumible
const updateStockConsumible = async (id, cantidad_a_sumar) => {
    const query = `
        UPDATE consumible 
        SET cantidad = cantidad + $1 
        WHERE id = $2 
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [cantidad_a_sumar, id]);
    return rows[0];
};

// ==========================================
// MÓDULO: PIEZAS (Asignadas a Sets)
// ==========================================
const getAllPiezas = async () => {
    const query = `
        SELECT 
            p.id, 
            p.codigo, 
            p.descripcion, 
            p.unidad_medida, 
            p.estado_id,
            e.nombre AS estado_nombre
        FROM piezas p
        LEFT JOIN estado_pieza e ON p.estado_id = e.id
        ORDER BY p.codigo ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

const createPieza = async (piezaData) => {
    const { codigo, descripcion, unidad_medida, estado_id } = piezaData;
    const query = `
        INSERT INTO piezas (codigo, descripcion, unidad_medida, estado_id) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *;
    `;
    const values = [codigo, descripcion, unidad_medida || null, estado_id || null];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const updatePieza = async (id, piezaData) => {
    const { codigo, descripcion, unidad_medida, estado_id } = piezaData;
    const query = `
        UPDATE piezas 
        SET codigo = $1, descripcion = $2, unidad_medida = $3, estado_id = $4
        WHERE id = $5 
        RETURNING *;
    `;
    const values = [codigo, descripcion, unidad_medida || null, estado_id || null, id];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

// ==========================================
// MÓDULO: SETS MAESTROS
// ==========================================
const getAllSets = async () => {
    const query = `
        SELECT 
            s.id, s.codigo, s.descripcion, s.estado_id,
            e.nombre AS estado_nombre,
            s.categoria_id, c.nombre AS categoria_nombre
        FROM sets s
        LEFT JOIN estados_set e ON s.estado_id = e.id
        LEFT JOIN categoria_sets c ON s.categoria_id = c.id
        ORDER BY s.codigo ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

const getSetsByCategoria = async (categoria_id) => {
    const query = `
        SELECT 
            s.id, s.codigo, s.descripcion, s.estado_id,
            e.nombre AS estado_nombre,
            s.categoria_id, c.nombre AS categoria_nombre
        FROM sets s
        LEFT JOIN estados_set e ON s.estado_id = e.id
        LEFT JOIN categoria_sets c ON s.categoria_id = c.id
        WHERE s.categoria_id = $1
        ORDER BY s.codigo ASC
    `;
    const { rows } = await pool.query(query, [categoria_id]);
    return rows;
};

const createSet = async (setData) => {
    const { codigo, descripcion, estado_id, categoria_id } = setData;
    const query = `
        INSERT INTO sets (codigo, descripcion, estado_id, categoria_id) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *;
    `;
    const values = [codigo, descripcion, estado_id || null, categoria_id || null];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

// MEJORA PREMIUM: Crear Set y registrar las Piezas "Al Vuelo"
const createSetConComposicion = async (setData, composicionArray) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); 
        
        // 1. Guardar el encabezado del Set
        const { codigo, descripcion, estado_id, categoria_id } = setData;
        const insertSetQuery = `
            INSERT INTO sets (codigo, descripcion, estado_id, categoria_id) 
            VALUES ($1, $2, $3, $4) RETURNING *;
        `;
        const resSet = await client.query(insertSetQuery, [codigo, descripcion, estado_id || null, categoria_id || null]);
        const nuevoSet = resSet.rows[0];

        // 2. Guardar/Asignar las piezas escritas a mano
        if (composicionArray && composicionArray.length > 0) {
            for (let item of composicionArray) {
                // Upsert: Si el código ya existe, lo actualiza con el nuevo texto libre de unidad
                const upsertPiezaQuery = `
                    INSERT INTO piezas (codigo, descripcion, unidad_medida)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (codigo) DO UPDATE 
                    SET descripcion = EXCLUDED.descripcion, 
                        unidad_medida = EXCLUDED.unidad_medida
                    RETURNING id;
                `;
                const resPieza = await client.query(upsertPiezaQuery, [item.codigo, item.descripcion, item.unidad_medida || null]);
                const piezaId = resPieza.rows[0].id;

                // Relacionar la pieza con el Set
                const insertCompQuery = `
                    INSERT INTO set_composicion (set_id, pieza_id, cantidad_pieza, cantidad_consumo) 
                    VALUES ($1, $2, $3, $4);
                `;
                await client.query(insertCompQuery, [nuevoSet.id, piezaId, item.cantidad_pieza, item.cantidad_consumo || 0]);
            }
        }

        await client.query('COMMIT'); 
        return nuevoSet;
    } catch (error) {
        await client.query('ROLLBACK'); 
        throw error;
    } finally {
        client.release();
    }
};

const updateSet = async (id, setData) => {
    const { codigo, descripcion, estado_id, categoria_id } = setData;
    const query = `
        UPDATE sets 
        SET codigo = $1, descripcion = $2, estado_id = $3, categoria_id = $4
        WHERE id = $5 
        RETURNING *;
    `;
    const values = [codigo, descripcion, estado_id || null, categoria_id || null, id];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

// ==========================================
// MÓDULO: COMPOSICIÓN DE SETS & SURTIDO
// ==========================================
const getComposicionBySet = async (set_id) => {
    const query = `
        SELECT 
            sc.id AS composicion_id,
            sc.set_id,
            sc.pieza_id,
            p.codigo AS pieza_codigo,
            p.descripcion AS pieza_descripcion,
            p.unidad_medida,
            sc.cantidad_pieza,
            sc.cantidad_consumo
        FROM set_composicion sc
        INNER JOIN piezas p ON sc.pieza_id = p.id
        WHERE sc.set_id = $1
        ORDER BY p.codigo ASC
    `;
    const { rows } = await pool.query(query, [set_id]);
    return rows;
};

const addPiezaToSet = async (set_id, pieza_id, cantidad_pieza) => {
    const query = `
        INSERT INTO set_composicion (set_id, pieza_id, cantidad_pieza) 
        VALUES ($1, $2, $3) 
        RETURNING *;
    `;
    const { rows } = await pool.query(query, [set_id, pieza_id, cantidad_pieza]);
    return rows[0];
};

const removePiezaFromSet = async (composicion_id) => {
    const query = `DELETE FROM set_composicion WHERE id = $1 RETURNING id;`;
    const { rows } = await pool.query(query, [composicion_id]);
    return rows[0];
};

// MEJORA PREMIUM: Transacción para Surtir un Set desde Consumibles
const surtirPiezaSet = async (composicion_id, consumible_id, cantidad_a_surtir) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Restar del inventario de consumibles (Solo si hay suficiente stock)
        const updateConsumibleQuery = `
            UPDATE consumible 
            SET cantidad = cantidad - $1 
            WHERE id = $2 AND cantidad >= $1
            RETURNING id, cantidad;
        `;
        const resConsumible = await client.query(updateConsumibleQuery, [cantidad_a_surtir, consumible_id]);
        
        if (resConsumible.rows.length === 0) {
            throw new Error('Stock insuficiente en consumibles o el consumible no existe.');
        }

        // 2. Sumarle la cantidad a la pieza dentro del Set
        const updateSetCompQuery = `
            UPDATE set_composicion
            SET cantidad_pieza = cantidad_pieza + $1
            WHERE id = $2
            RETURNING *;
        `;
        const resSet = await client.query(updateSetCompQuery, [cantidad_a_surtir, composicion_id]);

        await client.query('COMMIT');
        return resSet.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getAllCategorias, createCategoria,
    getAllConsumibles, createConsumible, updateStockConsumible,
    getAllPiezas, createPieza, updatePieza,
    getAllSets, getSetsByCategoria, createSet, createSetConComposicion, updateSet,
    getComposicionBySet, addPiezaToSet, removePiezaFromSet, surtirPiezaSet
};