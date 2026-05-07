// almacen-oltech-backend/src/models/ticketModel.js
const pool = require('../config/database');

/**
 * Crea un nuevo ticket, guarda sus imágenes y registra el movimiento en el historial.
 * Usamos una TRANSACCIÓN (BEGIN/COMMIT) para asegurar que todo se guarde o no se guarde nada si hay error.
 */
const crearTicket = async (datosTicket, imagenesBase64, idUsuarioCreador) => {
    const { asunto, descripcion, prioridad_id } = datosTicket;
    const estadoInicial = 1; // 1 = 'Abierto'

    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Iniciamos la transacción

        // 1. Insertar el ticket principal
        const queryTicket = `
            INSERT INTO tickets (asunto, descripcion, prioridad_id, estado_id, usuario_creador_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id;
        `;
        const { rows } = await client.query(queryTicket, [asunto, descripcion, prioridad_id, estadoInicial, idUsuarioCreador]);
        const ticketId = rows[0].id;

        // 2. Insertar las imágenes (si es que el usuario adjuntó alguna)
        if (imagenesBase64 && imagenesBase64.length > 0) {
            const queryImagen = `
                INSERT INTO ticket_imagenes (ticket_id, imagen_base64)
                VALUES ($1, $2);
            `;
            for (let img of imagenesBase64) {
                await client.query(queryImagen, [ticketId, img]);
            }
        }

        // 3. Registrar en el historial que se creó el ticket
        const queryHistorial = `
            INSERT INTO ticket_historial (ticket_id, usuario_accion_id, accion, detalles)
            VALUES ($1, $2, $3, $4);
        `;
        await client.query(queryHistorial, [ticketId, idUsuarioCreador, 'Creación', 'El usuario levantó un nuevo ticket de soporte.']);

        await client.query('COMMIT'); // Confirmamos los cambios
        return ticketId;
    } catch (error) {
        await client.query('ROLLBACK'); // Si hay error, deshacemos todo para no dejar basura
        throw error;
    } finally {
        client.release(); // Liberamos la conexión a la base de datos
    }
};

/**
 * Obtiene la lista de tickets que creó un usuario en específico (Para usuarios normales)
 */
const obtenerTicketsPorUsuario = async (idUsuario) => {
    const query = `
        SELECT 
            t.id, t.asunto, t.fecha_creacion, t.fecha_resolucion,
            p.nombre AS prioridad_nombre,
            e.nombre AS estado_nombre,
            u_asignado.nombre AS asignado_nombre
        FROM tickets t
        INNER JOIN prioridad_ticket p ON t.prioridad_id = p.id
        INNER JOIN estado_ticket e ON t.estado_id = e.id
        LEFT JOIN usuarios u_asignado ON t.usuario_asignado_id = u_asignado.id
        WHERE t.usuario_creador_id = $1
        ORDER BY t.fecha_creacion DESC;
    `;
    const { rows } = await pool.query(query, [idUsuario]);
    return rows;
};

/**
 * Obtiene TODOS los tickets del sistema (Para el panel de "Sistemas")
 */
