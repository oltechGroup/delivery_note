// almacen-oltech-backend/src/controllers/almacenController.js
const almacenModel = require('../models/almacenModel');
const pool = require('../config/database'); // <--- AÑADIDO PARA MANEJO DE ESTADOS DE SETS

// ==========================================
// CONTROLADORES: CATEGORÍAS (Para Sets)
// ==========================================
const obtenerCategorias = async (req, res) => {
    try {
        const categorias = await almacenModel.getAllCategorias();
        res.json(categorias);
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar las categorías.' });
    }
};

const crearCategoria = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio.' });
        
        const nuevaCategoria = await almacenModel.createCategoria(nombre);
        res.status(201).json({ mensaje: 'Categoría registrada.', categoria: nuevaCategoria });
    } catch (error) {
        console.error('Error al crear categoría:', error);
        res.status(500).json({ mensaje: 'Error interno al registrar.' });
    }
};

// ==========================================
// CONTROLADORES: CATEGORÍAS DE CONSUMIBLES
// ==========================================
const obtenerCategoriasConsumibles = async (req, res) => {
    try {
        const categorias = await almacenModel.getAllCategoriasConsumibles();
        res.json(categorias);
    } catch (error) {
        console.error('Error al obtener categorías de consumibles:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar las categorías de insumos.' });
    }
};

const crearCategoriaConsumible = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio.' });
        
        const nuevaCategoria = await almacenModel.createCategoriaConsumible(nombre);
        res.status(201).json({ mensaje: 'Categoría registrada.', categoria: nuevaCategoria });
    } catch (error) {
        console.error('Error al crear categoría de consumible:', error);
        res.status(500).json({ mensaje: 'Error interno al registrar.' });
    }
};

// ==========================================
// CONTROLADORES: CONSUMIBLES (Insumos a Granel)
// ==========================================

/**
 * ACTUALIZADO: Maneja el filtro de limpieza basado en el query param 'audit'
 */
const obtenerConsumibles = async (req, res) => {
    try {
        const { categoria_id, audit } = req.query; 
        
        // Si audit es 'true', soloActivos será false (trae todo).
        // Por defecto, soloActivos es true (aplica limpieza).
        const soloActivos = audit !== 'true';

        let consumibles;
        if (categoria_id) {
            consumibles = await almacenModel.getConsumiblesByCategoria(categoria_id, soloActivos);
        } else {
            consumibles = await almacenModel.getAllConsumibles(soloActivos);
        }
        res.json(consumibles);
    } catch (error) {
        console.error('Error al obtener consumibles:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar insumos.' });
    }
};

/**
 * NUEVA FUNCIÓN: Búsqueda Profunda (Rescate de lotes ocultos)
 */
const buscarHistoricoLote = async (req, res) => {
    try {
        const { codigo, lote } = req.query;
        if (!codigo) return res.status(400).json({ mensaje: 'El código de referencia es obligatorio.' });

        const consumible = await almacenModel.getConsumibleByCodigoYLote(codigo, lote || null);
        
        if (!consumible) {
            return res.status(404).json({ mensaje: 'No se encontró ningún lote previo con esos datos.' });
        }
        
        res.json(consumible);
    } catch (error) {
        console.error('Error en búsqueda profunda:', error);
        res.status(500).json({ mensaje: 'Error al realizar la búsqueda en el histórico.' });
    }
};

const crearConsumible = async (req, res) => {
    try {
        const { 
            codigo_referencia, 
            nombre, 
            nombre_comercial, 
            precio,           
            unidad_medida, 
            cantidad, 
            lote, 
            fecha_caducidad, 
            categoria_id 
        } = req.body;
        
        if (!codigo_referencia || !nombre) {
            return res.status(400).json({ mensaje: 'Código de referencia y nombre son obligatorios.' });
        }
        
        const nuevoConsumible = await almacenModel.createConsumible(req.body);
        res.status(201).json({ mensaje: 'Insumo registrado exitosamente.', consumible: nuevoConsumible });
    } catch (error) {
        console.error('Error al crear consumible:', error);
        if (error.code === '23505') return res.status(400).json({ mensaje: 'El código de referencia ya existe.' });
        res.status(500).json({ mensaje: 'Error interno al registrar.' });
    }
};

