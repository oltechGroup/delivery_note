//almacen-oltech-backend/src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    // 1. Leer el token del header "Authorization"
    // El formato estándar que nos mandará React es: "Bearer eyJhbGci..."
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ mensaje: 'Acceso denegado. No se proporcionó un token válido.' });
    }

    // 2. Extraer el token (quitando la palabra "Bearer " y el espacio)
    const token = authHeader.split(' ')[1];

    try {
        // 3. Verificar el token con nuestra llave secreta
        const verificado = jwt.verify(token, process.env.JWT_SECRET || 'super_secreto_imposible_de_hackear_oltech_2026');
        
        // 4. Guardamos los datos del usuario (id, user_name, rol) en la request
        // Así, los controladores sabrán exactamente quién está haciendo la petición
        req.usuario = verificado;
        
        // 5. ¡Pásale! Le decimos a Express que continúe con la ruta
        next();
    } catch (error) {
        return res.status(401).json({ mensaje: 'Token inválido o expirado. Por favor, inicia sesión nuevamente.' });
    }
};

module.exports = { verificarToken };