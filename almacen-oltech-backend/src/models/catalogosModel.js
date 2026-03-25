// almacen-oltech-backend/src/models/catalogosModel.js
const pool = require('../config/database');

// ==========================================
// MÓDULO: UNIDADES MÉDICAS
// ==========================================

const getAllUnidades = async () => {
    const query = `SELECT id, nombre FROM unidad_medica ORDER BY nombre ASC`;
    const { rows } = await pool.query(query);
    return rows;
};

const createUnidad = async (nombre) => {
    const query = `
        INSERT INTO unidad_medica (nombre) 
        VALUES ($1) 
        RETURNING id, nombre;
    `;
    const { rows } = await pool.query(query, [nombre]);
    return rows[0];
};

const updateUnidad = async (id, nombre) => {
    const query = `
        UPDATE unidad_medica 
        SET nombre = $1 
        WHERE id = $2 
        RETURNING id, nombre;
    `;
    const { rows } = await pool.query(query, [nombre, id]);
    return rows[0];
};

// ==========================================
// MÓDULO: MÉDICOS
// ==========================================

const getAllMedicos = async () => {
    const query = `
        SELECT 
            m.id, 
            m.nombre_completo, 
            m.email, 
            m.telefono, 
            m.unidad_medica_id,
            u.nombre AS unidad_medica_nombre
        FROM medicos m
        LEFT JOIN unidad_medica u ON m.unidad_medica_id = u.id
        ORDER BY m.nombre_completo ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

const getMedicosByUnidad = async (unidad_medica_id) => {
    const query = `
        SELECT id, nombre_completo 
        FROM medicos 
        WHERE unidad_medica_id = $1 
        ORDER BY nombre_completo ASC
    `;
    const { rows } = await pool.query(query, [unidad_medica_id]);
    return rows;
};

const createMedico = async (medicoData) => {
    const { nombre_completo, email, telefono, unidad_medica_id } = medicoData;
    const query = `
        INSERT INTO medicos (nombre_completo, email, telefono, unidad_medica_id) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *;
    `;
    // Pasamos los valores, permitiendo que email, telefono o unidad_medica_id sean null si no vienen
    const values = [nombre_completo, email || null, telefono || null, unidad_medica_id || null];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

const updateMedico = async (id, medicoData) => {
    const { nombre_completo, email, telefono, unidad_medica_id } = medicoData;
    const query = `
        UPDATE medicos 
        SET nombre_completo = $1, email = $2, telefono = $3, unidad_medica_id = $4
        WHERE id = $5 
        RETURNING *;
    `;
    const values = [nombre_completo, email || null, telefono || null, unidad_medica_id || null, id];
    const { rows } = await pool.query(query, values);
    return rows[0];
};

// ==========================================
// MÓDULO: PROCEDIMIENTOS
// ==========================================

const getAllProcedimientos = async () => {
    const query = `SELECT id, nombre FROM procedimiento ORDER BY nombre ASC`;
    const { rows } = await pool.query(query);
    return rows;
};

const createProcedimiento = async (nombre) => {
    const query = `
        INSERT INTO procedimiento (nombre) 
        VALUES ($1) 
        RETURNING id, nombre;
    `;
    const { rows } = await pool.query(query, [nombre]);
    return rows[0];
};

const updateProcedimiento = async (id, nombre) => {
    const query = `
        UPDATE procedimiento 
        SET nombre = $1 
        WHERE id = $2 
        RETURNING id, nombre;
    `;
    const { rows } = await pool.query(query, [nombre, id]);
    return rows[0];
};

module.exports = {
    getAllUnidades, 
    createUnidad, 
    updateUnidad,
    getAllMedicos, 
    getMedicosByUnidad, 
    createMedico, 
    updateMedico,
    getAllProcedimientos, 
    createProcedimiento, 
    updateProcedimiento 
};