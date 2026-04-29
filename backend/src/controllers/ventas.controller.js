const { sequelize, Venta, ItemVenta, Cliente, Producto, Usuario, HistorialVenta, ESTADOS_VENTA } = require('../models');
const { descontarStockPorVenta, restaurarStockPorVenta } = require('../services/inventario.service');
const { registrarIngresoPorVenta } = require('../services/financiero.service');
const { Op } = require('sequelize');

// confirmado → elaboracion → enviado → entregado | cancelado
const TRANSICIONES_VALIDAS = {
  confirmado:  ['elaboracion', 'cancelado'],
  elaboracion: ['enviado', 'cancelado'],
  enviado:     ['entregado'],
  entregado:   [],
  cancelado:   [],
};

function generarCodigo() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
  return `VTA-${yy}${mm}${dd}-${rand}`;
}

// GET /api/ventas
async function listar(req, res) {
  try {
    const { estado, cliente_id, fecha_inicio, fecha_fin, busqueda, page = 1, limit = 200 } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (cliente_id) where.cliente_id = cliente_id;
    if (fecha_inicio && fecha_fin) {
      where.created_at = { [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin + 'T23:59:59')] };
    }

    let ventas = await Venta.findAll({
      where,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'nombre', 'telefono'] },
        { model: ItemVenta, as: 'items', include: [{ model: Producto, as: 'producto', attributes: ['id', 'nombre', 'sku'] }] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    if (busqueda) {
      const q = busqueda.toLowerCase();
      ventas = ventas.filter(v =>
        v.cliente?.nombre?.toLowerCase().includes(q) || v.codigo?.toLowerCase().includes(q)
      );
    }

    res.json({ ventas, total: ventas.length });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
}

// GET /api/ventas/:id
async function obtener(req, res) {
  try {
    const venta = await Venta.findByPk(req.params.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: ItemVenta, as: 'items', include: [{ model: Producto, as: 'producto' }] },
        { model: HistorialVenta, as: 'historial', include: [{ model: Usuario, as: 'usuario', attributes: ['nombre'] }] },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre'] },
      ],
      order: [[{ model: HistorialVenta, as: 'historial' }, 'created_at', 'ASC']],
    });
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
    res.json({ venta });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener la venta' });
  }
}

// POST /api/ventas
async function crear(req, res) {
  const t = await sequelize.transaction();
  try {
    const { cliente_id, items, metodo_pago, canal, notas, fecha_entrega } = req.body;

    if (!cliente_id || !items?.length) {
      await t.rollback();
      return res.status(400).json({ error: 'cliente_id e items son requeridos' });
    }

    const cliente = await Cliente.findByPk(cliente_id, { transaction: t });
    if (!cliente) { await t.rollback(); return res.status(404).json({ error: 'Cliente no encontrado' }); }

    let total = 0;
    const itemsConPrecio = [];
    for (const item of items) {
      const producto = await Producto.findByPk(item.producto_id, { transaction: t });
      if (!producto) { await t.rollback(); return res.status(404).json({ error: `Producto ${item.producto_id} no encontrado` }); }
      const subtotal = parseFloat(producto.precio_venta) * item.cantidad;
      total += subtotal;
      itemsConPrecio.push({ producto_id: item.producto_id, cantidad: item.cantidad, precio_unitario: producto.precio_venta, subtotal });
    }

    const venta = await Venta.create({
      codigo: generarCodigo(),
      cliente_id, usuario_id: req.usuario.id,
      estado: 'confirmado',
      canal: canal || 'manual',
      metodo_pago: metodo_pago || 'efectivo',
      total, notas, fecha_entrega,
    }, { transaction: t });

    await ItemVenta.bulkCreate(
      itemsConPrecio.map(i => ({ ...i, venta_id: venta.id })),
      { transaction: t }
    );

    await HistorialVenta.create(
      { venta_id: venta.id, usuario_id: req.usuario.id, estado_anterior: null, estado_nuevo: 'confirmado' },
      { transaction: t }
    );

    await t.commit();
    req.app.get('io')?.emit('venta:nueva', { ventaId: venta.id, codigo: venta.codigo });

    const completa = await Venta.findByPk(venta.id, {
      include: [{ model: Cliente, as: 'cliente' }, { model: ItemVenta, as: 'items', include: [{ model: Producto, as: 'producto' }] }],
    });
    res.status(201).json({ venta: completa });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ error: e.message || 'Error al crear la venta' });
  }
}

// PATCH /api/ventas/:id/estado
async function cambiarEstado(req, res) {
  const t = await sequelize.transaction();
  try {
    const { estado, notas } = req.body;

    const venta = await Venta.findByPk(req.params.id, {
      transaction: t,
      lock: true,
    });

    // ✅ null check ANTES de usar venta.id
    if (!venta) {
      await t.rollback();
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    // Cargar items por separado sin lock
    venta.items = await ItemVenta.findAll({
      where: { venta_id: venta.id },
      transaction: t,
    });

    const permitidas = TRANSICIONES_VALIDAS[venta.estado] || [];
    if (!permitidas.includes(estado)) {
      await t.rollback();
      return res.status(400).json({ error: `Transición inválida: ${venta.estado} → ${estado}`, permitidas });
    }

    const estadoAnterior = venta.estado;

    // Al pasar a elaboracion: descontar stock
    if (estado === 'elaboracion') {
      await descontarStockPorVenta(venta.items, t);
    }
    // Si se cancela desde elaboracion: restaurar stock
    if (estado === 'cancelado' && estadoAnterior === 'elaboracion') {
      await restaurarStockPorVenta(venta.items, t);
    }
    // Al entregar: registrar ingreso
    if (estado === 'entregado' && !venta.pago_confirmado) {
      await venta.update({ pago_confirmado: true }, { transaction: t });
      await registrarIngresoPorVenta(venta, t);
    }

    await venta.update({ estado }, { transaction: t });
    await HistorialVenta.create(
      { venta_id: venta.id, usuario_id: req.usuario.id, estado_anterior: estadoAnterior, estado_nuevo: estado, notas },
      { transaction: t }
    );

    await t.commit();
    req.app.get('io')?.emit('venta:estado', { ventaId: venta.id, estadoAnterior, estadoNuevo: estado });
    res.json({ mensaje: 'Estado actualizado', estadoAnterior, estadoNuevo: estado });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ error: e.message || 'Error al cambiar estado' });
  }
}

// PATCH /api/ventas/:id/pago
async function confirmarPago(req, res) {
  const t = await sequelize.transaction();
  try {
    const venta = await Venta.findByPk(req.params.id, { transaction: t, lock: true });
    if (!venta) { await t.rollback(); return res.status(404).json({ error: 'Venta no encontrada' }); }
    if (venta.pago_confirmado) { await t.rollback(); return res.status(400).json({ error: 'El pago ya fue confirmado' }); }
    await venta.update({ pago_confirmado: true }, { transaction: t });
    await registrarIngresoPorVenta(venta, t);
    await t.commit();
    res.json({ mensaje: 'Pago confirmado' });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ error: 'Error al confirmar pago' });
  }
}

module.exports = { listar, obtener, crear, cambiarEstado, confirmarPago };