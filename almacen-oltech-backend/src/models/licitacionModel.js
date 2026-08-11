// almacen-oltech-backend/src/models/licitacionModel.js
const pool = require('../config/database');

/**
 * Obtiene el inventario local (Consumibles y Sets) de una ciudad específica
 */
const getInventarioLocal = async (ciudad_id) => {
    // 1. Obtener Consumibles de la Ciudad
    const queryConsumibles = `
        SELECT 
            icc.id AS inventario_id,
            icc.cantidad,
            icc.lote,
            icc.fecha_caducidad,
            c.id,
            c.codigo_referencia,
            c.nombre,
            c.nombre_comercial,
            c.unidad_medida,
            c.precio
        FROM inventario_ciudad_consumible icc
        INNER JOIN consumible c ON icc.consumible_id = c.id
        WHERE icc.ciudad_id = $1
        ORDER BY c.nombre ASC
    `;
    const resConsumibles = await pool.query(queryConsumibles, [ciudad_id]);

    // 2. Obtener Sets de la Ciudad
    const querySets = `
        SELECT 
            ics.id AS inventario_id,
            ics.cantidad,
            s.id,
            s.codigo,
            s.descripcion,
            es.nombre AS estado_nombre
        FROM inventario_ciudad_set ics
        INNER JOIN sets s ON ics.set_id = s.id
        LEFT JOIN estados_set es ON ics.estado_id = es.id
        WHERE ics.ciudad_id = $1
        ORDER BY s.codigo ASC
    `;
    const resSets = await pool.query(querySets, [ciudad_id]);

    return {
        consumibles: resConsumibles.rows,
        sets: resSets.rows
    };
};

/**
 * Obtiene todas las hojas de consumo.
 * Filtra automáticamente por ciudad u hospital si se envían los parámetros (Soporte Multi-Nodos)
 */
const getHojasConsumo = async (filtros = {}) => {
    let query = `
        SELECT 
            hc.id,
            hc.folio,
            hc.fecha_creacion,
            hc.ciudad_id,
            c.nombre AS ciudad_nombre,
            hc.unidad_medica_id,
            um.nombre AS hospital_nombre,
            hc.paciente,
            hc.curp,
            hc.tipo_cirugia,
            hc.estado,
            hc.fecha_validacion,
            CONCAT_WS(' ', ut.nombre, ut.apellido_p) AS tecnico_nombre,
            CONCAT_WS(' ', ue.nombre, ue.apellido_p) AS encargado_nombre
        FROM hoja_consumo hc
        LEFT JOIN ciudades c ON hc.ciudad_id = c.id
        LEFT JOIN unidad_medica um ON hc.unidad_medica_id = um.id
        LEFT JOIN usuarios ut ON hc.usuario_tecnico_id = ut.id
        LEFT JOIN usuarios ue ON hc.usuario_encargado_id = ue.id
        WHERE 1=1
    `;
    
    const values = [];
    let contadorParams = 1;

    // Aislamiento Geográfico: Solo traemos lo de la ciudad/hospital correspondiente
    if (filtros.ciudad_id) {
        query += ` AND hc.ciudad_id = $${contadorParams}`;
        values.push(filtros.ciudad_id);
        contadorParams++;
    }
    
    if (filtros.unidad_medica_id) {
        query += ` AND hc.unidad_medica_id = $${contadorParams}`;
        values.push(filtros.unidad_medica_id);
        contadorParams++;
    }

    query += ` ORDER BY hc.fecha_creacion DESC`;

    const { rows } = await pool.query(query, values);
    return rows;
};

/**
 * Obtiene una hoja de consumo específica junto con todos sus insumos (catálogo y externos)
 */
const getHojaConsumoById = async (id) => {
    // 1. Traer la cabecera completa (Datos Clínicos)
    const queryCabecera = `
        SELECT hc.*, 
               c.nombre AS ciudad_nombre, 
               um.nombre AS hospital_nombre,
               m.nombre_completo AS medico_tratante_nombre,
               CONCAT_WS(' ', ut.nombre, ut.apellido_p) AS tecnico_nombre,
               CONCAT_WS(' ', ue.nombre, ue.apellido_p) AS encargado_nombre
        FROM hoja_consumo hc
        LEFT JOIN ciudades c ON hc.ciudad_id = c.id
        LEFT JOIN unidad_medica um ON hc.unidad_medica_id = um.id
        LEFT JOIN medicos m ON hc.medico_tratante_id = m.id
        LEFT JOIN usuarios ut ON hc.usuario_tecnico_id = ut.id
        LEFT JOIN usuarios ue ON hc.usuario_encargado_id = ue.id
        WHERE hc.id = $1
    `;
    const resCabecera = await pool.query(queryCabecera, [id]);
    const hoja = resCabecera.rows[0];

    if (!hoja) return null;

    // 2. Traer el detalle de consumos
    const queryDetalles = `
        SELECT 
            hcd.*,
            cat_c.codigo_referencia AS codigo_catalogo,
            cat_c.nombre AS nombre_catalogo,
            s.codigo AS set_codigo,
            p.codigo AS pieza_codigo,
            p.descripcion AS pieza_descripcion
        FROM hoja_consumo_detalle hcd
        LEFT JOIN consumible cat_c ON hcd.consumible_id = cat_c.id
        LEFT JOIN sets s ON hcd.set_id = s.id
        LEFT JOIN piezas p ON hcd.pieza_id = p.id
        WHERE hcd.hoja_consumo_id = $1
        ORDER BY hcd.id ASC
    `;
    const resDetalles = await pool.query(queryDetalles, [id]);
    
    hoja.detalles = resDetalles.rows;
    return hoja;
};

