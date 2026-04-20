const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');

// ─── USUARIOS ───
const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  rol: { type: DataTypes.ENUM('admin', 'operadora'), allowNull: false, defaultValue: 'operadora' },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'usuarios', underscored: true });

// ─── CLIENTES ───
const Cliente = sequelize.define('Cliente', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  telefono: { type: DataTypes.STRING(20) },
  direccion: { type: DataTypes.TEXT },
  email: { type: DataTypes.STRING(150) },
  notas: { type: DataTypes.TEXT },
}, { tableName: 'clientes', underscored: true });

// ─── PROVEEDORES ───
const Proveedor = sequelize.define('Proveedor', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  telefono: { type: DataTypes.STRING(20) },
  email: { type: DataTypes.STRING(150) },
  direccion: { type: DataTypes.TEXT },
  notas: { type: DataTypes.TEXT },
}, { tableName: 'proveedores', underscored: true });

// ─── CATEGORIAS DE INVENTARIO ───
const CategoriaInventario = sequelize.define('CategoriaInventario', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  descripcion: { type: DataTypes.TEXT },
  color: { type: DataTypes.STRING(20), defaultValue: '#6366f1' },
}, { tableName: 'categorias_inventario', underscored: true });

// ─── CATEGORIAS DE PRODUCTOS ───
const Categoria = sequelize.define('Categoria', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false, unique: true },
}, { tableName: 'categorias', underscored: true });

// ─── INSUMOS ───
const Insumo = sequelize.define('Insumo', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  unidad: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'g' },
  stock_actual: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  stock_minimo: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  costo_unitario: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  proveedor_id: { type: DataTypes.UUID },
  categoria_id: { type: DataTypes.UUID },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'insumos', underscored: true });

// ─── PRODUCTOS ───
const Producto = sequelize.define('Producto', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  sku: { type: DataTypes.STRING(50), unique: true },
  descripcion: { type: DataTypes.TEXT },
  precio_venta: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  costo_produccion: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  margen: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
  stock_actual: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  stock_minimo: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  unidad: { type: DataTypes.STRING(20), defaultValue: 'unidad' },
  imagen_url: { type: DataTypes.STRING(500) },
  categoria_id: { type: DataTypes.UUID },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'productos', underscored: true });

// ─── RECETAS ───
const Receta = sequelize.define('Receta', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  producto_id: { type: DataTypes.UUID, allowNull: false },
  insumo_id: { type: DataTypes.UUID, allowNull: false },
  cantidad_por_unidad: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
}, { tableName: 'recetas', underscored: true, timestamps: false });

// ─── VENTAS (clientes finales) ───
// confirmado → elaboracion → enviado → entregado | cancelado
const ESTADOS_VENTA = ['confirmado', 'elaboracion', 'enviado', 'entregado', 'cancelado'];

const Venta = sequelize.define('Venta', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  codigo: { type: DataTypes.STRING(20), unique: true },
  cliente_id: { type: DataTypes.UUID, allowNull: false },
  usuario_id: { type: DataTypes.UUID },
  estado: { type: DataTypes.ENUM(...ESTADOS_VENTA), defaultValue: 'confirmado', allowNull: false },
  canal: { type: DataTypes.ENUM('whatsapp', 'manual'), defaultValue: 'manual' },
  metodo_pago: { type: DataTypes.ENUM('transferencia', 'nequi', 'efectivo'), defaultValue: 'efectivo' },
  total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  pago_confirmado: { type: DataTypes.BOOLEAN, defaultValue: false },
  notas: { type: DataTypes.TEXT },
  fecha_entrega: { type: DataTypes.DATEONLY },
}, { tableName: 'ventas', underscored: true });

// ─── ITEMS_VENTA ───
const ItemVenta = sequelize.define('ItemVenta', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  venta_id: { type: DataTypes.UUID, allowNull: false },
  producto_id: { type: DataTypes.UUID, allowNull: false },
  cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  precio_unitario: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
}, { tableName: 'items_venta', underscored: true, timestamps: false });

// ─── HISTORIAL_VENTA ───
const HistorialVenta = sequelize.define('HistorialVenta', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  venta_id: { type: DataTypes.UUID, allowNull: false },
  usuario_id: { type: DataTypes.UUID },
  estado_anterior: { type: DataTypes.STRING(30) },
  estado_nuevo: { type: DataTypes.STRING(30), allowNull: false },
  notas: { type: DataTypes.TEXT },
}, { tableName: 'historial_venta', underscored: true, updatedAt: false });

// ─── PEDIDOS A PROVEEDOR ───
// borrador → enviado → en_camino → recibido | cancelado
const ESTADOS_PEDIDO_PROVEEDOR = ['borrador', 'enviado', 'en_camino', 'recibido', 'cancelado'];

