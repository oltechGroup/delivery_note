require('dotenv').config(); // Cargamos las variables de entorno primero

const app = require('./src/app'); // Importamos la app de Express configurada
const pool = require('./src/config/database'); // Importamos la conexión a la base de datos

// Definimos el puerto desde el .env, o usamos el 4000 por defecto
const PORT = process.env.PORT || 4000;

// Iniciamos el servidor
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    console.log(`🔗 Endpoint de prueba: http://localhost:${PORT}/api/status`);
    console.log(`=========================================`);
});