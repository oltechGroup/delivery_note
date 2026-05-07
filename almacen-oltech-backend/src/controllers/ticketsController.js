// almacen-oltech-backend/src/controllers/ticketsController.js
const ticketModel = require('../models/ticketModel');

/**
 * Crea un nuevo ticket (Lo usan todos los usuarios)
 */
const crearTicket = async (req, res) => {
    try {
        const { asunto, descripcion, prioridad_id, imagenes } = req.body;
        
        // El id del usuario viene del token gracias al middleware verificarToken
        const idUsuarioCreador = req.usuario.id;

        if (!asunto || !descripcion || !prioridad_id) {
            return res.status(400).json({ mensaje: 'El asunto, la descripción y la prioridad son obligatorios.' });
        }

        const datosTicket = { asunto, descripcion, prioridad_id };
        
        // Llamamos al modelo pasándole el arreglo de imágenes (si es que hay)
        const ticketId = await ticketModel.crearTicket(datosTicket, imagenes, idUsuarioCreador);

        res.status(201).json({
            mensaje: 'Ticket creado exitosamente.',
            ticketId: ticketId
        });
    } catch (error) {
        console.error('Error al crear ticket:', error);
        res.status(500).json({ mensaje: 'Error interno al crear el ticket de soporte.' });
    }
};

/**
 * Obtiene los tickets del usuario logueado (Vista normal)
 */
const obtenerMisTickets = async (req, res) => {
    try {
        const idUsuario = req.usuario.id;
        const tickets = await ticketModel.obtenerTicketsPorUsuario(idUsuario);
        res.json(tickets);
    } catch (error) {
        console.error('Error al obtener mis tickets:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar tus tickets.' });
    }
};

/**
 * Obtiene todos los tickets del sistema (Vista exclusiva de Sistemas)
 */
const obtenerTodosTickets = async (req, res) => {
    try {
        const tickets = await ticketModel.obtenerTodosLosTickets();
        res.json(tickets);
    } catch (error) {
        console.error('Error al obtener todos los tickets:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar el panel de tickets.' });
    }
};

/**
 * Trae todo el detalle, historial e imágenes de un ticket
 */
const verDetalleTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const detalle = await ticketModel.obtenerDetalleTicket(id);

        if (!detalle) {
            return res.status(404).json({ mensaje: 'Ticket no encontrado.' });
        }

        res.json(detalle);
    } catch (error) {
        console.error('Error al obtener detalle del ticket:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar los detalles del ticket.' });
    }
};

/**
 * Permite a Sistemas cambiar el estado del ticket (ej. pasarlo a "En revisión")
 */
const cambiarEstadoTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado_id, detalles } = req.body;
        const idUsuarioAccion = req.usuario.id; // El usuario de Sistemas que hace el cambio

        if (!estado_id || !detalles) {
            return res.status(400).json({ mensaje: 'El nuevo estado y los detalles son obligatorios.' });
        }

        // Como Sistemas está tomando el ticket, se auto-asigna
        const idUsuarioAsignado = req.usuario.id; 

        await ticketModel.actualizarEstadoTicket(id, estado_id, idUsuarioAccion, detalles, idUsuarioAsignado);

        res.json({ mensaje: 'Estado del ticket actualizado y registrado en auditoría.' });
    } catch (error) {
        console.error('Error al cambiar estado del ticket:', error);
        res.status(500).json({ mensaje: 'Error interno al actualizar el estado del ticket.' });
    }
};

/**
 * Cierra el ticket y guarda la observación final de Sistemas
 */
const resolverTicketFinal = async (req, res) => {
    try {
        const { id } = req.params;
        const { observaciones } = req.body;
        const idUsuarioResolutor = req.usuario.id;

        if (!observaciones) {
            return res.status(400).json({ mensaje: 'Debes ingresar las observaciones de cómo resolviste el problema.' });
        }

        await ticketModel.resolverTicket(id, observaciones, idUsuarioResolutor);

        res.json({ mensaje: 'Ticket marcado como resuelto exitosamente.' });
    } catch (error) {
        console.error('Error al resolver ticket:', error);
        res.status(500).json({ mensaje: 'Error interno al resolver el ticket.' });
    }
};

module.exports = {
    crearTicket,
    obtenerMisTickets,
    obtenerTodosTickets,
    verDetalleTicket,
    cambiarEstadoTicket,
    resolverTicketFinal
};