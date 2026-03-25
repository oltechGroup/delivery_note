//almacen-oltech-backend/src/middlewares/roleMiddleware.js
/**
 * Middleware para verificar si el usuario tiene el rol necesario
 * @param {Array} rolesPermitidos - Arreglo con los nombres de los roles que pueden pasar (Ej. ['Sistemas', 'Operaciones'])
 */
const checkRole = (rolesPermitidos) => {
    return (req, res, next) => {
        // Validación de seguridad: Asegurarnos de que el authMiddleware ya hizo su trabajo
        if (!req.usuario) {
            return res.status(500).json({ mensaje: 'Error de servidor: No se encontró el usuario en la petición.' });
        }

        // Verificar si el rol del usuario actual está dentro de la lista de permitidos
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ 
                mensaje: `Acceso denegado. Tu rol (${req.usuario.rol}) no tiene permisos para realizar esta acción.` 
            });
        }

        // Si su rol está en la lista, lo dejamos pasar
        next();
    };
};

module.exports = { checkRole };