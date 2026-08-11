// almacen-oltech-backend/src/middlewares/roleMiddleware.js
/**
 * Middleware para verificar si el usuario tiene el rol necesario
 * Soporta tanto un string único (sistema original) como un arreglo de roles (Multi-rol)
 * @param {Array} rolesPermitidos - Arreglo con los nombres de los roles que pueden pasar (Ej. ['Sistemas', 'Operaciones'])
 */
const checkRole = (rolesPermitidos) => {
    return (req, res, next) => {
        // Validación de seguridad: Asegurarnos de que el authMiddleware ya hizo su trabajo
        if (!req.usuario) {
            return res.status(500).json({ mensaje: 'Error de servidor: No se encontró el usuario en la petición.' });
        }

        // Normalizamos los roles del usuario a un arreglo.
        // Si el JWT trae 'roles' (arreglo multi-rol de la nueva versión), lo usamos. 
        // Si solo trae 'rol' (string de la versión original), lo convertimos a arreglo para evaluarlo igual.
        const userRoles = Array.isArray(req.usuario.roles) 
            ? req.usuario.roles 
            : [req.usuario.rol];

        // Verificamos si AL MENOS UNO de los roles del usuario está en la lista de permitidos
        const tienePermiso = userRoles.some(rolUsuario => rolesPermitidos.includes(rolUsuario));

        if (!tienePermiso) {
            // Formateamos el mensaje para que sea claro en caso de que tenga varios roles
            const rolesAsignadosStr = userRoles.join(', ') || 'Sin rol asignado';
            return res.status(403).json({ 
                mensaje: `Acceso denegado. Tus roles actuales (${rolesAsignadosStr}) no tienen permisos para realizar esta acción.` 
            });
        }

        // Si tiene al menos un rol permitido, lo dejamos pasar
        next();
    };
};

module.exports = { checkRole };