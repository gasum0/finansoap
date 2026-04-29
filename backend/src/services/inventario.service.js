const { Producto, Insumo, Receta, AlertaInventario } = require('../models');

/**
 * Descuenta stock de productos e insumos al pasar venta a "elaboracion".
 * Usa transacción ACID: si algo falla hace rollback completo.
 */
async function descontarStockPorVenta(items, transaction) {
  for (const item of items) {
    // Lock sin include para evitar error de PostgreSQL con outer joins
    const producto = await Producto.findByPk(item.producto_id, {
      transaction,
      lock: true,
    });

    if (!producto) throw new Error(`Producto ${item.producto_id} no encontrado`);

    // Cargar receta con insumos por separado sin lock
    const receta = await Receta.findAll({
      where: { producto_id: item.producto_id },
      include: [{ model: Insumo, as: 'insumo' }],
      transaction,
    });

    // 1. Descontar stock del producto terminado
    const nuevoStock = producto.stock_actual - item.cantidad;
    if (nuevoStock < 0) {
      throw new Error(`Stock insuficiente para "${producto.nombre}" (disponible: ${producto.stock_actual})`);
    }
    await producto.update({ stock_actual: nuevoStock }, { transaction });

    // 2. Descontar insumos según la receta del producto
    for (const recetaItem of receta) {
      const insumo = recetaItem.insumo;
      const cantidadUsada = parseFloat(recetaItem.cantidad_por_unidad) * item.cantidad;
      const nuevoStockInsumo = parseFloat(insumo.stock_actual) - cantidadUsada;

      if (nuevoStockInsumo < 0) {
        throw new Error(
          `Insumo insuficiente: "${insumo.nombre}" (disponible: ${insumo.stock_actual} ${insumo.unidad})`
        );
      }
      await insumo.update({ stock_actual: nuevoStockInsumo }, { transaction });

      // 3. Alerta si el insumo baja al mínimo
      if (nuevoStockInsumo <= parseFloat(insumo.stock_minimo)) {
        await crearAlerta('insumo', insumo.id, insumo.nombre, nuevoStockInsumo, insumo.stock_minimo, transaction);
      }
    }

    // 4. Alerta si el producto baja al mínimo
    if (nuevoStock <= producto.stock_minimo) {
      await crearAlerta('producto', producto.id, producto.nombre, nuevoStock, producto.stock_minimo, transaction);
    }
  }
}

/**
 * Restaura stock cuando una venta se cancela desde el estado "elaboracion".
 */
async function restaurarStockPorVenta(items, transaction) {
  for (const item of items) {
    // Lock sin include para evitar error de PostgreSQL con outer joins
    const producto = await Producto.findByPk(item.producto_id, {
      transaction,
      lock: true,
    });
    if (!producto) continue;

    // Cargar receta con insumos por separado sin lock
    const receta = await Receta.findAll({
      where: { producto_id: item.producto_id },
      include: [{ model: Insumo, as: 'insumo' }],
      transaction,
    });

    await producto.update({ stock_actual: producto.stock_actual + item.cantidad }, { transaction });

    for (const recetaItem of receta) {
      const insumo = recetaItem.insumo;
      const cantidadRestaurada = parseFloat(recetaItem.cantidad_por_unidad) * item.cantidad;
      await insumo.update(
        { stock_actual: parseFloat(insumo.stock_actual) + cantidadRestaurada },
        { transaction }
      );
    }
  }
}

/**
 * Crea alerta de inventario evitando duplicados no resueltos.
 */
async function crearAlerta(tipo_item, item_id, nombre_item, stock_actual, stock_minimo, transaction) {
  const yaExiste = await AlertaInventario.findOne({
    where: { tipo_item, item_id, resuelta: false },
    transaction,
  });
  if (!yaExiste) {
    await AlertaInventario.create(
      { tipo_item, item_id, nombre_item, stock_actual, stock_minimo },
      { transaction }
    );
  }
}

/**
 * Registra una entrada de materiales al inventario y actualiza costo unitario.
 * Se llama al recibir un pedido de proveedor o al registrar una entrada manual.
 */
async function registrarEntradaInsumo(insumo_id, cantidad, costo_total, transaction) {
  const insumo = await Insumo.findByPk(insumo_id, { transaction, lock: true });
  if (!insumo) throw new Error('Insumo no encontrado');

  const nuevoStock = parseFloat(insumo.stock_actual) + parseFloat(cantidad);
  const nuevoCostoUnitario = parseFloat(costo_total) / parseFloat(cantidad);

  await insumo.update({ stock_actual: nuevoStock, costo_unitario: nuevoCostoUnitario }, { transaction });

  // Resolver alerta si el stock supera el mínimo
  if (nuevoStock > parseFloat(insumo.stock_minimo)) {
    await AlertaInventario.update(
      { resuelta: true },
      { where: { tipo_item: 'insumo', item_id: insumo_id, resuelta: false }, transaction }
    );
  }

  return insumo;
}

module.exports = { descontarStockPorVenta, restaurarStockPorVenta, crearAlerta, registrarEntradaInsumo };