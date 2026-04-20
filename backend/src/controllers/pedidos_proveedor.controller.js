const { sequelize, PedidoProveedor, ItemPedidoProveedor, Proveedor, Insumo, Usuario, MovimientoFinanciero, ESTADOS_PEDIDO_PROVEEDOR } = require('../models');
const { registrarEntradaInsumo } = require('../services/inventario.service');
const { recalcularProductosPorInsumo } = require('../services/financiero.service');

const TRANSICIONES = {
  borrador:   ['enviado', 'cancelado'],
  enviado:    ['en_camino', 'cancelado'],
  en_camino:  ['recibido'],
  recibido:   [],
  cancelado:  [],
};

function generarCodigo() {
  const d = new Date();
  const rand = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `PED-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${rand}`;
}

async function listar(req, res) {
  try {
    const { estado } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    const pedidos = await PedidoProveedor.findAll({
      where,
      include: [
        { model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre', 'telefono'] },
        { model: ItemPedidoProveedor, as: 'items', include: [{ model: Insumo, as: 'insumo', attributes: ['id', 'nombre', 'unidad'] }] },
      ],
      order: [['created_at', 'DESC']],
    });
    res.json({ pedidos });
  } catch (e) { res.status(500).json({ error: 'Error al obtener pedidos' }); }
}

async function crear(req, res) {
  const t = await sequelize.transaction();
  try {
    const { proveedor_id, items, notas, fecha_esperada } = req.body;
    if (!items?.length) { await t.rollback(); return res.status(400).json({ error: 'items es requerido' }); }

    let total = 0;
    const itemsConPrecio = [];
    for (const item of items) {
      const insumo = await Insumo.findByPk(item.insumo_id, { transaction: t });
      if (!insumo) { await t.rollback(); return res.status(404).json({ error: `Insumo ${item.insumo_id} no encontrado` }); }
      const precio = item.precio_unitario || insumo.costo_unitario;
      const subtotal = precio * item.cantidad;
      total += subtotal;
      itemsConPrecio.push({ insumo_id: item.insumo_id, cantidad: item.cantidad, precio_unitario: precio, subtotal });
    }

    const pedido = await PedidoProveedor.create({
      codigo: generarCodigo(), proveedor_id, usuario_id: req.usuario.id,
      estado: 'borrador', total, notas, fecha_esperada,
    }, { transaction: t });

    await ItemPedidoProveedor.bulkCreate(
      itemsConPrecio.map(i => ({ ...i, pedido_id: pedido.id })),
      { transaction: t }
    );

    await t.commit();
    const completo = await PedidoProveedor.findByPk(pedido.id, {
      include: [{ model: Proveedor, as: 'proveedor' }, { model: ItemPedidoProveedor, as: 'items', include: [{ model: Insumo, as: 'insumo' }] }],
    });
    res.status(201).json({ pedido: completo });
  } catch (e) { await t.rollback(); res.status(500).json({ error: e.message || 'Error al crear pedido' }); }
}

async function cambiarEstado(req, res) {
  const t = await sequelize.transaction();
  try {
    const { estado, notas } = req.body;
    const pedido = await PedidoProveedor.findByPk(req.params.id, {
      include: [{ model: ItemPedidoProveedor, as: 'items' }],
      transaction: t, lock: true,
    });
    if (!pedido) { await t.rollback(); return res.status(404).json({ error: 'Pedido no encontrado' }); }

    const permitidas = TRANSICIONES[pedido.estado] || [];
    if (!permitidas.includes(estado)) {
      await t.rollback();
      return res.status(400).json({ error: `Transición inválida: ${pedido.estado} → ${estado}`, permitidas });
    }

    // Al marcar como recibido: actualizar stock de cada insumo y registrar egresos
    if (estado === 'recibido') {
      for (const item of pedido.items) {
        await registrarEntradaInsumo(item.insumo_id, item.cantidad, item.subtotal, t);
        await recalcularProductosPorInsumo(item.insumo_id);
      }
      // Registrar egreso financiero total
      await MovimientoFinanciero.create({
        tipo: 'egreso', categoria: 'compra_insumo',
        monto: pedido.total,
        descripcion: `Pedido proveedor ${pedido.codigo}`,
        pedido_proveedor_id: pedido.id,
        usuario_id: req.usuario.id,
        canal_pago: 'n_a', fecha: new Date(),
      }, { transaction: t });
    }

    await pedido.update({ estado }, { transaction: t });
    await t.commit();

    req.app.get('io')?.emit('pedido_proveedor:estado', { pedidoId: pedido.id, estadoNuevo: estado });
    res.json({ mensaje: 'Estado actualizado', estadoNuevo: estado });
  } catch (e) { await t.rollback(); res.status(500).json({ error: e.message || 'Error al cambiar estado' }); }
}

module.exports = { listar, crear, cambiarEstado };
