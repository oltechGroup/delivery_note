// almacen-oltech-backend/src/controllers/ticketsController.js
const ticketModel = require('../models/ticketModel');
const nodemailer = require('nodemailer');

// ============================================================================
// CONFIGURACIÓN DE NODEMAILER PARA ALERTAS
// ============================================================================
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: 'sistemas@oltech.mx',
        pass: 'ksgm wkty dfjf jrmu'
    }
});

/**
 * Crea un nuevo ticket (Lo usan todos los usuarios)
 */
const crearTicket = async (req, res) => {
    try {
        const { asunto, descripcion, prioridad_id } = req.body;
        
        // El id y el username vienen del token gracias al middleware verificarToken
        const idUsuarioCreador = req.usuario.id;
        const nombreUsuario = req.usuario.user_name || 'Un usuario';

        if (!asunto || !descripcion || !prioridad_id) {
            return res.status(400).json({ mensaje: 'El asunto, la descripción y la prioridad son obligatorios.' });
        }

        // --- INICIO LÓGICA MULTER ---
        // Multer deja los archivos procesados en el arreglo req.files
        let rutasImagenes = [];
        if (req.files && req.files.length > 0) {
            // Mapeamos los archivos para guardar solo sus rutas públicas
            rutasImagenes = req.files.map(file => `/uploads/tickets/${file.filename}`);
        }
        // --- FIN LÓGICA MULTER ---

        const datosTicket = { asunto, descripcion, prioridad_id };
        
        // Llamamos al modelo pasándole el arreglo de rutas (en lugar de Base64)
        const ticketId = await ticketModel.crearTicket(datosTicket, rutasImagenes, idUsuarioCreador);

        // --- INICIO LÓGICA DE NOTIFICACIÓN POR CORREO ---
        try {
            const mapaPrioridades = { 1: 'Baja', 2: 'Media', 3: 'Alta', 4: 'Crítica' };
            const prioridadTexto = mapaPrioridades[prioridad_id] || 'No definida';
            
            // Color de la etiqueta de prioridad para el correo
            let colorPrioridad = '#10b981'; // Verde (Baja)
            if (prioridad_id == 2) colorPrioridad = '#f59e0b'; // Amarillo (Media)
            if (prioridad_id == 3) colorPrioridad = '#f97316'; // Naranja (Alta)
            if (prioridad_id == 4) colorPrioridad = '#ef4444'; // Rojo (Crítica)

            const mailOptions = {
                from: '"Help Desk OLTECH" <sistemas@oltech.mx>',
                to: 'sistemas@oltech.mx', // Se envía a la misma cuenta de sistemas para notificarles
                subject: `🚨 Nuevo Ticket #${String(ticketId).padStart(4, '0')} - Prioridad: ${prioridadTexto}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <div style="background-color: #111827; padding: 25px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">Alerta TI</h1>
                            <p style="color: #f43f5e; margin: 5px 0 0 0; font-size: 14px; font-weight: bold; text-transform: uppercase;">Help Desk - Soporte de TI</p>
                        </div>
                        <div style="padding: 30px; background-color: #ffffff;">
                            <h2 style="color: #1f2937; font-size: 18px; margin-top: 0; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">Se ha levantado un nuevo reporte:</h2>
                            <ul style="list-style: none; padding: 0; color: #4b5563; font-size: 15px; line-height: 1.8;">
                                <li><strong>Folio del Ticket:</strong> <span style="font-family: monospace; color: #6b7280;">#TK-${String(ticketId).padStart(4, '0')}</span></li>
                                <li><strong>Usuario solicitante:</strong> ${nombreUsuario}</li>
                                <li><strong>Asunto:</strong> ${asunto}</li>
                                <li><strong>Nivel de Prioridad:</strong> <span style="background-color: ${colorPrioridad}; color: #ffffff; padding: 3px 8px; border-radius: 12px; font-weight: bold; font-size: 12px; text-transform: uppercase;">${prioridadTexto}</span></li>
                            </ul>
                            
                            <div style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #f43f5e; border-radius: 4px; margin-top: 25px;">
                                <p style="margin: 0; color: #374151; font-size: 14px;"><strong>Descripción del problema:</strong><br/><br/>${descripcion}</p>
                            </div>
                            
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="http://localhost:5173/panel-tickets" style="background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Ingresar al Panel de Sistemas</a>
                            </div>
                        </div>
                        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; color: #9ca3af; font-size: 12px;">
                            Este es un mensaje automático generado por el sistema interno de OLTECH.<br/>
                            Por favor no respondas a este correo.
                        </div>
                    </div>
                `
            };

            // Enviamos el correo (se ejecuta en segundo plano para no demorar la respuesta al Frontend)
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) console.error('Error al enviar alerta por correo:', err);
                else console.log(`✉️ Alerta de correo enviada para el ticket #${ticketId}`);
            });
        } catch (emailError) {
            console.error('Error al procesar la alerta de correo:', emailError);
        }
        // --- FIN LÓGICA DE NOTIFICACIÓN ---

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