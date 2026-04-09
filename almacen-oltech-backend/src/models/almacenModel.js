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

/**
 * ACTUALIZADO: El conteo ahora es honesto con la Regla de Oro.
 * Solo cuenta insumos con stock > 0 O insumos genéricos (sin lote ni fecha).
 */
const getAllCategoriasConsumibles = async () => {
    const query = `
        SELECT 
            cc.id, 
            cc.nombre, 
            COUNT(c.id) FILTER (
                WHERE c.cantidad > 0 OR (c.lote IS NULL AND c.fecha_caducidad IS NULL)
            )::int AS total_consumibles
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

/**
 * MODIFICADO: Ahora soporta filtro de limpieza (soloActivos)
 * soloActivos = true: Oculta lotes en 0. Muestra genéricos en 0 y todo lo que tenga stock.
 */
const getConsumiblesByCategoria = async (categoria_id, soloActivos = false) => {
    let filterClause = "WHERE c.categoria_id = $1";
    
    if (soloActivos) {
        // REGLA DE ORO: Mostrar si hay stock O si es un genérico (lote y fecha null)
        filterClause += " AND (c.cantidad > 0 OR (c.lote IS NULL AND c.fecha_caducidad IS NULL))";
    }

    const query = `
        SELECT 
            c.id, 
            c.codigo_referencia, 
            c.nombre, 
            c.nombre_comercial,
            c.precio,
            c.cantidad,
            c.unidad_medida,
            c.lote,
            c.fecha_caducidad,
            c.categoria_id,
            cc.nombre AS categoria_nombre
        FROM consumible c
        LEFT JOIN categoria_consumible cc ON c.categoria_id = cc.id
        ${filterClause}
        ORDER BY c.nombre ASC
    `;
    const { rows } = await pool.query(query, [categoria_id]);
    return rows;
};

const getAllConsumibles = async (soloActivos = false) => {
    let filterClause = "";
    
    if (soloActivos) {
        filterClause = "WHERE (c.cantidad > 0 OR (c.lote IS NULL AND c.fecha_caducidad IS NULL))";
    }

    const query = `
        SELECT 
            c.id, 
            c.codigo_referencia, 
            c.nombre, 
            c.nombre_comercial,
            c.precio,
            c.cantidad,
            c.unidad_medida,
            c.lote,
            c.fecha_caducidad,
            c.categoria_id,
            cc.nombre AS categoria_nombre
        FROM consumible c
        LEFT JOIN categoria_consumible cc ON c.categoria_id = cc.id
        ${filterClause}
        ORDER BY c.nombre ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

/**
 * NUEVA FUNCIÓN: Búsqueda Profunda
 * Sirve para encontrar un registro aunque esté oculto por stock 0.
 */
const getConsumibleByCodigoYLote = async (codigo, lote) => {
    const query = `
        SELECT * FROM consumible 
        WHERE codigo_referencia = $1 
        AND (lote = $2 OR (lote IS NULL AND $2 IS NULL))
        LIMIT 1;
    `;
    const { rows } = await pool.query(query, [codigo, lote]);
    return rows[0];
};

const createConsumible = async (data) => {
    const { codigo_referencia, nombre, unidad_medida, cantidad, lote, fecha_caducidad, categoria_id, nombre_comercial, precio } = data;
    const query = `
        INSERT INTO consumible (codigo_referencia, nombre, nombre_comercial, precio, unidad_medida, cantidad, lote, fecha_caducidad, categoria_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING *;
    `;
    const values = [
        codigo_referencia, 
        nombre, 
        nombre_comercial || null,
        precio !== undefined ? parseFloat(precio) : null,
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

// ==========================================
// NUEVAS FUNCIONES: EDICIÓN Y ELIMINACIÓN
// ==========================================

const updateConsumible = async (id, data) => {
    const { 
        codigo_referencia, 
        nombre, 
        nombre_comercial, 
        precio,           
        unidad_medida, 
        lote, 
        fecha_caducidad, 
        categoria_id 
    } = data;

    // NOTA: No incluimos 'cantidad' en el UPDATE para proteger el stock
    const query = `
        UPDATE consumible 
        SET 
            codigo_referencia = $1, 
            nombre = $2, 
            nombre_comercial = $3, 
            precio = $4, 
            unidad_medida = $5, 
            lote = $6, 
            fecha_caducidad = $7, 
            categoria_id = $8
        WHERE id = $9 
        RETURNING *;
    `;
    const values = [
        codigo_referencia, 
        nombre, 
        nombre_comercial || null, 
        precio !== undefined && precio !== null ? parseFloat(precio) : null, 
        unidad_medida || null, 
        lote || null, 
        fecha_caducidad || null, 
        categoria_id || null, 
        id
    ];

    const { rows } = await pool.query(query, values);
    return rows[0];
};

const deleteConsumible = async (id) => {
    // Si el registro está amarrado a una foreign key, PostgreSQL lanzará un error
    // que el controlador atrapará
    const query = `DELETE FROM consumible WHERE id = $1 RETURNING id;`;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
};

// =========================================================================
// MÓDULO: ENTRADA MASIVA DE CONSUMIBLES (Inbound)
// =========================================================================
const registrarEntradaMasiva = async (datosEntrada, detallesArray, usuarioId) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const resFolio = await client.query("SELECT nextval('entrada_folio_seq') AS num");
        const numeroSecuencia = resFolio.rows[0].num;
        const folioEntrada = `ENT-${numeroSecuencia.toString().padStart(5, '0')}`;

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

        for (let item of detallesArray) {
            // 1. Guardar en historial de entradas
            const insertDetalleQuery = `
                INSERT INTO entrada_detalle (entrada_id, consumible_id, cantidad_ingresada, lote_ingresado, fecha_caducidad_ingresada, precio_ingresado)
                VALUES ($1, $2, $3, $4, $5, $6);
            `;
            await client.query(insertDetalleQuery, [
                nuevaEntrada.id,
                item.consumible_id,
                item.cantidad,
                item.lote || null,
                item.fecha_caducidad || null,
                item.precio !== undefined && item.precio !== null ? parseFloat(item.precio) : null
            ]);

            // 2. Actualizar maestro (Sumar stock y actualizar datos informativos si vienen)
            const updateStockQuery = `
                UPDATE consumible
                SET cantidad = cantidad + $1,
                    lote = COALESCE($2, lote), 
                    fecha_caducidad = COALESCE($3, fecha_caducidad),
                    precio = COALESCE($4, precio)
                WHERE id = $5;
            `;
            await client.query(updateStockQuery, [
                item.cantidad,
                item.lote || null,
                item.fecha_caducidad || null,
                item.precio !== undefined && item.precio !== null ? parseFloat(item.precio) : null,
                item.consumible_id
            ]);
        }

        await client.query('COMMIT'); 
        return nuevaEntrada;

    } catch (error) {
        await client.query('ROLLBACK'); 
        throw error;
    } finally {
        client.release();
    }
};

const getDetallesEntrada = async (entrada_id) => {
    const query = `
        SELECT 
            ed.id AS detalle_id,
            ed.cantidad_ingresada,
            ed.lote_ingresado,
            ed.fecha_caducidad_ingresada,
            ed.precio_ingresado,
            c.codigo_referencia,
            c.nombre AS consumible_nombre,
            c.nombre_comercial,
            c.unidad_medida
        FROM entrada_detalle ed
        INNER JOIN consumible c ON ed.consumible_id = c.id
        WHERE ed.entrada_id = $1
        ORDER BY c.nombre ASC
    `;
    const { rows } = await pool.query(query, [entrada_id]);
    return rows;
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

// ==========================================
// NUEVA FUNCIÓN: OBTENER SETS INCOMPLETOS PARA DASHBOARD
// ==========================================
const getSetsIncompletos = async () => {
    // ACTUALIZADO: Utilizamos un CTE (UltimaRemision) para obtener SOLO 
    // la última remisión en la que participó cada set.
    // Esto evita mostrar historiales viejos o duplicados de cirugías pasadas.
    const query = `
        WITH UltimaRemision AS (
            SELECT set_id, MAX(remision_id) AS max_remision_id
            FROM remision_detalle
            WHERE set_id IS NOT NULL
            GROUP BY set_id
        )
        SELECT 
            s.id AS set_id,
            s.codigo AS set_codigo,
            s.descripcion AS set_descripcion,
            r.no_solicitud,
            r.fecha_cirugia,
            rd.cantidad_consumo,
            p.codigo AS pieza_codigo,
            p.descripcion AS pieza_descripcion
        FROM sets s
        INNER JOIN estados_set es ON s.estado_id = es.id
        INNER JOIN UltimaRemision ur ON s.id = ur.set_id
        INNER JOIN remision_detalle rd ON rd.set_id = s.id AND rd.remision_id = ur.max_remision_id
        INNER JOIN remision r ON rd.remision_id = r.id
        INNER JOIN piezas p ON rd.pieza_id = p.id
        WHERE es.nombre ILIKE '%incompleto%'
        AND rd.cantidad_consumo > 0
        ORDER BY r.fecha_cirugia DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
};

module.exports = {
    getAllCategorias, createCategoria,
    getAllCategoriasConsumibles, createCategoriaConsumible, 
    getAllConsumibles, getConsumiblesByCategoria, getConsumibleByCodigoYLote,
    createConsumible, updateStockConsumible, 
    updateConsumible, deleteConsumible, 
    registrarEntradaMasiva, getDetallesEntrada,
    getAllPiezas, createPieza, updatePieza,
    getAllSets, getSetsByCategoria, createSet, createSetConComposicion, updateSet,
    getComposicionBySet, addPiezaToSet, removePiezaFromSet, surtirPiezaSet,
    getSetsIncompletos 
};