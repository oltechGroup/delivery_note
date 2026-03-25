// almacen-oltech-backend/src/controllers/catalogosController.js
const catalogosModel = require('../models/catalogosModel');

// ==========================================
// CONTROLADORES: UNIDADES MÉDICAS
// ==========================================

const obtenerUnidades = async (req, res) => {
    try {
        const unidades = await catalogosModel.getAllUnidades();
        res.json(unidades);
    } catch (error) {
        console.error('Error al obtener unidades médicas:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar las unidades médicas.' });
    }
};

const crearUnidad = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) {
            return res.status(400).json({ mensaje: 'El nombre de la unidad médica es obligatorio.' });
        }
        const nuevaUnidad = await catalogosModel.createUnidad(nombre);
        res.status(201).json({
            mensaje: 'Unidad médica registrada exitosamente.',
            unidad: nuevaUnidad
        });
    } catch (error) {
        console.error('Error al crear unidad médica:', error);
        res.status(500).json({ mensaje: 'Error interno al registrar la unidad médica.' });
    }
};

const actualizarUnidad = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        
        if (!nombre) {
            return res.status(400).json({ mensaje: 'El nombre de la unidad médica es obligatorio.' });
        }
        
        const unidadActualizada = await catalogosModel.updateUnidad(id, nombre);
        if (!unidadActualizada) {
            return res.status(404).json({ mensaje: 'Unidad médica no encontrada.' });
        }
        
        res.json({
            mensaje: 'Unidad médica actualizada correctamente.',
            unidad: unidadActualizada
        });
    } catch (error) {
        console.error('Error al actualizar unidad médica:', error);
        res.status(500).json({ mensaje: 'Error interno al actualizar la unidad médica.' });
    }
};

// ==========================================
// CONTROLADORES: MÉDICOS
// ==========================================

const obtenerMedicos = async (req, res) => {
    try {
        const medicos = await catalogosModel.getAllMedicos();
        res.json(medicos);
    } catch (error) {
        console.error('Error al obtener médicos:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar los médicos.' });
    }
};

const obtenerMedicosPorUnidad = async (req, res) => {
    try {
        const { unidad_medica_id } = req.params;
        const medicos = await catalogosModel.getMedicosByUnidad(unidad_medica_id);
        res.json(medicos);
    } catch (error) {
        console.error('Error al obtener médicos por unidad:', error);
        res.status(500).json({ mensaje: 'Error interno al filtrar los médicos.' });
    }
};

const crearMedico = async (req, res) => {
    try {
        const { nombre_completo, email, telefono, unidad_medica_id } = req.body;
        
        // El único campo estrictamente obligatorio según tu DB es el nombre
        if (!nombre_completo) {
            return res.status(400).json({ mensaje: 'El nombre completo del médico es obligatorio.' });
        }
        
        const nuevoMedico = await catalogosModel.createMedico({ 
            nombre_completo, 
            email, 
            telefono, 
            unidad_medica_id 
        });
        
        res.status(201).json({
            mensaje: 'Médico registrado exitosamente.',
            medico: nuevoMedico
        });
    } catch (error) {
        console.error('Error al crear médico:', error);
        res.status(500).json({ mensaje: 'Error interno al registrar al médico.' });
    }
};

const actualizarMedico = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_completo, email, telefono, unidad_medica_id } = req.body;
        
        if (!nombre_completo) {
            return res.status(400).json({ mensaje: 'El nombre completo del médico es obligatorio.' });
        }
        
        const medicoActualizado = await catalogosModel.updateMedico(id, { 
            nombre_completo, 
            email, 
            telefono, 
            unidad_medica_id 
        });
        
        if (!medicoActualizado) {
            return res.status(404).json({ mensaje: 'Médico no encontrado.' });
        }
        
        res.json({
            mensaje: 'Datos del médico actualizados correctamente.',
            medico: medicoActualizado
        });
    } catch (error) {
        console.error('Error al actualizar médico:', error);
        res.status(500).json({ mensaje: 'Error interno al actualizar los datos del médico.' });
    }
};

// ==========================================
// CONTROLADORES: PROCEDIMIENTOS
// ==========================================

const obtenerProcedimientos = async (req, res) => {
    try {
        const procedimientos = await catalogosModel.getAllProcedimientos();
        res.json(procedimientos);
    } catch (error) {
        console.error('Error al obtener procedimientos:', error);
        res.status(500).json({ mensaje: 'Error interno al cargar los procedimientos.' });
    }
};

const crearProcedimiento = async (req, res) => {
    try {
        const { nombre } = req.body;
        if (!nombre) return res.status(400).json({ mensaje: 'El nombre del procedimiento es obligatorio.' });
        
        const nuevoProcedimiento = await catalogosModel.createProcedimiento(nombre);
        res.status(201).json({ mensaje: 'Procedimiento registrado.', procedimiento: nuevoProcedimiento });
    } catch (error) {
        console.error('Error al crear procedimiento:', error);
        res.status(500).json({ mensaje: 'Error al registrar el procedimiento.' });
    }
};

const actualizarProcedimiento = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        
        if (!nombre) return res.status(400).json({ mensaje: 'El nombre es obligatorio.' });
        
        const procActualizado = await catalogosModel.updateProcedimiento(id, nombre);
        if (!procActualizado) return res.status(404).json({ mensaje: 'Procedimiento no encontrado.' });
        
        res.json({ mensaje: 'Procedimiento actualizado.', procedimiento: procActualizado });
    } catch (error) {
        console.error('Error al actualizar procedimiento:', error);
        res.status(500).json({ mensaje: 'Error al actualizar el procedimiento.' });
    }
};

module.exports = {
    obtenerUnidades, crearUnidad, actualizarUnidad,
    obtenerMedicos, obtenerMedicosPorUnidad, crearMedico, actualizarMedico,
    obtenerProcedimientos, crearProcedimiento, actualizarProcedimiento // <-- NUEVOS
};