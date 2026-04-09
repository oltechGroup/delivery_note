// almacen-oltech-backend/src/controllers/remisionController.js
const remisionModel = require('../models/remisionModel');
const pool = require('../config/database'); 

// ==========================================
// CONTROLADORES: PROCEDIMIENTOS Y CATÁLOGOS BASE
// ==========================================

const obtenerProcedimientos = async (req, res) => {
    try {
        const procedimientos = await remisionModel.getAllProcedimientos();
        res.json(procedimientos);
    } catch (error) {
        console.error('Error al obtener procedimientos:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar los procedimientos.' });
    }
};

const crearProcedimiento = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) {
            return res.status(400).json({ mensaje: 'El nombre del procedimiento es obligatorio.' });
        }
        
        const nuevoProcedimiento = await remisionModel.createProcedimiento(nombre);
        res.status(201).json({
            mensaje: 'Procedimiento registrado exitosamente.',
            procedimiento: nuevoProcedimiento 
        });
    } catch (error) {
        console.error('Error al crear procedimiento:', error);
        res.status(500).json({ mensaje: 'Error interno al registrar el procedimiento.' });
    }
};

const obtenerMedicos = async (req, res) => {
    try {
        const query = 'SELECT id, nombre_completo FROM medicos ORDER BY nombre_completo ASC';
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener médicos:', error);
        res.status(500).json({ mensaje: 'Error al cargar el catálogo de médicos.' });
    }
};

const obtenerUnidadesMedicas = async (req, res) => {
    try {
        const query = 'SELECT id, nombre FROM unidad_medica ORDER BY nombre ASC';
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener hospitales:', error);
        res.status(500).json({ mensaje: 'Error al cargar el catálogo de hospitales.' });
    }
};

// ==========================================
// CONTROLADORES: REMISIONES MAESTRAS (CON TRANSACCIONES)
// ==========================================

const obtenerRemisiones = async (req, res) => {
    try {
        const remisiones = await remisionModel.getAllRemisiones();
        res.json(remisiones);
    } catch (error) {
        console.error('Error al obtener remisiones:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar las remisiones.' });
    }
};

const obtenerRemisionPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const remision = await remisionModel.getRemisionById(id);
        
        if (!remision) {
            return res.status(404).json({ mensaje: 'La remisión solicitada no existe.' });
        }
        
        res.json(remision);
    } catch (error) {
        console.error('Error al obtener la remisión:', error);
        res.status(500).json({ mensaje: 'Error interno al buscar la remisión.' });
    }
};

const crearRemision = async (req, res) => {
    const client = await pool.connect();

    try {
        const { 
            no_solicitud, 
            fecha_cirugia, 
            paciente, 
            cliente, 
            procedimiento_id, 
            medico_id, 
            unidad_medica_id,
            detalles 
        } = req.body;

        const usuario_creador_id = req.usuario.id;

        await client.query('BEGIN'); 

        const queryRemision = `
            INSERT INTO remision 
            (no_solicitud, fecha_cirugia, paciente, cliente, procedimiento_id, medico_id, unidad_medica_id, usuario_creador_id, estado_remision_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *;
        `;
        const valuesRemision = [
            no_solicitud || null, fecha_cirugia || null, paciente || null, cliente || null,
            procedimiento_id || null, medico_id || null, unidad_medica_id || null, 
            usuario_creador_id, 1 
        ];
        
        const { rows: remisionRows } = await client.query(queryRemision, valuesRemision);
        const nuevaRemision = remisionRows[0];

        if (detalles && detalles.length > 0) {
            const queryDetalle = `
                INSERT INTO remision_detalle (remision_id, set_id, pieza_id, consumible_id, cantidad_despachada, lote, fecha_caducidad, orden, es_total, descripcion_custom) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `;
            
            const { rows: estadoRows } = await client.query(`SELECT id FROM estados_set WHERE nombre ILIKE '%no disponible%' LIMIT 1`);
            const estadoNoDisponibleId = estadoRows.length > 0 ? estadoRows[0].id : null;

            for (let item of detalles) {
                await client.query(queryDetalle, [
                    nuevaRemision.id, 
                    item.set_id || null, 
                    item.pieza_id || null, 
                    item.consumible_id || null, 
                    item.cantidad_despachada || 0,
                    item.lote || null,
                    item.fecha_caducidad || null,
                    item.orden || 0,
                    item.es_total || false,
                    item.descripcion_custom || null
                ]);

                if (item.set_id && estadoNoDisponibleId && !item.es_total) {
                    await client.query(`UPDATE sets SET estado_id = $1 WHERE id = $2`, [estadoNoDisponibleId, item.set_id]);
                }

                if (item.consumible_id && !item.set_id && !item.es_total) {
                    await client.query(`
                        UPDATE consumible 
                        SET cantidad = cantidad - $1 
                        WHERE id = $2
                    `, [item.cantidad_despachada, item.consumible_id]);
                }
            }
        }

        await client.query('COMMIT'); 

        res.status(201).json({
            mensaje: 'Remisión creada y asegurada exitosamente.',
            remision: nuevaRemision
        });

    } catch (error) {
        await client.query('ROLLBACK'); 
        console.error('Error al crear remisión (Transacción cancelada):', error);
        
        if (error.code === '23505') {
            return res.status(400).json({ mensaje: 'El número de solicitud ingresado ya existe en otra remisión.' });
        }
        res.status(500).json({ mensaje: 'Error interno. Se han revertido los cambios por seguridad.' });
    } finally {
        client.release(); 
    }
};

