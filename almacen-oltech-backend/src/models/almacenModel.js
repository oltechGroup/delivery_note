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
// MÓDULO: CATEGORÍAS DE CONSUMIBLES
// ==========================================
const getAllCategoriasConsumibles = async () => {
    const query = `
        SELECT 
            cc.id, 
            cc.nombre, 
            COUNT(c.id)::int AS total_consumibles
        FROM categoria_consumible cc
        LEFT JOIN consumible c ON cc.id = c.categoria_id
        GROUP BY cc.id
        ORDER BY cc.nombre ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

const createCategoriaConsumible = async (nombre) => {
    const query = `
        INSERT INTO categoria_consumible (nombre) 
        VALUES ($1) 
        RETURNING id, nombre;
    `;
    const { rows } = await pool.query(query, [nombre]);
    return rows[0];
};

// ==========================================
// MÓDULO: CONSUMIBLES (Inventario a Granel)
// ==========================================
const getConsumiblesByCategoria = async (categoria_id) => {
    const query = `
        SELECT 
            c.id, 
            c.codigo_referencia, 
            c.nombre, 
            c.cantidad,
            c.unidad_medida,
            c.lote,
            c.fecha_caducidad,
            c.categoria_id,
            cc.nombre AS categoria_nombre
        FROM consumible c
        LEFT JOIN categoria_consumible cc ON c.categoria_id = cc.id
        WHERE c.categoria_id = $1
        ORDER BY c.nombre ASC
    `;
    const { rows } = await pool.query(query, [categoria_id]);
    return rows;
};

const getAllConsumibles = async () => {
    const query = `
        SELECT 
            c.id, 
            c.codigo_referencia, 
            c.nombre, 
            c.cantidad,
            c.unidad_medida,
            c.lote,
            c.fecha_caducidad,
            c.categoria_id,
            cc.nombre AS categoria_nombre
        FROM consumible c
        LEFT JOIN categoria_consumible cc ON c.categoria_id = cc.id
        ORDER BY c.nombre ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

const createConsumible = async (data) => {
    const { codigo_referencia, nombre, unidad_medida, cantidad, lote, fecha_caducidad, categoria_id } = data;
    const query = `
        INSERT INTO consumible (codigo_referencia, nombre, unidad_medida, cantidad, lote, fecha_caducidad, categoria_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *;
    `;
    const values = [
        codigo_referencia, 
        nombre, 
        unidad_medida || null, 
        cantidad || 0,
        lote || null,
        fecha_caducidad || null,
        categoria_id || null
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

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

// =========================================================================
// MÓDULO NUEVO: ENTRADA MASIVA DE CONSUMIBLES (Inbound)
// =========================================================================
const registrarEntradaMasiva = async (datosEntrada, detallesArray, usuarioId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Iniciamos la transacción

        // 1. Obtener y formatear el siguiente Folio de la secuencia
        const resFolio = await client.query("SELECT nextval('entrada_folio_seq') AS num");
        const numeroSecuencia = resFolio.rows[0].num;
        const folioEntrada = `ENT-${numeroSecuencia.toString().padStart(5, '0')}`; // Ej: ENT-00001

        // 2. Guardar la Cabecera (El Ticket)
        const insertCabeceraQuery = `
            INSERT INTO entrada_almacen (folio, usuario_id, observaciones)
            VALUES ($1, $2, $3)
            RETURNING id, folio, fecha_entrada;
        `;
        const resCabecera = await client.query(insertCabeceraQuery, [
            folioEntrada, 
            usuarioId, 
            datosEntrada.observaciones || null
        ]);
        const nuevaEntrada = resCabecera.rows[0];

        // 3. Guardar el Detalle y Sumar Stock (El carrito)
        for (let item of detallesArray) {
            // a) Guardar el registro en el historial de entradas
            const insertDetalleQuery = `
                INSERT INTO entrada_detalle (entrada_id, consumible_id, cantidad_ingresada, lote_ingresado, fecha_caducidad_ingresada)
                VALUES ($1, $2, $3, $4, $5);
            `;
            await client.query(insertDetalleQuery, [
                nuevaEntrada.id,
                item.consumible_id,
                item.cantidad,
                item.lote || null,
                item.fecha_caducidad || null
            ]);

            // b) Sumar el stock en la tabla principal de consumibles y actualizar Lote/Caducidad si vienen nuevos
            const updateStockQuery = `
                UPDATE consumible
                SET cantidad = cantidad + $1,
                    lote = COALESCE($2, lote), 
                    fecha_caducidad = COALESCE($3, fecha_caducidad)
                WHERE id = $4;
            `;
            await client.query(updateStockQuery, [
                item.cantidad,
                item.lote || null,
                item.fecha_caducidad || null,
                item.consumible_id
            ]);
        }

        await client.query('COMMIT'); // Todo salió bien, guardamos cambios
        return nuevaEntrada;

    } catch (error) {
        await client.query('ROLLBACK'); // Algo falló, cancelamos todo
        throw error;
    } finally {
        client.release();
    }
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

const createSetConComposicion = async (setData, composicionArray) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); 
        
        const { codigo, descripcion, estado_id, categoria_id } = setData;
        const insertSetQuery = `
            INSERT INTO sets (codigo, descripcion, estado_id, categoria_id) 
            VALUES ($1, $2, $3, $4) RETURNING *;
        `;
        const resSet = await client.query(insertSetQuery, [codigo, descripcion, estado_id || null, categoria_id || null]);
        const nuevoSet = resSet.rows[0];

        if (composicionArray && composicionArray.length > 0) {
            for (let item of composicionArray) {
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

const surtirPiezaSet = async (composicion_id, consumible_id, cantidad_a_surtir) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
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

// NUEVA EXPORTACIÓN AÑADIDA: registrarEntradaMasiva
module.exports = {
    getAllCategorias, createCategoria,
    getAllCategoriasConsumibles, createCategoriaConsumible, 
    getAllConsumibles, getConsumiblesByCategoria, createConsumible, updateStockConsumible, registrarEntradaMasiva,
    getAllPiezas, createPieza, updatePieza,
    getAllSets, getSetsByCategoria, createSet, createSetConComposicion, updateSet,
    getComposicionBySet, addPiezaToSet, removePiezaFromSet, surtirPiezaSet
};