const PedidoProveedor = sequelize.define('PedidoProveedor', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  codigo: { type: DataTypes.STRING(20), unique: true },
  proveedor_id: { type: DataTypes.UUID },
  usuario_id: { type: DataTypes.UUID },
  estado: { type: DataTypes.ENUM(...ESTADOS_PEDIDO_PROVEEDOR), defaultValue: 'borrador' },
  total: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  notas: { type: DataTypes.TEXT },
  fecha_esperada: { type: DataTypes.DATEONLY },
}, { tableName: 'pedidos_proveedor', underscored: true });

// ─── ITEMS_PEDIDO_PROVEEDOR ───
const ItemPedidoProveedor = sequelize.define('ItemPedidoProveedor', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  pedido_id: { type: DataTypes.UUID, allowNull: false },
  insumo_id: { type: DataTypes.UUID, allowNull: false },
  cantidad: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  precio_unitario: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
}, { tableName: 'items_pedido_proveedor', underscored: true, timestamps: false });

// ─── MOVIMIENTOS_FINANCIEROS ───
const MovimientoFinanciero = sequelize.define('MovimientoFinanciero', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tipo: { type: DataTypes.ENUM('ingreso', 'egreso'), allowNull: false },
  categoria: { type: DataTypes.ENUM('venta', 'compra_insumo', 'gasto_operativo', 'otro'), allowNull: false },
  monto: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  descripcion: { type: DataTypes.TEXT },
  venta_id: { type: DataTypes.UUID },
  pedido_proveedor_id: { type: DataTypes.UUID },
  usuario_id: { type: DataTypes.UUID },
  canal_pago: { type: DataTypes.ENUM('transferencia', 'nequi', 'efectivo', 'n_a'), defaultValue: 'n_a' },
  fecha: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'movimientos_financieros', underscored: true, updatedAt: false });

// ─── ALERTAS_INVENTARIO ───
const AlertaInventario = sequelize.define('AlertaInventario', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tipo_item: { type: DataTypes.ENUM('producto', 'insumo'), allowNull: false },
  item_id: { type: DataTypes.UUID, allowNull: false },
  nombre_item: { type: DataTypes.STRING(150), allowNull: false },
  stock_actual: { type: DataTypes.DECIMAL(12, 2) },
  stock_minimo: { type: DataTypes.DECIMAL(12, 2) },
  resuelta: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'alertas_inventario', underscored: true, updatedAt: false });

// ─── ASOCIACIONES ───
CategoriaInventario.hasMany(Insumo, { foreignKey: 'categoria_id', as: 'insumos' });
Insumo.belongsTo(CategoriaInventario, { foreignKey: 'categoria_id', as: 'categoria' });
Proveedor.hasMany(Insumo, { foreignKey: 'proveedor_id', as: 'insumos' });
Insumo.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });
Producto.hasMany(Receta, { foreignKey: 'producto_id', as: 'receta' });
Receta.belongsTo(Producto, { foreignKey: 'producto_id' });
Insumo.hasMany(Receta, { foreignKey: 'insumo_id', as: 'uso_en_recetas' });
Receta.belongsTo(Insumo, { foreignKey: 'insumo_id', as: 'insumo' });
Cliente.hasMany(Venta, { foreignKey: 'cliente_id', as: 'ventas' });
Venta.belongsTo(Cliente, { foreignKey: 'cliente_id', as: 'cliente' });
Usuario.hasMany(Venta, { foreignKey: 'usuario_id', as: 'ventas_gestionadas' });
Venta.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Venta.hasMany(ItemVenta, { foreignKey: 'venta_id', as: 'items' });
ItemVenta.belongsTo(Venta, { foreignKey: 'venta_id' });
Producto.hasMany(ItemVenta, { foreignKey: 'producto_id' });
ItemVenta.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
Venta.hasMany(HistorialVenta, { foreignKey: 'venta_id', as: 'historial' });
HistorialVenta.belongsTo(Venta, { foreignKey: 'venta_id' });
Usuario.hasMany(HistorialVenta, { foreignKey: 'usuario_id' });
HistorialVenta.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Proveedor.hasMany(PedidoProveedor, { foreignKey: 'proveedor_id', as: 'pedidos' });
PedidoProveedor.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });
PedidoProveedor.hasMany(ItemPedidoProveedor, { foreignKey: 'pedido_id', as: 'items' });
ItemPedidoProveedor.belongsTo(PedidoProveedor, { foreignKey: 'pedido_id' });
Insumo.hasMany(ItemPedidoProveedor, { foreignKey: 'insumo_id' });
ItemPedidoProveedor.belongsTo(Insumo, { foreignKey: 'insumo_id', as: 'insumo' });
Venta.hasMany(MovimientoFinanciero, { foreignKey: 'venta_id', as: 'movimientos' });
MovimientoFinanciero.belongsTo(Venta, { foreignKey: 'venta_id', as: 'venta' });

module.exports = {
  sequelize,
  Usuario, Cliente, Proveedor,
  Categoria, CategoriaInventario,
  Insumo, Producto, Receta,
  Venta, ItemVenta, HistorialVenta, ESTADOS_VENTA,
  PedidoProveedor, ItemPedidoProveedor, ESTADOS_PEDIDO_PROVEEDOR,
  MovimientoFinanciero, AlertaInventario,
};
