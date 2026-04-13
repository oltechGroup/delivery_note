//almacen-oltech-backend/src/controllers/ingresosEfectivoController.js
const ingresosModel = require('../models/ingresosEfectivoModel');

/**
 * Registra un nuevo ingreso de efectivo desde el formulario del Frontend
 */
const registrarIngreso = async (req, res) => {
    try {
        const {
            folio, nombre_quien_paga, razon,
            monto_acordado, monto_recibido, diferencia,
            firma_url, foto_evidencia_url, foto_ine_url
        } = req.body;

        // 1. Validación básica: Que no nos manden datos vacíos importantes
        if (!folio || !nombre_quien_paga || !razon || monto_acordado === undefined || monto_recibido === undefined) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios por llenar.' });
        }

        // 2. Extraer el ID del usuario que está logueado (El Biomédico)
        // Esto viene gracias a tu middleware 'verificarToken'
        const usuario_recibe_id = req.usuario.id;

        const data = {
            folio, 
            usuario_recibe_id, 
            nombre_quien_paga, 
            razon,
            monto_acordado, 
            monto_recibido, 
            diferencia,
            firma_url, 
            foto_evidencia_url, 
            foto_ine_url
        };

        // 3. Mandar al modelo para guardar en PostgreSQL
        const nuevoIngreso = await ingresosModel.crearIngreso(data);

        res.status(201).json({
            mensaje: 'Ingreso de efectivo registrado exitosamente.',
            ingreso: nuevoIngreso
        });
        
    } catch (error) {
        console.error('Error al registrar ingreso de efectivo:', error);
        
        // Manejo de error si el Biomédico intenta registrar un folio que ya existe
        if (error.code === '23505') { 
            return res.status(400).json({ mensaje: 'El folio ingresado ya existe en el sistema. Por favor verifica.' });
        }
        
        res.status(500).json({ mensaje: 'Error interno del servidor al registrar el ingreso.' });
    }
};

/**
 * Obtiene la lista de todos los ingresos (Para la tabla de auditoría de Ventas)
 */
const obtenerHistorialIngresos = async (req, res) => {
    try {
        const ingresos = await ingresosModel.obtenerTodosLosIngresos();
        res.json(ingresos);
    } catch (error) {
        console.error('Error al obtener ingresos de efectivo:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar la bandeja de ingresos.' });
    }
};

/**
 * Cambia el estado de un ingreso (Usado por Ventas para Autorizar)
 */
const cambiarEstadoIngreso = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado_id } = req.body;

        if (!estado_id) {
            return res.status(400).json({ mensaje: 'El ID del nuevo estado es requerido.' });
        }

        const ingresoActualizado = await ingresosModel.actualizarEstado(id, parseInt(estado_id));

        if (!ingresoActualizado) {
            return res.status(404).json({ mensaje: 'Registro de ingreso no encontrado.' });
        }

        res.json({
            mensaje: 'Estado del ingreso actualizado correctamente.',
            ingreso: ingresoActualizado
        });
    } catch (error) {
        console.error('Error al cambiar estado del ingreso:', error);
        res.status(500).json({ mensaje: 'Error interno al cambiar el estado.' });
    }
};

/**
 * NUEVO: Registra los gastos de ruta y recalcula el monto final
 */
const registrarGastosRuta = async (req, res) => {
    try {
        const { id } = req.params;
        const { observaciones, monto_gasto, foto_observaciones_url } = req.body;

        // Validamos que al menos venga alguna observación o gasto
        if (!observaciones && monto_gasto === undefined) {
             return res.status(400).json({ mensaje: 'Faltan datos de observaciones o monto del gasto.' });
        }

        const ingresoActualizado = await ingresosModel.agregarGastosRuta(id, {
             observaciones,
             monto_gasto,
             foto_observaciones_url
        });

        if (!ingresoActualizado) {
             return res.status(404).json({ mensaje: 'Registro de ingreso no encontrado.' });
        }

        res.json({
             mensaje: 'Gastos de ruta registrados correctamente.',
             ingreso: ingresoActualizado
        });

    } catch (error) {
        console.error('Error al registrar gastos de ruta:', error);
        res.status(500).json({ mensaje: 'Error interno al registrar los gastos.' });
    }
};

module.exports = {
    registrarIngreso,
    obtenerHistorialIngresos,
    cambiarEstadoIngreso,
    registrarGastosRuta // Exportamos la nueva función
};