// almacen-oltech-backend/src/routes/almacenRoutes.js
const express = require('express');
const router = express.Router();

// Importamos el controlador
const almacenController = require('../controllers/almacenController');

// Importamos los middlewares de seguridad
const { verificarToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// MEJORA Y CORRECCIÓN: Agregamos 'Biomédicos' (con acento, como está en la BD)
// para que puedan acceder al inventario y a la lógica de surtido
const rolesLectura = ['Sistemas', 'Almacén', 'Operaciones', 'Encargado de almacén', 'Biomédicos'];
const rolesEscritura = ['Sistemas', 'Almacén', 'Operaciones', 'Encargado de almacén', 'Biomédicos'];

// ==========================================
// RUTAS: CATEGORÍAS (Para Sets)
// ==========================================
router.get('/categorias', verificarToken, checkRole(rolesLectura), almacenController.obtenerCategorias);
router.post('/categorias', verificarToken, checkRole(rolesEscritura), almacenController.crearCategoria);
router.get('/categorias/:categoria_id/sets', verificarToken, checkRole(rolesLectura), almacenController.obtenerSetsPorCategoria);

// ==========================================
// RUTAS: CATEGORÍAS DE CONSUMIBLES (NUEVO)
// ==========================================
router.get('/categorias-consumibles', verificarToken, checkRole(rolesLectura), almacenController.obtenerCategoriasConsumibles);
router.post('/categorias-consumibles', verificarToken, checkRole(rolesEscritura), almacenController.crearCategoriaConsumible);

// ==========================================
// RUTAS: CONSUMIBLES (Inventario de Insumos)
// ==========================================
// NUEVA RUTA: Búsqueda profunda en el histórico (Debe ir antes de las rutas con :id)
router.get('/consumibles/historico', verificarToken, checkRole(rolesLectura), almacenController.buscarHistoricoLote);

router.get('/consumibles', verificarToken, checkRole(rolesLectura), almacenController.obtenerConsumibles);
router.post('/consumibles', verificarToken, checkRole(rolesEscritura), almacenController.crearConsumible);

// NUEVAS RUTAS: EDITAR Y ELIMINAR CONSUMIBLES
router.put('/consumibles/:id', verificarToken, checkRole(rolesEscritura), almacenController.actualizarConsumible);
router.delete('/consumibles/:id', verificarToken, checkRole(rolesEscritura), almacenController.eliminarConsumible);

// Usamos PATCH porque solo actualizamos el número de stock (+ o -), no todo el registro
router.patch('/consumibles/:id/stock', verificarToken, checkRole(rolesEscritura), almacenController.modificarStockConsumible);

// =========================================================================
// MÓDULO NUEVO: ENTRADAS MASIVAS DE ALMACÉN (INBOUND)
// =========================================================================
// Ruta para registrar una entrada masiva de mercancía (El carrito)
router.post('/entradas', verificarToken, checkRole(rolesEscritura), almacenController.registrarEntrada);
// Ruta para consultar el historial de folios ingresados (Auditoría)
router.get('/entradas/historial', verificarToken, checkRole(rolesLectura), almacenController.obtenerHistorialEntradas);
// NUEVA RUTA: Consultar el detalle de productos de una entrada específica
router.get('/entradas/:id/detalles', verificarToken, checkRole(rolesLectura), almacenController.obtenerDetallesDeEntrada);

// ==========================================
// RUTAS: PIEZAS
// ==========================================
router.get('/piezas', verificarToken, checkRole(rolesLectura), almacenController.obtenerPiezas);
router.post('/piezas', verificarToken, checkRole(rolesEscritura), almacenController.crearPieza);
router.put('/piezas/:id', verificarToken, checkRole(rolesEscritura), almacenController.actualizarPieza);

// ==========================================
// RUTAS: SETS MAESTROS
// ==========================================
router.get('/sets', verificarToken, checkRole(rolesLectura), almacenController.obtenerSets);
router.post('/sets', verificarToken, checkRole(rolesEscritura), almacenController.crearSet);
router.put('/sets/:id', verificarToken, checkRole(rolesEscritura), almacenController.actualizarSet);

// ==========================================
// RUTAS: COMPOSICIÓN DE SETS & SURTIDO
// ==========================================
// Obtener las piezas que conforman un set específico
router.get('/sets/:set_id/composicion', verificarToken, checkRole(rolesLectura), almacenController.obtenerComposicionSet);

// Agregar una pieza a un set
router.post('/sets/:set_id/composicion', verificarToken, checkRole(rolesEscritura), almacenController.agregarPiezaASet);

// Quitar una pieza de un set
router.delete('/composicion/:id', verificarToken, checkRole(rolesEscritura), almacenController.quitarPiezaDeSet);

// MEJORA PREMIUM: Ruta para surtir piezas desde consumibles
router.post('/composicion/:id/surtir', verificarToken, checkRole(rolesEscritura), almacenController.surtirSet);

// NUEVO: Ruta para forzar el estado de un Set a "Disponible"
router.patch('/sets/:id/disponible', verificarToken, checkRole(rolesEscritura), almacenController.marcarSetDisponible);


// ==========================================
// RUTAS: ALERTAS DASHBOARD
// ==========================================
// Ruta para obtener los sets que quedaron incompletos tras una remisión
router.get('/alertas/sets-incompletos', verificarToken, checkRole(rolesLectura), almacenController.obtenerAlertasIncompletos);

module.exports = router;