const obtenerTodosLosTickets = async () => {
    const query = `
        SELECT 
            t.id, t.asunto, t.fecha_creacion, t.fecha_resolucion,
            p.nombre AS prioridad_nombre,
            e.nombre AS estado_nombre,
            u_creador.nombre AS creador_nombre,
            u_creador.user_name AS creador_username,
            u_asignado.nombre AS asignado_nombre
        FROM tickets t
        INNER JOIN prioridad_ticket p ON t.prioridad_id = p.id
        INNER JOIN estado_ticket e ON t.estado_id = e.id
        INNER JOIN usuarios u_creador ON t.usuario_creador_id = u_creador.id
        LEFT JOIN usuarios u_asignado ON t.usuario_asignado_id = u_asignado.id
        ORDER BY t.fecha_creacion DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
};

/**
 * Obtiene TODO el detalle de un ticket específico: Info, Imágenes y su Historial
 */
const obtenerDetalleTicket = async (idTicket) => {
    // 1. Info principal del ticket
    const queryTicket = `
        SELECT 
            t.*,
            p.nombre AS prioridad_nombre,
            e.nombre AS estado_nombre,
            u_creador.nombre AS creador_nombre,
            u_creador.user_name AS creador_username,
            r.nombre AS creador_rol,
            u_asignado.nombre AS asignado_nombre
        FROM tickets t
        INNER JOIN prioridad_ticket p ON t.prioridad_id = p.id
        INNER JOIN estado_ticket e ON t.estado_id = e.id
        INNER JOIN usuarios u_creador ON t.usuario_creador_id = u_creador.id
        INNER JOIN roles r ON u_creador.rol_id = r.id
        LEFT JOIN usuarios u_asignado ON t.usuario_asignado_id = u_asignado.id
        WHERE t.id = $1;
    `;
    const resTicket = await pool.query(queryTicket, [idTicket]);
    
    if (resTicket.rows.length === 0) return null;
    const ticket = resTicket.rows[0];

    // 2. Traer las imágenes
    const queryImagenes = `SELECT id, imagen_base64, fecha_subida FROM ticket_imagenes WHERE ticket_id = $1 ORDER BY fecha_subida ASC;`;
    const resImagenes = await pool.query(queryImagenes, [idTicket]);

    // 3. Traer el historial de auditoría
    const queryHistorial = `
        SELECT 
            th.*,
            u.nombre AS usuario_accion_nombre,
            u.user_name AS usuario_accion_username
        FROM ticket_historial th
        LEFT JOIN usuarios u ON th.usuario_accion_id = u.id
        WHERE th.ticket_id = $1
        ORDER BY th.fecha_accion ASC;
    `;
    const resHistorial = await pool.query(queryHistorial, [idTicket]);

    // Ensamblamos todo en un solo objeto para mandarlo a React
    return {
        ...ticket,
        imagenes: resImagenes.rows,
        historial: resHistorial.rows
    };
};

/**
 * Permite a Sistemas cambiar el estado y auto-asignarse el ticket
 */
const actualizarEstadoTicket = async (idTicket, idEstado, idUsuarioAccion, detalles, idUsuarioAsignado = null) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Actualizamos el ticket (asignamos a alguien si se envía el parámetro)
        let queryUpdate = `UPDATE tickets SET estado_id = $1`;
        let values = [idEstado, idTicket];
        
        if (idUsuarioAsignado) {
            queryUpdate += `, usuario_asignado_id = $3`;
            values.push(idUsuarioAsignado);
        }
        queryUpdate += ` WHERE id = $2`;
        
        await client.query(queryUpdate, values);

        // Guardamos el movimiento en auditoría
        const queryHistorial = `
            INSERT INTO ticket_historial (ticket_id, usuario_accion_id, accion, detalles)
            VALUES ($1, $2, $3, $4);
        `;
        await client.query(queryHistorial, [idTicket, idUsuarioAccion, 'Actualización de Estado', detalles]);

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Cierra/Resuelve el ticket definitivamente
 */
const resolverTicket = async (idTicket, observaciones, idUsuarioResolutor) => {
    const estadoResuelto = 3; // 3 = 'Resuelto'
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Actualizamos estado, agregamos observaciones y ponemos la fecha de resolución
        const queryUpdate = `
            UPDATE tickets 
            SET estado_id = $1, observaciones_resolucion = $2, fecha_resolucion = CURRENT_TIMESTAMP
            WHERE id = $3
        `;
        await client.query(queryUpdate, [estadoResuelto, observaciones, idTicket]);

        // Guardamos en auditoría
        const queryHistorial = `
            INSERT INTO ticket_historial (ticket_id, usuario_accion_id, accion, detalles)
            VALUES ($1, $2, $3, $4);
        `;
        await client.query(queryHistorial, [idTicket, idUsuarioResolutor, 'Resolución', 'El ticket ha sido marcado como resuelto.']);

        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    crearTicket,
    obtenerTicketsPorUsuario,
    obtenerTodosLosTickets,
    obtenerDetalleTicket,
    actualizarEstadoTicket,
    resolverTicket
};