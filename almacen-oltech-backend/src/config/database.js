const { Pool } = require('pg');
require('dotenv').config();

// Creamos la configuración de la conexión llamando a las variables del .env
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

// Probamos la conexión al inicializar
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error al conectar a la base de datos PostgreSQL:', err.stack);
    } else {
        console.log('¡Conexión exitosa a la base de datos almacen_oltech!');
    }
    // Liberamos el cliente para no saturar el pool
    if (client) release();
});

module.exports = pool;