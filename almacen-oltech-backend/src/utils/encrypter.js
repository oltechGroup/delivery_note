const bcrypt = require('bcrypt');

// El número de "saltos" define qué tan complejo será el algoritmo. 
// 10 es el estándar de la industria: muy seguro y rápido de procesar.
const saltRounds = 10;

/**
 * Encripta una contraseña en texto plano
 * @param {string} password - La contraseña original
 * @returns {Promise<string>} - El hash encriptado listo para la base de datos
 */
const hashPassword = async (password) => {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (error) {
        console.error('Error al encriptar la contraseña:', error);
        throw new Error('No se pudo procesar la contraseña de seguridad.');
    }
};

/**
 * Compara una contraseña ingresada en el login contra el hash de la base de datos
 * @param {string} password - La contraseña que el usuario escribió al intentar entrar
 * @param {string} hash - La contraseña encriptada que trajimos de PostgreSQL
 * @returns {Promise<boolean>} - Retorna true si son idénticas, false si se equivocó
 */
const comparePassword = async (password, hash) => {
    try {
        const match = await bcrypt.compare(password, hash);
        return match;
    } catch (error) {
        console.error('Error al comparar contraseñas:', error);
        throw new Error('Error al validar las credenciales.');
    }
};

// Exportamos las funciones para poder usarlas en nuestros controladores
module.exports = {
    hashPassword,
    comparePassword
};