/**
 * Crea una nueva hoja de consumo y sus detalles usando una Transacción SQL
 */
const createHojaConsumo = async (hojaData, detalles) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN'); // Iniciamos blindaje de datos

        // 1. Insertar Cabecera
        const queryInsertHoja = `
            INSERT INTO hoja_consumo (
                folio, ciudad_id, unidad_medica_id, paciente, curp, 
                numero_contrato, clave_cie_10, clave_hraei, numero_renglon, tipo_cirugia, 
                medico_tratante_id, nombre_medico_adscrito, jefe_servicio, 
                usuario_tecnico_id, estado, observaciones
            ) VALUES (
                $1, $2, $3, $4, $5, 
                $6, $7, $8, $9, $10, 
                $11, $12, $13, 
                $14, $15, $16
            ) RETURNING id;
        `;
        
        const valuesHoja = [
            hojaData.folio, hojaData.ciudad_id, hojaData.unidad_medica_id, hojaData.paciente, hojaData.curp,
            hojaData.numero_contrato, hojaData.clave_cie_10, hojaData.clave_hraei, hojaData.numero_renglon, hojaData.tipo_cirugia,
            hojaData.medico_tratante_id || null, hojaData.nombre_medico_adscrito, hojaData.jefe_servicio,
            hojaData.usuario_tecnico_id, 'Pendiente Autorización', hojaData.observaciones || null
        ];

        const { rows } = await client.query(queryInsertHoja, valuesHoja);
        const hojaId = rows[0].id;

        // 2. Insertar Detalles (Insumos propios y externos)
        if (detalles && detalles.length > 0) {
            const queryInsertDetalle = `
                INSERT INTO hoja_consumo_detalle (
                    hoja_consumo_id, consumible_id, set_id, pieza_id, 
                    es_insumo_externo, descripcion_externa, proveedor_externo, 
                    cantidad_utilizada, unidad_medida, lote, fecha_caducidad, 
                    marca, modelo, pais_origen, fecha_fabricacion, precio_unitario
                ) VALUES (
                    $1, $2, $3, $4, 
                    $5, $6, $7, 
                    $8, $9, $10, $11, 
                    $12, $13, $14, $15, $16
                )
            `;

            for (let d of detalles) {
                await client.query(queryInsertDetalle, [
                    hojaId, d.consumible_id || null, d.set_id || null, d.pieza_id || null,
                    d.es_insumo_externo || false, d.descripcion_externa || null, d.proveedor_externo || null,
                    d.cantidad_utilizada, d.unidad_medida, d.lote || null, d.fecha_caducidad || null,
                    d.marca || null, d.modelo || null, d.pais_origen || null, d.fecha_fabricacion || null, d.precio_unitario || null
                ]);
            }
        }

        await client.query('COMMIT'); // Todo salió bien, guardamos
        return hojaId;

    } catch (error) {
        await client.query('ROLLBACK'); // Error detectado, abortamos todo
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Actualiza el estado de la hoja (Ej. El Encargado aprueba la hoja que subió el Técnico)
 */
const updateEstadoHoja = async (id, estado, usuario_encargado_id, observaciones_cierre) => {
    const query = `
        UPDATE hoja_consumo 
        SET estado = $1, 
            usuario_encargado_id = $2, 
            fecha_validacion = CURRENT_TIMESTAMP,
            observaciones = COALESCE(observaciones, '') || '\nValidación: ' || COALESCE($3, '')
        WHERE id = $4
        RETURNING id, estado;
    `;
    const { rows } = await pool.query(query, [estado, usuario_encargado_id, observaciones_cierre, id]);
    return rows[0];
};

/**
 * Registra la ruta del archivo firmado en la hoja de consumo
 */
const updateArchivoFirmado = async (id, nombreArchivo) => {
    const query = `
        UPDATE hoja_consumo 
        SET archivo_firmado = $1 
        WHERE id = $2 
        RETURNING id, archivo_firmado;
    `;
    const { rows } = await pool.query(query, [nombreArchivo, id]);
    return rows[0];
};

module.exports = {
    getInventarioLocal,
    getHojasConsumo,
    getHojaConsumoById,
    createHojaConsumo,
    updateEstadoHoja,
    updateArchivoFirmado // <--- Agregada
};

module.exports = {
    getInventarioLocal,
    getHojasConsumo,
    getHojaConsumoById,
    createHojaConsumo,
    updateEstadoHoja
};