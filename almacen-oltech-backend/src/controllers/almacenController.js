// almacen-oltech-backend/src/controllers/almacenController.js
const almacenModel = require('../models/almacenModel');

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
const obtenerConsumibles = async (req, res) => {
    try {
        const { categoria_id } = req.query; 
        
        let consumibles;
        if (categoria_id) {
            consumibles = await almacenModel.getConsumiblesByCategoria(categoria_id);
        } else {
            consumibles = await almacenModel.getAllConsumibles();
        }
        res.json(consumibles);
    } catch (error) {
        console.error('Error al obtener consumibles:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar insumos.' });
    }
};

const crearConsumible = async (req, res) => {
    try {
        const { codigo_referencia, nombre, unidad_medida, cantidad, lote, fecha_caducidad, categoria_id } = req.body;
        
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

// =========================================================================
// MÓDULO NUEVO: ENTRADA MASIVA DE CONSUMIBLES (Inbound)
// =========================================================================
const registrarEntrada = async (req, res) => {
    try {
        const { observaciones, detalles } = req.body;

        // Validaciones básicas de seguridad
        if (!detalles || !Array.isArray(detalles) || detalles.length === 0) {
            return res.status(400).json({ mensaje: 'El carrito de entrada no puede estar vacío.' });
        }

        // Extraemos el ID del usuario que hizo la petición desde el Token
        const usuarioId = req.usuario.id;

        // Mandamos a la función transaccional del modelo
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
        // Hacemos un JOIN rápido directamente aquí para no complicar el modelo si es sencillo
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
        const pool = require('../config/database');
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error al obtener historial de entradas:', error);
        res.status(500).json({ mensaje: 'Error al cargar el historial de ingresos.' });
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

const surtirSet = async (req, res) => {
    try {
        const { id } = req.params; 
        const { consumible_id, cantidad_a_surtir } = req.body;

        if (!consumible_id || !cantidad_a_surtir || cantidad_a_surtir <= 0) {
            return res.status(400).json({ mensaje: 'Debe seleccionar un insumo válido y una cantidad mayor a cero.' });
        }

        const actualizacion = await almacenModel.surtirPiezaSet(id, consumible_id, cantidad_a_surtir);
        res.json({ mensaje: 'Set reabastecido exitosamente.', data: actualizacion });

    } catch (error) {
        console.error('Error en surtido:', error);
        if (error.message.includes('Stock insuficiente')) {
            return res.status(400).json({ mensaje: error.message });
        }
        res.status(500).json({ mensaje: 'Error interno al procesar el reabastecimiento.' });
    }
};

module.exports = {
    obtenerCategorias, crearCategoria,
    obtenerCategoriasConsumibles, crearCategoriaConsumible, 
    obtenerConsumibles, crearConsumible, modificarStockConsumible, 
    registrarEntrada, obtenerHistorialEntradas, // NUEVAS EXPORTACIONES
    obtenerPiezas, crearPieza, actualizarPieza,
    obtenerSets, obtenerSetsPorCategoria, crearSet, actualizarSet,
    obtenerComposicionSet, agregarPiezaASet, quitarPiezaDeSet, surtirSet
};