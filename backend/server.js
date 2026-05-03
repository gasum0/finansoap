require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');
const logger = require('./src/config/logger');

const authRoutes = require('./src/routes/auth.routes');
const ventasRoutes = require('./src/routes/ventas.routes');
const clientesRoutes = require('./src/routes/clientes.routes');
const productosRoutes = require('./src/routes/productos.routes');
const insumosRoutes = require('./src/routes/insumos.routes');
const financieroRoutes = require('./src/routes/financiero.routes');
const pedidosProveedorRoutes = require('./src/routes/pedidos_proveedor.routes');
const categoriasInvRoutes = require('./src/routes/categorias_inventario.routes');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
});
app.set('io', io);
io.on('connection', (socket) => {
  logger.info(`Socket conectado: ${socket.id}`);
  socket.on('disconnect', () => logger.info(`Socket desconectado: ${socket.id}`));
});

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

app.use('/api/auth', authRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/insumos', insumosRoutes);
app.use('/api/financiero', financieroRoutes);
app.use('/api/pedidos-proveedor', pedidosProveedorRoutes);
app.use('/api/categorias-inventario', categoriasInvRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

const PORT = process.env.PORT || 3001;
async function start() {
  try {
    await connectDB();

    // Revisar stock al arrancar
    const { Insumo, Producto, AlertaInventario } = require('./src/models');
    const insumos = await Insumo.findAll({ where: { activo: true } });
    for (const ins of insumos) {
      if (parseFloat(ins.stock_actual) <= parseFloat(ins.stock_minimo)) {
        const ya = await AlertaInventario.findOne({ where: { tipo_item: 'insumo', item_id: ins.id, resuelta: false } });
        if (!ya) await AlertaInventario.create({ tipo_item: 'insumo', item_id: ins.id, nombre_item: ins.nombre, stock_actual: ins.stock_actual, stock_minimo: ins.stock_minimo });
      }
    }
    const productos = await Producto.findAll({ where: { activo: true } });
    for (const prod of productos) {
      if (prod.stock_actual <= prod.stock_minimo) {
        const ya = await AlertaInventario.findOne({ where: { tipo_item: 'producto', item_id: prod.id, resuelta: false } });
        if (!ya) await AlertaInventario.create({ tipo_item: 'producto', item_id: prod.id, nombre_item: prod.nombre, stock_actual: prod.stock_actual, stock_minimo: prod.stock_minimo });
      }
    }
    logger.info('✅ Revisión de stock completada');

    await connectRedis();
    httpServer.listen(PORT, () => logger.info(`✅ FinanSoap backend en puerto ${PORT}`));
  } catch (e) { logger.error('Error al iniciar:', e); process.exit(1); }
}
start();
module.exports = { app, httpServer };