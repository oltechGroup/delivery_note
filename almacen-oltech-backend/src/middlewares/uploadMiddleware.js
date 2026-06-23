//almacen-oltech-backend/src/middlewares/uploadMiddleware.js
const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento físico
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Determinamos en qué carpeta guardar según el nombre del campo que envíe React
        let carpeta = 'otros';
        if (file.fieldname === 'firma_url') carpeta = 'firmas';
        if (file.fieldname === 'foto_evidencia_url' || file.fieldname === 'foto_ine_url' || file.fieldname === 'foto_observaciones_url') carpeta = 'efectivo';
        if (file.fieldname === 'imagenes') carpeta = 'tickets';

        cb(null, path.join(__dirname, `../../uploads/${carpeta}`));
    },
    filename: (req, file, cb) => {
        // Generamos un nombre único: nombreDelCampo_fecha_random.extension
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname) || '.png';
        cb(null, file.fieldname + '_' + uniqueSuffix + ext);
    }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Formato no soportado. Solo se permiten imágenes.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // Límite de 10MB por imagen
});

module.exports = upload;