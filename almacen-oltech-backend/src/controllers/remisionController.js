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
            procedimiento_id, 
            medico_id, 
            unidad_medica_id,
            detalles 
        } = req.body;

        const usuario_creador_id = req.usuario.id;

        await client.query('BEGIN'); 

        const queryRemision = `
            INSERT INTO remision 
            (no_solicitud, fecha_cirugia, paciente, procedimiento_id, medico_id, unidad_medica_id, usuario_creador_id, estado_remision_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *;
        `;
        const valuesRemision = [
            no_solicitud || null, fecha_cirugia || null, paciente || null, 
            procedimiento_id || null, medico_id || null, unidad_medica_id || null, 
            usuario_creador_id, 1 
        ];
        
        const { rows: remisionRows } = await client.query(queryRemision, valuesRemision);
        const nuevaRemision = remisionRows[0];

        if (detalles && detalles.length > 0) {
            const queryDetalle = `
                INSERT INTO remision_detalle (remision_id, set_id, pieza_id, consumible_id, cantidad_despachada) 
                VALUES ($1, $2, $3, $4, $5)
            `;
            
            const { rows: estadoRows } = await client.query(`SELECT id FROM estados_set WHERE nombre ILIKE '%no disponible%' LIMIT 1`);
            const estadoNoDisponibleId = estadoRows.length > 0 ? estadoRows[0].id : null;

            for (let item of detalles) {
                await client.query(queryDetalle, [
                    nuevaRemision.id, 
                    item.set_id || null, 
                    item.pieza_id || null, 
                    item.consumible_id || null, 
                    item.cantidad_despachada
                ]);

                if (item.set_id && estadoNoDisponibleId) {
                    await client.query(`UPDATE sets SET estado_id = $1 WHERE id = $2`, [estadoNoDisponibleId, item.set_id]);
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

// NUEVA SÚPER FUNCIÓN: Conciliar la remisión completa
const conciliarRemision = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { detalles } = req.body; // Recibe un arreglo con todos los consumos

        await client.query('BEGIN');

        // 1. Cambiar estado de la remisión a Completada/Cerrada
        const { rows: estadoRows } = await client.query(`SELECT id FROM estado_remision WHERE nombre ILIKE '%completad%' OR nombre ILIKE '%cerrad%' LIMIT 1`);
        const estadoCompletadoId = estadoRows.length > 0 ? estadoRows[0].id : 2; 
        await client.query(`UPDATE remision SET estado_remision_id = $1 WHERE id = $2`, [estadoCompletadoId, id]);

        // 2. Variables para procesar inventario
        const { rows: estadoSetRows } = await client.query(`SELECT id FROM estados_set WHERE nombre ILIKE '%disponible%' OR nombre ILIKE '%activo%' LIMIT 1`);
        const estadoSetDisponibleId = estadoSetRows.length > 0 ? estadoSetRows[0].id : 1;
        const setsActualizados = new Set(); 

        for (let item of detalles) {
            // A. Actualizar el renglón con los consumos y retornos
            await client.query(`
                UPDATE remision_detalle 
                SET cantidad_consumo = $1, cantidad_retorno = $2 
                WHERE id = $3
            `, [item.cantidad_consumo || 0, item.cantidad_retorno || 0, item.id]);

            // B. Si es un CONSUMIBLE SUELTO, lo restamos directamente del inventario maestro
            if (item.consumible_id && !item.set_id && item.cantidad_consumo > 0) {
                await client.query(`
                    UPDATE consumible 
                    SET cantidad = cantidad - $1 
                    WHERE id = $2
                `, [item.cantidad_consumo, item.consumible_id]);
            }

            // C. Liberar el Set (Cambiarlo a Disponible)
            // Nota: Asumimos que la UI ya guio a la encargada a "surtir" las piezas faltantes antes de este paso
            if (item.set_id && !setsActualizados.has(item.set_id)) {
                await client.query(`UPDATE sets SET estado_id = $1 WHERE id = $2`, [estadoSetDisponibleId, item.set_id]);
                setsActualizados.add(item.set_id);
            }
        }

        await client.query('COMMIT');
        res.json({ mensaje: 'Remisión conciliada exitosamente. Inventario actualizado y Sets liberados.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al conciliar remisión:', error);
        res.status(500).json({ mensaje: 'Error al conciliar la remisión. Se canceló la operación.' });
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
    conciliarRemision // <-- Expuesta al enrutador
};