const modificarStockConsumible = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad_a_sumar } = req.body; 
        
        if (cantidad_a_sumar === undefined || isNaN(cantidad_a_sumar)) {
            return res.status(400).json({ mensaje: 'Debe especificar una cantidad numérica para modificar el stock.' });
        }

        const consumible = await almacenModel.updateStockConsumible(id, parseInt(cantidad_a_sumar));
        res.json({ mensaje: 'Stock actualizado correctamente.', consumible });
    } catch (error) {
        console.error('Error al modificar stock:', error);
        res.status(500).json({ mensaje: 'Error interno al actualizar el stock del insumo.' });
    }
};

// ==========================================
// NUEVAS FUNCIONES: EDICIÓN Y ELIMINACIÓN DE CONSUMIBLES
// ==========================================

const actualizarConsumible = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            codigo_referencia, 
            nombre, 
            nombre_comercial, 
            precio,           
            unidad_medida, 
            lote, 
            fecha_caducidad, 
            categoria_id 
        } = req.body;

        if (!codigo_referencia || !nombre) {
            return res.status(400).json({ mensaje: 'Código de referencia y nombre son obligatorios.' });
        }

        const consumibleActualizado = await almacenModel.updateConsumible(id, req.body);
        
        if (!consumibleActualizado) {
            return res.status(404).json({ mensaje: 'Insumo no encontrado.' });
        }

        res.json({ mensaje: 'Insumo actualizado exitosamente.', consumible: consumibleActualizado });
    } catch (error) {
        console.error('Error al actualizar consumible:', error);
        if (error.code === '23505') {
            return res.status(400).json({ mensaje: 'El código de referencia ya está en uso por otro insumo.' });
        }
        res.status(500).json({ mensaje: 'Error interno al actualizar el insumo.' });
    }
};

const eliminarConsumible = async (req, res) => {
    try {
        const { id } = req.params;
        const insumoEliminado = await almacenModel.deleteConsumible(id);
        
        if (!insumoEliminado) {
            return res.status(404).json({ mensaje: 'Insumo no encontrado.' });
        }

        res.json({ mensaje: 'Insumo eliminado exitosamente.' });
    } catch (error) {
        console.error('Error al eliminar consumible:', error);
        // Capturar el error de Foreign Key de PostgreSQL (Integridad Referencial)
        if (error.code === '23503') {
            return res.status(409).json({ 
                mensaje: 'No se puede eliminar este insumo porque ya tiene historial de movimientos (entradas o remisiones). Si fue un error, realiza un ajuste de stock a cero.' 
            });
        }
        res.status(500).json({ mensaje: 'Error interno al eliminar el insumo.' });
    }
};

// =========================================================================
// MÓDULO: ENTRADA MASIVA DE CONSUMIBLES (Inbound)
// =========================================================================
const registrarEntrada = async (req, res) => {
    try {
        const { observaciones, detalles } = req.body;

        if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
            return res.status(400).json({ mensaje: 'El carrito de entrada no puede estar vacío.' });
        }

        const usuarioId = req.usuario.id;

        const nuevaEntrada = await almacenModel.registrarEntradaMasiva(
            { observaciones }, 
            detalles, 
            usuarioId
        );

        res.status(201).json({ 
            mensaje: 'Entrada registrada y stock actualizado exitosamente.', 
            entrada: nuevaEntrada 
        });

    } catch (error) {
        console.error('Error al registrar entrada masiva:', error);
        res.status(500).json({ mensaje: 'Error interno al procesar el ingreso de mercancía.' });
    }
};