const actualizarEstadoRemision = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado_remision_id } = req.body;

        if (!estado_remision_id) {
            return res.status(400).json({ mensaje: 'El nuevo estado es requerido.' });
        }

        const remisionActualizada = await remisionModel.updateEstadoRemision(id, estado_remision_id);
        
        if (!remisionActualizada) {
            return res.status(404).json({ mensaje: 'Remisión no encontrada.' });
        }

        res.json({
            mensaje: 'Estado de la remisión actualizado.',
            remision: remisionActualizada
        });
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        res.status(500).json({ mensaje: 'Error interno al cambiar el estado de la remisión.' });
    }
};

// ==========================================
// CONTROLADORES: DETALLES DE REMISIÓN Y CONCILIACIÓN
// ==========================================

const obtenerDetallesRemision = async (req, res) => {
    try {
        const { remision_id } = req.params;
        const detalles = await remisionModel.getDetallesByRemision(remision_id);
        res.json(detalles);
    } catch (error) {
        console.error('Error al obtener detalles:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar los detalles de la remisión.' });
    }
};

const agregarDetalleRemision = async (req, res) => {
    try {
        const { remision_id } = req.params;
        const { set_id, pieza_id, consumible_id, cantidad_despachada } = req.body;

        if (!cantidad_despachada || (!set_id && !pieza_id && !consumible_id)) {
            return res.status(400).json({ 
                mensaje: 'Se requiere especificar la cantidad y seleccionar al menos un Set, Pieza o Consumible.' 
            });
        }

        const nuevoDetalle = await remisionModel.addDetalleRemision({
            remision_id, set_id, pieza_id, consumible_id, cantidad_despachada
        });

        res.status(201).json({
            mensaje: 'Ítem agregado a la remisión.',
            detalle: nuevoDetalle
        });
    } catch (error) {
        console.error('Error al agregar detalle:', error);
        res.status(500).json({ mensaje: 'Error interno al agregar el ítem a la remisión.' });
    }
};

const actualizarCantidadesRetorno = async (req, res) => {
    try {
        const { id } = req.params; 
        const { cantidad_consumo, cantidad_retorno } = req.body;

        const consumo = cantidad_consumo || 0;
        const retorno = cantidad_retorno || 0;

        const detalleActualizado = await remisionModel.updateCantidadesDetalle(id, {
            cantidad_consumo: consumo,
            cantidad_retorno: retorno
        });

        if (!detalleActualizado) {
            return res.status(404).json({ mensaje: 'Registro de detalle no encontrado.' });
        }

        res.json({
            mensaje: 'Cantidades actualizadas (Retorno/Consumo).',
            detalle: detalleActualizado
        });
    } catch (error) {
        console.error('Error al actualizar cantidades:', error);
        res.status(500).json({ mensaje: 'Error interno al registrar el retorno/consumo.' });
    }
};

