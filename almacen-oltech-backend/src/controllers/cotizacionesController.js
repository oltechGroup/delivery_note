// almacen-oltech-backend/src/controllers/cotizacionesController.js
const cotizacionesModel = require('../models/cotizacionesModel');
const pool = require('../config/database'); 

// ==========================================
// CONTROLADORES: FIRMAS (USO DE SISTEMAS / CATÁLOGO)
// ==========================================

const obtenerFirmas = async (req, res) => {
    try {
        const firmas = await cotizacionesModel.getAllFirmas();
        res.json(firmas);
    } catch (error) {
        console.error('Error al obtener firmas:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar el catálogo de firmas.' });
    }
};

const crearFirma = async (req, res) => {
    try {
        const { nombre, firmas_url } = req.body;
        
        if (!nombre || !firmas_url) {
            return res.status(400).json({ mensaje: 'El nombre y la imagen de la firma son obligatorios.' });
        }
        
        const nuevaFirma = await cotizacionesModel.createFirma(nombre, firmas_url);
        res.status(201).json({
            mensaje: 'Firma registrada exitosamente.',
            firma: nuevaFirma 
        });
    } catch (error) {
        console.error('Error al crear firma:', error);
        res.status(500).json({ mensaje: 'Error interno al registrar la firma.' });
    }
};

// ==========================================
// CONTROLADORES: COTIZACIONES MAESTRAS (CON TRANSACCIONES)
// ==========================================

const obtenerCotizaciones = async (req, res) => {
    try {
        const cotizaciones = await cotizacionesModel.getAllCotizaciones();
        res.json(cotizaciones);
    } catch (error) {
        console.error('Error al obtener cotizaciones:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar las cotizaciones.' });
    }
};

const obtenerCotizacionPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const cotizacion = await cotizacionesModel.getCotizacionById(id);
        
        if (!cotizacion) {
            return res.status(404).json({ mensaje: 'La cotización solicitada no existe.' });
        }
        
        res.json(cotizacion);
    } catch (error) {
        console.error('Error al obtener la cotización:', error);
        res.status(500).json({ mensaje: 'Error interno al buscar la cotización.' });
    }
};

const crearCotizacion = async (req, res) => {
    const client = await pool.connect();

    try {
        const { 
            fecha, 
            cliente_texto, 
            subtotal, 
            iva, 
            total, 
            firma_id, 
            detalles 
        } = req.body;

        const usuario_creador_id = req.usuario.id;

        // Validaciones básicas antes de iniciar transacción
        if (!cliente_texto || detalles.length === 0) {
            return res.status(400).json({ mensaje: 'Faltan datos del cliente o partidas en la cotización.' });
        }

        await client.query('BEGIN'); 

        // 1. Insertar la Cabecera de la Cotización
        const queryCotizacion = `
            INSERT INTO cotizaciones 
            (fecha, cliente_texto, subtotal, iva, total, firma_id, usuario_creador_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *;
        `;
        const valuesCotizacion = [
            fecha || new Date(), 
            cliente_texto, 
            subtotal, 
            iva, 
            total, 
            firma_id || null, 
            usuario_creador_id
        ];
        
        const { rows: cotizacionRows } = await client.query(queryCotizacion, valuesCotizacion);
        const nuevaCotizacion = cotizacionRows[0];

        // 2. Insertar los Detalles (Las Partidas)
        if (detalles && detalles.length > 0) {
            const queryDetalle = `
                INSERT INTO cotizacion_detalles 
                (cotizacion_id, partida, descripcion, unidad, cantidad, precio_unitario, importe) 
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `;
            
            for (let i = 0; i < detalles.length; i++) {
                const item = detalles[i];
                await client.query(queryDetalle, [
                    nuevaCotizacion.id, 
                    i + 1, // El número de partida secuencial (1, 2, 3...)
                    item.descripcion, 
                    item.unidad, 
                    item.cantidad,
                    item.precio_unitario,
                    item.importe
                ]);
            }
        }

        await client.query('COMMIT'); 

        res.status(201).json({
            mensaje: 'Cotización creada exitosamente.',
            cotizacion: nuevaCotizacion
        });

    } catch (error) {
        await client.query('ROLLBACK'); 
        console.error('Error al crear cotización (Transacción cancelada):', error);
        res.status(500).json({ mensaje: 'Error interno. Se han revertido los cambios por seguridad.' });
    } finally {
        client.release(); 
    }
};

module.exports = {
    obtenerFirmas,
    crearFirma,
    obtenerCotizaciones,
    obtenerCotizacionPorId,
    crearCotizacion
};