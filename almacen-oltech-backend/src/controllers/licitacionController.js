// almacen-oltech-backend/src/controllers/licitacionController.js
const licitacionModel = require('../models/licitacionModel');

// ==========================================
// CONTROLADORES: INVENTARIO LOCAL (Multi-Tenant)
// ==========================================

const obtenerInventarioLocal = async (req, res) => {
    try {
        let ciudad_id = req.query.ciudad_id;
        
        // APLICACIÓN DE SEGURIDAD (Multi-Tenant):
        const rolesNacionales = ['Sistemas', 'Operaciones'];
        const esNacional = req.usuario.roles.some(r => rolesNacionales.includes(r));

        if (!esNacional) {
            // Si el usuario es operativo (Técnico/Coordinador), forzamos su propia ciudad
            if (!req.usuario.sedes || req.usuario.sedes.length === 0) {
                return res.status(403).json({ mensaje: 'Tu usuario no tiene una ciudad o sede asignada para consultar inventario.' });
            }
            ciudad_id = req.usuario.sedes[0].ciudad_id;
        } else if (!ciudad_id) {
            // Si es nacional pero no eligió ciudad en la URL, mandamos error de solicitud
            return res.status(400).json({ mensaje: 'Como usuario nacional, debes especificar el ID de la ciudad a consultar.' });
        }

        const inventario = await licitacionModel.getInventarioLocal(ciudad_id);
        res.json(inventario);

    } catch (error) {
        console.error('Error al obtener inventario local:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar el inventario de la sede.' });
    }
};

// ==========================================
// CONTROLADORES: LECTURA DE HOJAS DE CONSUMO
// ==========================================

const obtenerHojasConsumo = async (req, res) => {
    try {
        // Extraemos los filtros de la URL (Ej. ?ciudad_id=1&unidad_medica_id=2)
        const { ciudad_id, unidad_medica_id } = req.query;
        
        const filtros = {};
        if (ciudad_id) filtros.ciudad_id = parseInt(ciudad_id);
        if (unidad_medica_id) filtros.unidad_medica_id = parseInt(unidad_medica_id);

        // APLICACIÓN DE SEGURIDAD (Multi-Tenant):
        // Si el usuario no es 'Sistemas' ni 'Operaciones' (los roles que ven todo el panorama nacional),
        // forzamos a que solo vea las hojas de las sedes a las que está asignado.
        const rolesNacionales = ['Sistemas', 'Operaciones'];
        const esNacional = req.usuario.roles.some(r => rolesNacionales.includes(r));
        
        if (!esNacional && req.usuario.sedes && req.usuario.sedes.length > 0) {
            // Tomamos la primera sede asignada al usuario operativo para filtrar la información
            if (!filtros.ciudad_id) filtros.ciudad_id = req.usuario.sedes[0].ciudad_id;
            if (!filtros.unidad_medica_id) filtros.unidad_medica_id = req.usuario.sedes[0].unidad_medica_id;
        }

        const hojas = await licitacionModel.getHojasConsumo(filtros);
        res.json(hojas);
    } catch (error) {
        console.error('Error al obtener hojas de consumo:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar el historial de hojas de consumo.' });
    }
};

const obtenerHojaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const hoja = await licitacionModel.getHojaConsumoById(id);
        
        if (!hoja) {
            return res.status(404).json({ mensaje: 'La hoja de consumo solicitada no existe o fue eliminada.' });
        }
        
        res.json(hoja);
    } catch (error) {
        console.error('Error al obtener el detalle de la hoja:', error);
        res.status(500).json({ mensaje: 'Error interno al buscar los detalles y consumos de la hoja.' });
    }
};

// ==========================================
// CONTROLADORES: CREACIÓN Y EDICIÓN
// ==========================================

const crearHojaConsumo = async (req, res) => {
    try {
        const { hojaData, detalles } = req.body;

        // Validación básica de seguridad desde el backend
        if (!hojaData || !detalles || detalles.length === 0) {
            return res.status(400).json({ mensaje: 'Faltan datos en la cabecera o no hay insumos/materiales registrados.' });
        }

        // Inyectamos automáticamente el ID del usuario que está creando la hoja (El Técnico en quirófano)
        hojaData.usuario_tecnico_id = req.usuario.id;

        // Mandamos a guardar usando la transacción segura que definimos en el Modelo
        const nuevaHojaId = await licitacionModel.createHojaConsumo(hojaData, detalles);

        res.status(201).json({
            mensaje: 'Hoja de consumo registrada exitosamente. Queda en estado "Pendiente de Autorización".',
            id: nuevaHojaId
        });

    } catch (error) {
        console.error('Error al crear hoja de consumo:', error);
        if (error.code === '23505') {
            return res.status(400).json({ mensaje: 'El número de folio ingresado ya existe en otra hoja de consumo registrada.' });
        }
        res.status(500).json({ mensaje: 'Error interno al registrar la hoja de consumo. Se han revertido los cambios por seguridad.' });
    }
};

const autorizarHojaConsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, observaciones_cierre } = req.body;

        if (!estado) {
            return res.status(400).json({ mensaje: 'Debe especificar el nuevo estado de la hoja (Ej. Finalizada, Rechazada).' });
        }

        // Inyectamos automáticamente el ID del Coordinador/Encargado que está dando el visto bueno
        const usuario_encargado_id = req.usuario.id;

        const hojaActualizada = await licitacionModel.updateEstadoHoja(id, estado, usuario_encargado_id, observaciones_cierre);
        
        if (!hojaActualizada) {
            return res.status(404).json({ mensaje: 'No se encontró la hoja de consumo solicitada para actualizar.' });
        }

        res.json({
            mensaje: `La validación fue exitosa. La hoja de consumo ha sido marcada como: ${estado}`,
            hoja: hojaActualizada
        });

    } catch (error) {
        console.error('Error al autorizar hoja de consumo:', error);
        res.status(500).json({ mensaje: 'Error interno al intentar cambiar el estado de validación de la hoja.' });
    }
};

module.exports = {
    obtenerInventarioLocal, // <--- Nueva función exportada
    obtenerHojasConsumo,
    obtenerHojaPorId,
    crearHojaConsumo,
    autorizarHojaConsumo
};