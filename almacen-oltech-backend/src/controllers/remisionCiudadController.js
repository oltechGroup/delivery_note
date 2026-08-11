// almacen-oltech-backend/src/controllers/remisionCiudadController.js
const remisionCiudadModel = require('../models/remisionCiudadModel');
const pool = require('../config/database'); 

// ==========================================
// CONTROLADORES: REMISIONES DE CIUDAD (LOCALES)
// ==========================================

const obtenerRemisionesCiudad = async (req, res) => {
    try {
        const { ciudad_id, unidad_medica_id } = req.query;
        
        const filtros = {};
        if (ciudad_id) filtros.ciudad_id = parseInt(ciudad_id);
        if (unidad_medica_id) filtros.unidad_medica_id = parseInt(unidad_medica_id);

        // APLICACIÓN DE SEGURIDAD (Multi-Tenant):
        const rolesNacionales = ['Sistemas', 'Operaciones'];
        const esNacional = req.usuario.roles.some(r => rolesNacionales.includes(r));
        
        if (!esNacional && req.usuario.sedes && req.usuario.sedes.length > 0) {
            // Forzamos a que solo vea las remisiones de su propia sede
            if (!filtros.ciudad_id) filtros.ciudad_id = req.usuario.sedes[0].ciudad_id;
            if (!filtros.unidad_medica_id) filtros.unidad_medica_id = req.usuario.sedes[0].unidad_medica_id;
        }

        const remisiones = await remisionCiudadModel.getAllRemisionesCiudad(filtros);
        res.json(remisiones);
    } catch (error) {
        console.error('Error al obtener remisiones locales:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar las remisiones de la sede.' });
    }
};

const obtenerRemisionCiudadPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const remision = await remisionCiudadModel.getRemisionCiudadById(id);
        
        if (!remision) {
            return res.status(404).json({ mensaje: 'La remisión solicitada no existe o pertenece a otra sede.' });
        }
        
        res.json(remision);
    } catch (error) {
        console.error('Error al obtener la remisión local:', error);
        res.status(500).json({ mensaje: 'Error interno al buscar los detalles de la remisión.' });
    }
};

const crearRemisionCiudad = async (req, res) => {
    const client = await pool.connect();

    try {
        const { 
            no_solicitud, 
            fecha_cirugia, 
            paciente, 
            cliente, 
            procedimiento_id, 
            medico_id, 
            detalles 
        } = req.body;

        const usuario_creador_id = req.usuario.id;
        
        // Obtenemos la sede del usuario que está creando para aislar la data
        const sedeUsuario = req.usuario.sedes && req.usuario.sedes.length > 0 
            ? req.usuario.sedes[0] 
            : { ciudad_id: null, unidad_medica_id: null };

        if (!sedeUsuario.ciudad_id) {
            return res.status(403).json({ mensaje: 'No puedes crear remisiones locales porque no tienes una sede asignada.' });
        }

        await client.query('BEGIN'); 

        const queryRemision = `
            INSERT INTO remision_ciudad 
            (no_solicitud, fecha_cirugia, paciente, cliente, procedimiento_id, medico_id, unidad_medica_id, ciudad_id, usuario_creador_id, estado_remision_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            RETURNING *;
        `;
        const valuesRemision = [
            no_solicitud || null, fecha_cirugia || null, paciente || null, cliente || null,
            procedimiento_id || null, medico_id || null, 
            sedeUsuario.unidad_medica_id, sedeUsuario.ciudad_id, // <-- Datos geográficos
            usuario_creador_id, 1 
        ];
        
        const { rows: remisionRows } = await client.query(queryRemision, valuesRemision);
        const nuevaRemision = remisionRows[0];

        if (detalles && detalles.length > 0) {
            const queryDetalle = `
                INSERT INTO remision_ciudad_detalle 
                (remision_ciudad_id, set_id, pieza_id, consumible_id, cantidad_despachada, lote, fecha_caducidad, orden, es_total, descripcion_custom) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `;
            
            // Aquí usamos 'estados_set' global ya que los estados son compartidos, pero el Set es local.
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

                // Si se despachó un set, cambiar el estado del SET en el inventario local
                if (item.set_id && estadoNoDisponibleId && !item.es_total) {
                    await client.query(`
                        UPDATE inventario_ciudad_set 
                        SET estado_id = $1 
                        WHERE set_id = $2 AND ciudad_id = $3
                    `, [estadoNoDisponibleId, item.set_id, sedeUsuario.ciudad_id]);
                }

                // Si se despachó un consumible suelto, descontarlo del inventario local
                if (item.consumible_id && !item.set_id && !item.es_total) {
                    await client.query(`
                        UPDATE inventario_ciudad_consumible 
                        SET cantidad = cantidad - $1 
                        WHERE consumible_id = $2 AND ciudad_id = $3
                    `, [item.cantidad_despachada, item.consumible_id, sedeUsuario.ciudad_id]);
                }
            }
        }

        await client.query('COMMIT'); 

        res.status(201).json({
            mensaje: 'Remisión de sede creada exitosamente.',
            remision: nuevaRemision
        });

    } catch (error) {
        await client.query('ROLLBACK'); 
        console.error('Error al crear remisión local (Transacción cancelada):', error);
        
        if (error.code === '23505') {
            return res.status(400).json({ mensaje: 'El número de solicitud ingresado ya existe en otra remisión.' });
        }
        res.status(500).json({ mensaje: 'Error interno. Se han revertido los cambios por seguridad.' });
    } finally {
        client.release(); 
    }
};

