const {
  sequelize,
  Producto, Insumo, Receta, Categoria, CategoriaInventario,
  Proveedor, AlertaInventario, MovimientoFinanciero,
} = require('../models');
const { registrarEntradaInsumo } = require('../services/inventario.service');
const { actualizarCostoProducto, recalcularProductosPorInsumo } = require('../services/financiero.service');

// ── PRODUCTOS ──────────────────────────────────────────────

async function listarProductos(req, res) {
  try {
    const { activo, categoria_id } = req.query;
    const where = {};
    if (activo !== undefined) where.activo = activo === 'true';
    if (categoria_id) where.categoria_id = categoria_id;

    const productos = await Producto.findAll({
      where,
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        {
          model: Receta, as: 'receta',
          include: [{ model: Insumo, as: 'insumo', attributes: ['id', 'nombre', 'unidad', 'costo_unitario'] }],
        },
      ],
      order: [['nombre', 'ASC']],
    });
    res.json({ productos });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
}

async function crearProducto(req, res) {
  const t = await sequelize.transaction();
  try {
    const { nombre, sku, descripcion, precio_venta, stock_actual, stock_minimo, unidad, categoria_id, receta } = req.body;

    const producto = await Producto.create(
      { nombre, sku, descripcion, precio_venta, stock_actual: stock_actual || 0, stock_minimo: stock_minimo || 0, unidad, categoria_id },
      { transaction: t }
    );

    if (receta?.length) {
      await Receta.bulkCreate(
        receta.map((r) => ({ producto_id: producto.id, insumo_id: r.insumo_id, cantidad_por_unidad: r.cantidad_por_unidad })),
        { transaction: t }
      );
      await actualizarCostoProducto(producto.id, t);
    }

    await t.commit();

    const completo = await Producto.findByPk(producto.id, {
      include: [
        { model: Receta, as: 'receta', include: [{ model: Insumo, as: 'insumo' }] },
        { model: Categoria, as: 'categoria' },
      ],
    });
    res.status(201).json({ producto: completo });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ error: e.message || 'Error al crear el producto' });
  }
}

async function actualizarProducto(req, res) {
  const t = await sequelize.transaction();
  try {
    const producto = await Producto.findByPk(req.params.id, { transaction: t });
    if (!producto) { await t.rollback(); return res.status(404).json({ error: 'Producto no encontrado' }); }

    const { receta, ...datos } = req.body;
    await producto.update(datos, { transaction: t });

    if (receta) {
      await Receta.destroy({ where: { producto_id: producto.id }, transaction: t });
      if (receta.length) {
        await Receta.bulkCreate(
          receta.map((r) => ({ producto_id: producto.id, insumo_id: r.insumo_id, cantidad_por_unidad: r.cantidad_por_unidad })),
          { transaction: t }
        );
      }
    }
    // Siempre recalcular costo y margen al actualizar
    await actualizarCostoProducto(producto.id, t);

    await t.commit();

    const completo = await Producto.findByPk(producto.id, {
      include: [
        { model: Receta, as: 'receta', include: [{ model: Insumo, as: 'insumo' }] },
        { model: Categoria, as: 'categoria' },
      ],
    });
    res.json({ producto: completo });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
}

// ── INSUMOS ──────────────────────────────────────────────

async function listarInsumos(req, res) {
  try {
    const { categoria_id } = req.query;
    const where = { activo: true };
    if (categoria_id) where.categoria_id = categoria_id;

    const insumos = await Insumo.findAll({
      where,
      include: [
        { model: CategoriaInventario, as: 'categoria', attributes: ['id', 'nombre', 'color'] },
        { model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] },
      ],
      order: [['nombre', 'ASC']],
    });
    res.json({ insumos });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener insumos' });
  }
}

async function crearInsumo(req, res) {
  try {
    const { nombre, unidad, stock_actual, stock_minimo, costo_unitario, categoria_id, proveedor_id } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

    const insumo = await Insumo.create({
      nombre, unidad,
      stock_actual:  stock_actual  || 0,
      stock_minimo:  stock_minimo  || 0,
      costo_unitario: costo_unitario || 0,
      categoria_id: categoria_id || null,
      proveedor_id:  proveedor_id  || null,
    });
    res.status(201).json({ insumo });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear el insumo' });
  }
}

async function actualizarInsumo(req, res) {
  const t = await sequelize.transaction();
  try {
    const insumo = await Insumo.findByPk(req.params.id, { transaction: t });
    if (!insumo) { await t.rollback(); return res.status(404).json({ error: 'Insumo no encontrado' }); }

    await insumo.update(req.body, { transaction: t });

    // Si cambió el costo_unitario, recalcular costos de productos que lo usan
    if (req.body.costo_unitario !== undefined) {
      await recalcularProductosPorInsumo(insumo.id);
    }

    await t.commit();
    res.json({ insumo });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ error: 'Error al actualizar el insumo' });
  }
}

async function registrarEntrada(req, res) {
  const t = await sequelize.transaction();
  try {
    const { insumo_id, cantidad, costo_total, proveedor, notas } = req.body;
    if (!insumo_id || !cantidad || !costo_total) {
      await t.rollback();
      return res.status(400).json({ error: 'insumo_id, cantidad y costo_total son requeridos' });
    }

    await registrarEntradaInsumo(insumo_id, cantidad, costo_total, t);

    // Registrar egreso financiero
    await MovimientoFinanciero.create(
      {
        tipo: 'egreso',
        categoria: 'compra_insumo',
        monto: costo_total,
        descripcion: `Compra manual de insumo${proveedor ? ` (${proveedor})` : ''}${notas ? `. ${notas}` : ''}`.trim(),
        usuario_id: req.usuario.id,
        canal_pago: 'n_a',
        fecha: new Date(),
      },
      { transaction: t }
    );

    // Recalcular costos de productos afectados
    await recalcularProductosPorInsumo(insumo_id);

    await t.commit();

    req.app.get('io')?.emit('inventario:actualizado', { insumo_id });
    res.json({ mensaje: 'Entrada registrada y costos actualizados correctamente' });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ error: e.message || 'Error al registrar la entrada' });
  }
}

// ── ALERTAS ──────────────────────────────────────────────

async function listarAlertas(req, res) {
  try {
    const alertas = await AlertaInventario.findAll({
      where: { resuelta: false },
      order: [['created_at', 'DESC']],
    });
    res.json({ alertas });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
}

async function resolverAlerta(req, res) {
  try {
    const alerta = await AlertaInventario.findByPk(req.params.id);
    if (!alerta) return res.status(404).json({ error: 'Alerta no encontrada' });
    await alerta.update({ resuelta: true });
    res.json({ mensaje: 'Alerta resuelta' });
  } catch (e) {
    res.status(500).json({ error: 'Error al resolver la alerta' });
  }
}

module.exports = {
  listarProductos, crearProducto, actualizarProducto,
  listarInsumos, crearInsumo, actualizarInsumo,
  registrarEntrada, listarAlertas, resolverAlerta,
};