// ==========================================
// NUEVA SÚPER FUNCIÓN: CONCILIAR REMISIÓN (ACTUALIZADA LÓGICA INCOMPLETO Y RESTA EN CAJA)
// ==========================================
const conciliarRemision = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { detalles, reposiciones } = req.body; 
        const usuario_conciliador_id = req.usuario.id; 

        await client.query('BEGIN');

        // 1. Cambiar estado de la remisión a Finalizada
        const { rows: estadoRows } = await client.query(`SELECT id FROM estado_remision WHERE nombre ILIKE '%finalizada%' OR nombre ILIKE '%completad%' OR nombre ILIKE '%cerrad%' LIMIT 1`);
        const estadoFinalizadaId = estadoRows.length > 0 ? estadoRows[0].id : 3; 
        
        await client.query(`
            UPDATE remision 
            SET estado_remision_id = $1,
                usuario_conciliador_id = $2,
                fecha_conciliacion = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [estadoFinalizadaId, usuario_conciliador_id, id]);

        // 2. Obtener IDs de los posibles estados de los Sets
        const { rows: estDispRows } = await client.query(`SELECT id FROM estados_set WHERE nombre ILIKE '%disponible%' LIMIT 1`);
        const { rows: estIncompRows } = await client.query(`SELECT id FROM estados_set WHERE nombre ILIKE '%incompleto%' LIMIT 1`);
        
        const estadoSetDisponibleId = estDispRows.length > 0 ? estDispRows[0].id : 1;
        const estadoSetIncompletoId = estIncompRows.length > 0 ? estIncompRows[0].id : 4;
        
        const setsActualizados = new Set(); 

        // 3. Procesar Detalles (Anotar consumos y retornos)
        for (let item of detalles) {
            if(item.es_total) continue;

            const cantConsumo = parseInt(item.cantidad_consumo) || 0;
            const cantRetorno = parseInt(item.cantidad_retorno) || 0;

            await client.query(`
                UPDATE remision_detalle 
                SET cantidad_consumo = $1, cantidad_retorno = $2 
                WHERE id = $3
            `, [cantConsumo, cantRetorno, item.id]);

            // Consumible Suelto: SUMAR lo que retornó de vuelta al inventario a granel
            if (item.consumible_id && !item.set_id && cantRetorno > 0) {
                await client.query(`
                    UPDATE consumible 
                    SET cantidad = cantidad + $1 
                    WHERE id = $2
                `, [cantRetorno, item.consumible_id]);
            }

            // NUEVO: Si la pieza consumida PERTENECE A UN SET, se la restamos a la caja.
            if (item.set_id && item.pieza_id && cantConsumo > 0) {
                await client.query(`
                    UPDATE set_composicion 
                    SET cantidad_pieza = cantidad_pieza - $1 
                    WHERE set_id = $2 AND pieza_id = $3
                `, [cantConsumo, item.set_id, item.pieza_id]);
                
                setsActualizados.add(item.set_id);
            }
            // Por si acaso no hubo consumo, pero necesitamos recordar el set para cambiarle el estado al final
            else if (item.set_id) {
                 setsActualizados.add(item.set_id);
            }
        }

        // 4. Procesar Reposiciones (Lo que hayan metido a la caja EN ESTE MOMENTO)
        let totalRepuestoGeneral = 0;
        if (reposiciones && reposiciones.length > 0) {
            for (let repo of reposiciones) {
                const cantSurtir = parseInt(repo.cantidad_a_surtir) || 0;
                
                // Restamos del inventario a granel (para rellenar la caja física)
                const resConsumible = await client.query(`
                    UPDATE consumible 
                    SET cantidad = cantidad - $1 
                    WHERE id = $2 AND cantidad >= $1
                    RETURNING id
                `, [cantSurtir, repo.consumible_id]);

                if (resConsumible.rows.length === 0) {
                    throw new Error(`Stock insuficiente en inventario para reponer (ID Consumible: ${repo.consumible_id}).`);
                }
                totalRepuestoGeneral += cantSurtir;
            }
        }

        // 5. Liberar los Sets (Disponible o Incompleto)
        for (let setId of setsActualizados) {
            // Sumamos todo el consumo registrado para este set específico en esta remisión
            const totalConsumoDelSet = detalles
                .filter(d => d.set_id === setId && !d.es_total)
                .reduce((acc, curr) => acc + (parseInt(curr.cantidad_consumo) || 0), 0);

            let estadoFinalSet = estadoSetDisponibleId;

            // REGLA: Si el set tuvo consumo y el total repuesto en esta transacción 
            // no cubre el total consumido de este set, queda como INCOMPLETO.
            if (totalConsumoDelSet > 0 && totalRepuestoGeneral < totalConsumoDelSet) {
                estadoFinalSet = estadoSetIncompletoId;
            }

            await client.query(`UPDATE sets SET estado_id = $1 WHERE id = $2`, [estadoFinalSet, setId]);
        }

        await client.query('COMMIT');
        res.json({ mensaje: 'Remisión conciliada exitosamente. Se ha actualizado el estado de los equipos e inventario.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al conciliar remisión:', error);
        res.status(500).json({ mensaje: error.message || 'Error al conciliar la remisión.' });
    } finally {
        client.release();
    }
};

module.exports = {
    obtenerProcedimientos,
    crearProcedimiento,
    obtenerMedicos,
    obtenerUnidadesMedicas,
    obtenerRemisiones,
    obtenerRemisionPorId,
    crearRemision,
    actualizarEstadoRemision,
    obtenerDetallesRemision,
    agregarDetalleRemision,
    actualizarCantidadesRetorno,
    conciliarRemision 
};