const obtenerHistorialEntradas = async (req, res) => {
    try {
        const query = `
            SELECT 
                ea.id,
                ea.folio,
                ea.fecha_entrada,
                ea.observaciones,
                u.nombre || ' ' || u.apellido_p AS usuario_nombre,
                (SELECT SUM(cantidad_ingresada) FROM entrada_detalle WHERE entrada_id = ea.id) AS total_articulos
            FROM entrada_almacen ea
            INNER JOIN usuarios u ON ea.usuario_id = u.id
            ORDER BY ea.fecha_entrada DESC
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener historial de entradas:', error);
        res.status(500).json({ mensaje: 'Error al cargar el historial de ingresos.' });
    }
};

const obtenerDetallesDeEntrada = async (req, res) => {
    try {
        const { id } = req.params;
        const detalles = await almacenModel.getDetallesEntrada(id);
        
        if (!detalles || detalles.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontraron detalles para este ticket de entrada.' });
        }
        
        res.json(detalles);
    } catch (error) {
        console.error('Error al obtener los detalles de la entrada:', error);
        res.status(500).json({ mensaje: 'Error al cargar el contenido del ticket.' });
    }
};

// ==========================================
// CONTROLADORES: PIEZAS
// ==========================================
const obtenerPiezas = async (req, res) => {
    try {
        const piezas = await almacenModel.getAllPiezas();
        res.json(piezas);
    } catch (error) {
        console.error('Error al obtener piezas:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar las piezas.' });
    }
};

const crearPieza = async (req, res) => {
    try {
        const { codigo, descripcion, unidad_medida, estado_id } = req.body;
        if (!codigo || !descripcion) return res.status(400).json({ mensaje: 'Código y descripción obligatorios.' });
        
        const nuevaPieza = await almacenModel.createPieza(req.body);
        res.status(201).json({ mensaje: 'Pieza registrada exitosamente.', pieza: nuevaPieza });
    } catch (error) {
        console.error('Error al crear pieza:', error);
        if (error.code === '23505') return res.status(400).json({ mensaje: 'El código ya existe.' });
        res.status(500).json({ mensaje: 'Error interno.' });
    }
};

const actualizarPieza = async (req, res) => {
    try {
        const { id } = req.params;
        const { codigo, descripcion } = req.body;
        if (!codigo || !descripcion) return res.status(400).json({ mensaje: 'Código y descripción obligatorios.' });
        
        const piezaActualizada = await almacenModel.updatePieza(id, req.body);
        if (!piezaActualizada) return res.status(404).json({ mensaje: 'Pieza no encontrada.' });
        
        res.json({ mensaje: 'Pieza actualizada.', pieza: piezaActualizada });
    } catch (error) {
        console.error('Error al actualizar pieza:', error);
        if (error.code === '23505') return res.status(400).json({ mensaje: 'El código ya está en uso.' });
        res.status(500).json({ mensaje: 'Error interno.' });
    }
};

// ==========================================
// CONTROLADORES: SETS MAESTROS
// ==========================================
const obtenerSets = async (req, res) => {
    try {
        const sets = await almacenModel.getAllSets();
        res.json(sets);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cargar los sets.' });
    }
};

const obtenerSetsPorCategoria = async (req, res) => {
    try {
        const { categoria_id } = req.params;
        const sets = await almacenModel.getSetsByCategoria(categoria_id);
        res.json(sets);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al cargar el inventario de la categoría.' });
    }
};

const crearSet = async (req, res) => {
    try {
        const { codigo, descripcion, estado_id, categoria_id, composicion } = req.body;
        if (!codigo || !descripcion) return res.status(400).json({ mensaje: 'El código y descripción son obligatorios.' });
        
        let nuevoSet;
        if (composicion && Array.isArray(composicion) && composicion.length > 0) {
            nuevoSet = await almacenModel.createSetConComposicion({ codigo, descripcion, estado_id, categoria_id }, composicion);
        } else {
            nuevoSet = await almacenModel.createSet({ codigo, descripcion, estado_id, categoria_id });
        }

        res.status(201).json({ mensaje: 'Set registrado exitosamente.', set: nuevoSet });
    } catch (error) {
        console.error('Error al crear set:', error);
        if (error.code === '23505') return res.status(400).json({ mensaje: 'El código ingresado ya existe.' });
        res.status(500).json({ mensaje: 'Error interno.' });
    }
};

const actualizarSet = async (req, res) => {
    try {
        const { id } = req.params;
        const setActualizado = await almacenModel.updateSet(id, req.body);
        if (!setActualizado) return res.status(404).json({ mensaje: 'Set no encontrado.' });
        res.json({ mensaje: 'Actualizado correctamente.', set: setActualizado });
    } catch (error) {
        if (error.code === '23505') return res.status(400).json({ mensaje: 'El código ya está siendo usado.' });
        res.status(500).json({ mensaje: 'Error interno.' });
    }
};

// ==========================================
// CONTROLADORES: COMPOSICIÓN & SURTIDO
// ==========================================
const obtenerComposicionSet = async (req, res) => {
    try {
        const { set_id } = req.params;
        const composicion = await almacenModel.getComposicionBySet(set_id);
        res.json(composicion);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error interno al cargar el contenido.' });
    }
};

const agregarPiezaASet = async (req, res) => {
    try {
        const { set_id } = req.params;
        const { pieza_id, cantidad_pieza } = req.body;
        if (!pieza_id || !cantidad_pieza) return res.status(400).json({ mensaje: 'Datos incompletos.' });
        
        const nuevaComposicion = await almacenModel.addPiezaToSet(set_id, pieza_id, cantidad_pieza);
        res.status(201).json({ mensaje: 'Pieza agregada correctamente.', composicion: nuevaComposicion });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al agregar la pieza.' });
    }
};

const quitarPiezaDeSet = async (req, res) => {
    try {
        const { id } = req.params; 
        const registroEliminado = await almacenModel.removePiezaFromSet(id);
        if (!registroEliminado) return res.status(404).json({ mensaje: 'El registro no existe.' });
        res.json({ mensaje: 'Pieza removida exitosamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al quitar la pieza.' });
    }
};

// SURTIR CON DESCUENTO DE CONSUMIBLES (A GRANEL)
const surtirSet = async (req, res) => {
    try {
        const { id } = req.params; // ID de la composición
        const { consumible_id, cantidad_a_surtir } = req.body;

        if (!consumible_id || !cantidad_a_surtir || cantidad_a_surtir <= 0) {
            return res.status(400).json({ mensaje: 'Debe seleccionar un insumo válido y una cantidad mayor a cero.' });
        }

        const actualizacion = await almacenModel.surtirPiezaSet(id, consumible_id, cantidad_a_surtir);

        res.json({ mensaje: 'Stock reabastecido exitosamente.', data: actualizacion });

    } catch (error) {
        console.error('Error en surtido:', error);
        if (error.message.includes('Stock insuficiente')) {
            return res.status(400).json({ mensaje: error.message });
        }
        res.status(500).json({ mensaje: 'Error interno al procesar el reabastecimiento.' });
    }
};

// NUEVO: REPOSICIÓN DIRECTA DE INSTRUMENTAL (No descuenta de consumibles a granel)
const surtirInstrumentalSet = async (req, res) => {
    try {
        const { id } = req.params; // ID de la composición (set_composicion)
        const { cantidad_a_surtir } = req.body;

        if (!cantidad_a_surtir || cantidad_a_surtir <= 0) {
            return res.status(400).json({ mensaje: 'Debe especificar una cantidad mayor a cero.' });
        }

        const actualizacion = await almacenModel.surtirInstrumentalDirecto(id, cantidad_a_surtir);

        res.json({ mensaje: 'Instrumental repuesto en la caja exitosamente.', data: actualizacion });

    } catch (error) {
        console.error('Error en surtido de instrumental:', error);
        res.status(500).json({ mensaje: 'Error interno al procesar la reposición del instrumental.' });
    }
};

// ==========================================
// NUEVO: OBTENER ALERTA DE SETS INCOMPLETOS
// ==========================================
const obtenerAlertasIncompletos = async (req, res) => {
    try {
        const setsIncompletos = await almacenModel.getSetsIncompletos();
        res.json(setsIncompletos);
    } catch (error) {
        console.error('Error al obtener alertas de sets incompletos:', error);
        res.status(500).json({ mensaje: 'Error al cargar las alertas del dashboard.' });
    }
};

// ==========================================
// NUEVO: FORZAR ESTADO DE SET A DISPONIBLE
// ==========================================
const marcarSetDisponible = async (req, res) => {
    try {
        const { id } = req.params; // ID del Set
        
        // El ID 1 es el estado 'Disponible' o 'Activo'
        await pool.query('UPDATE sets SET estado_id = 1 WHERE id = $1', [id]);
        
        res.json({ mensaje: 'El Set ha sido marcado como Disponible exitosamente.' });
    } catch (error) {
        console.error('Error al liberar Set:', error);
        res.status(500).json({ mensaje: 'Error interno al actualizar el estado del equipo.' });
    }
};

module.exports = {
    obtenerCategorias, crearCategoria,
    obtenerCategoriasConsumibles, crearCategoriaConsumible, 
    obtenerConsumibles, buscarHistoricoLote, crearConsumible, modificarStockConsumible, 
    actualizarConsumible, eliminarConsumible, 
    registrarEntrada, obtenerHistorialEntradas, obtenerDetallesDeEntrada,
    obtenerPiezas, crearPieza, actualizarPieza,
    obtenerSets, obtenerSetsPorCategoria, crearSet, actualizarSet,
    obtenerComposicionSet, agregarPiezaASet, quitarPiezaDeSet, surtirSet,
    surtirInstrumentalSet, // <--- NUEVA FUNCIÓN EXPORTADA
    obtenerAlertasIncompletos,
    marcarSetDisponible 
};