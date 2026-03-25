// almacen-oltech-backend/src/controllers/almacenController.js
const almacenModel = require('../models/almacenModel');

// ==========================================
// CONTROLADORES: CATEGORÍAS
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
// CONTROLADORES: CONSUMIBLES (Insumos a Granel)
// ==========================================
const obtenerConsumibles = async (req, res) => {
    try {
        const consumibles = await almacenModel.getAllConsumibles();
        res.json(consumibles);
    } catch (error) {
        console.error('Error al obtener consumibles:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar insumos.' });
    }
};

const crearConsumible = async (req, res) => {
    try {
        // Ahora recibe 'unidad_medida' como texto en lugar del ID
        const { codigo_referencia, nombre, unidad_medida, cantidad } = req.body;
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
        const { id } = req.params; // id de set_composicion
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
    obtenerConsumibles, crearConsumible, modificarStockConsumible,
    obtenerPiezas, crearPieza, actualizarPieza,
    obtenerSets, obtenerSetsPorCategoria, crearSet, actualizarSet,
    obtenerComposicionSet, agregarPiezaASet, quitarPiezaDeSet, surtirSet
};