const actualizarEstadoRemisionCiudad = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado_remision_id } = req.body;

        if (!estado_remision_id) {
            return res.status(400).json({ mensaje: 'El nuevo estado es requerido.' });
        }

        const remisionActualizada = await remisionCiudadModel.updateEstadoRemisionCiudad(id, estado_remision_id);
        
        if (!remisionActualizada) {
            return res.status(404).json({ mensaje: 'Remisión local no encontrada.' });
        }

        res.json({
            mensaje: 'Estado de la remisión de sede actualizado.',
            remision: remisionActualizada
        });
    } catch (error) {
        console.error('Error al actualizar estado local:', error);
        res.status(500).json({ mensaje: 'Error interno al cambiar el estado de la remisión.' });
    }
};

const obtenerDetallesRemisionCiudad = async (req, res) => {
    try {
        const { remision_id } = req.params;
        const detalles = await remisionCiudadModel.getDetallesByRemisionCiudad(remision_id);
        res.json(detalles);
    } catch (error) {
        console.error('Error al obtener detalles locales:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar los detalles de la remisión.' });
    }
};

const actualizarCantidadesRetornoCiudad = async (req, res) => {
    try {
        const { id } = req.params; 
        const { cantidad_consumo, cantidad_retorno } = req.body;

        const consumo = cantidad_consumo || 0;
        const retorno = cantidad_retorno || 0;

        const detalleActualizado = await remisionCiudadModel.updateCantidadesDetalleCiudad(id, {
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
        console.error('Error al actualizar cantidades locales:', error);
        res.status(500).json({ mensaje: 'Error interno al registrar el retorno/consumo.' });
    }
};

// ==========================================
// CONCILIACIÓN LOCAL (Ajusta stock local)
// ==========================================
const conciliarRemisionCiudad = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { detalles, reposiciones, observaciones } = req.body; 
        const usuario_conciliador_id = req.usuario.id; 

        // Recuperar la remisión para saber de qué ciudad es
        const { rows: remRows } = await client.query(`SELECT ciudad_id FROM remision_ciudad WHERE id = $1`, [id]);
        if (remRows.length === 0) throw new Error('Remisión no encontrada.');
        const ciudadId = remRows[0].ciudad_id;

        await client.query('BEGIN');

        // 1. Cambiar estado
        const { rows: estadoRows } = await client.query(`SELECT id FROM estado_remision WHERE nombre ILIKE '%finalizada%' LIMIT 1`);
        const estadoFinalizadaId = estadoRows.length > 0 ? estadoRows[0].id : 3; 
        
        await client.query(`
            UPDATE remision_ciudad 
            SET estado_remision_id = $1, usuario_conciliador_id = $2, fecha_conciliacion = CURRENT_TIMESTAMP, observaciones = $3
            WHERE id = $4
        `, [estadoFinalizadaId, usuario_conciliador_id, observaciones || null, id]);

        const { rows: estDispRows } = await client.query(`SELECT id FROM estados_set WHERE nombre ILIKE '%disponible%' LIMIT 1`);
        const { rows: estIncompRows } = await client.query(`SELECT id FROM estados_set WHERE nombre ILIKE '%incompleto%' LIMIT 1`);
        const estadoSetDisponibleId = estDispRows.length > 0 ? estDispRows[0].id : 1;
        const estadoSetIncompletoId = estIncompRows.length > 0 ? estIncompRows[0].id : 4;
        
        const setsActualizados = new Set(); 

        // 3. Procesar Detalles
        for (let item of detalles) {
            if(item.es_total) continue;
            const cantConsumo = parseInt(item.cantidad_consumo) || 0;
            const cantRetorno = parseInt(item.cantidad_retorno) || 0;

            await client.query(`
                UPDATE remision_ciudad_detalle 
                SET cantidad_consumo = $1, cantidad_retorno = $2 
                WHERE id = $3
            `, [cantConsumo, cantRetorno, item.id]);

            // Devolver al stock local suelto
            if (item.consumible_id && !item.set_id && cantRetorno > 0) {
                await client.query(`
                    UPDATE inventario_ciudad_consumible 
                    SET cantidad = cantidad + $1 
                    WHERE consumible_id = $2 AND ciudad_id = $3
                `, [cantRetorno, item.consumible_id, ciudadId]);
            }

            // Descontar piezas de la caja
            if (item.set_id && item.pieza_id && cantConsumo > 0) {
                await client.query(`
                    UPDATE set_composicion 
                    SET cantidad_pieza = cantidad_pieza - $1 
                    WHERE set_id = $2 AND pieza_id = $3
                `, [cantConsumo, item.set_id, item.pieza_id]);
                setsActualizados.add(item.set_id);
            }
            else if (item.set_id) { setsActualizados.add(item.set_id); }
        }

        // 4. Reposiciones
        let reposicionPorSet = {};
        if (reposiciones && reposiciones.length > 0) {
            for (let repo of reposiciones) {
                const cantSurtir = parseInt(repo.cantidad_a_surtir) || 0;
                if (cantSurtir <= 0) continue;

                const detalleOriginal = detalles.find(d => d.id === repo.detalle_id);
                const setIdDestino = detalleOriginal.set_id;
                const piezaIdDestino = detalleOriginal.pieza_id;

                if (repo.tipo === 'consumible') {
                    const resCons = await client.query(`
                        UPDATE inventario_ciudad_consumible 
                        SET cantidad = cantidad - $1 
                        WHERE consumible_id = $2 AND ciudad_id = $3 AND cantidad >= $1 RETURNING id
                    `, [cantSurtir, repo.consumible_id, ciudadId]);
                    
                    if (resCons.rows.length === 0) throw new Error(`Stock insuficiente en almacén local.`);
                }

                if (piezaIdDestino) {
                    await client.query(`
                        UPDATE set_composicion 
                        SET cantidad_pieza = cantidad_pieza + $1 
                        WHERE set_id = $2 AND pieza_id = $3
                    `, [cantSurtir, setIdDestino, piezaIdDestino]);
                }
                reposicionPorSet[setIdDestino] = (reposicionPorSet[setIdDestino] || 0) + cantSurtir;
            }
        }

        // 5. Estado final del Set Local
        for (let setId of setsActualizados) {
            const totalConsumo = detalles.filter(d => d.set_id === setId && !d.es_total).reduce((acc, curr) => acc + (parseInt(curr.cantidad_consumo) || 0), 0);
            const totalRepuesto = reposicionPorSet[setId] || 0;
            const estadoFinalSet = (totalConsumo > 0 && totalRepuesto < totalConsumo) ? estadoSetIncompletoId : estadoSetDisponibleId;
            
            await client.query(`UPDATE inventario_ciudad_set SET estado_id = $1 WHERE set_id = $2 AND ciudad_id = $3`, [estadoFinalSet, setId, ciudadId]);
        }

        await client.query('COMMIT');
        res.json({ mensaje: 'Remisión local conciliada exitosamente.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al conciliar remisión local:', error);
        res.status(500).json({ mensaje: error.message || 'Error al conciliar la remisión local.' });
    } finally {
        client.release();
    }
};

module.exports = {
    obtenerRemisionesCiudad,
    obtenerRemisionCiudadPorId,
    crearRemisionCiudad,
    actualizarEstadoRemisionCiudad,
    obtenerDetallesRemisionCiudad,
    actualizarCantidadesRetornoCiudad,
    conciliarRemisionCiudad 
};