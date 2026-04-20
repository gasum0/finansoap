const { Producto, Receta, Insumo, MovimientoFinanciero } = require('../models');

/**
 * Calcula el costo de producción de un producto según su receta.
 * CostoProduccion = Σ (cantidad_por_unidad × costo_unitario_insumo)
 */
async function calcularCostoProduccion(producto_id, transaction = null) {
  const receta = await Receta.findAll({
    where: { producto_id },
    include: [{ model: Insumo, as: 'insumo' }],
    ...(transaction && { transaction }),
  });

  if (!receta.length) return 0;

  const costo = receta.reduce((total, item) => {
    return total + parseFloat(item.cantidad_por_unidad) * parseFloat(item.insumo.costo_unitario);
  }, 0);

  return Math.round(costo * 100) / 100;
}

/**
 * Recalcula y actualiza el costo y margen de un producto.
 * Se llama cuando cambia el precio de un insumo o la receta.
 */
async function actualizarCostoProducto(producto_id, transaction = null) {
  const producto = await Producto.findByPk(producto_id, {
    ...(transaction && { transaction }),
  });
  if (!producto) throw new Error('Producto no encontrado');

  const costo = await calcularCostoProduccion(producto_id, transaction);
  const precio = parseFloat(producto.precio_venta);
  const margen = precio > 0 ? ((precio - costo) / precio) * 100 : 0;

  await producto.update(
    { costo_produccion: costo, margen: Math.round(margen * 100) / 100 },
    { ...(transaction && { transaction }) }
  );

  return { costo, margen: Math.round(margen * 100) / 100, alerta: margen <= 0 };
}

/**
 * Recalcula el costo de TODOS los productos que usan un insumo específico.
 * Se llama cuando se actualiza el costo_unitario de un insumo.
 */
async function recalcularProductosPorInsumo(insumo_id) {
  const recetas = await Receta.findAll({ where: { insumo_id } });
  const productosAfectados = [...new Set(recetas.map((r) => r.producto_id))];

  const resultados = [];
  for (const producto_id of productosAfectados) {
    const r = await actualizarCostoProducto(producto_id);
    resultados.push({ producto_id, ...r });
  }
  return resultados;
}

/**
 * Registra un ingreso automático al confirmar pago de una venta.
 */
async function registrarIngresoPorVenta(venta, transaction) {
  return MovimientoFinanciero.create(
    {
      tipo: 'ingreso',
      categoria: 'venta',
      monto: venta.total,
      descripcion: `Venta #${venta.codigo}`,
      venta_id: venta.id,
      usuario_id: venta.usuario_id,
      canal_pago: venta.metodo_pago || 'efectivo',
      fecha: new Date(),
    },
    { transaction }
  );
}

/**
 * Genera el resumen financiero de un período.
 */
async function generarResumenFinanciero(fechaInicio, fechaFin) {
  const { Op } = require('sequelize');

  const movimientos = await MovimientoFinanciero.findAll({
    where: { fecha: { [Op.between]: [fechaInicio, fechaFin] } },
    order: [['fecha', 'ASC']],
  });

  const ingresos = movimientos.filter((m) => m.tipo === 'ingreso');
  const egresos  = movimientos.filter((m) => m.tipo === 'egreso');

  const totalIngresos = ingresos.reduce((s, m) => s + parseFloat(m.monto), 0);
  const totalEgresos  = egresos.reduce((s, m) => s + parseFloat(m.monto), 0);

  const egresosPorCategoria = egresos.reduce((acc, m) => {
    acc[m.categoria] = (acc[m.categoria] || 0) + parseFloat(m.monto);
    return acc;
  }, {});

  const ingresosPorCanal = ingresos.reduce((acc, m) => {
    acc[m.canal_pago] = (acc[m.canal_pago] || 0) + parseFloat(m.monto);
    return acc;
  }, {});

  return {
    periodo: { inicio: fechaInicio, fin: fechaFin },
    totalIngresos:    Math.round(totalIngresos * 100) / 100,
    totalEgresos:     Math.round(totalEgresos  * 100) / 100,
    utilidadNeta:     Math.round((totalIngresos - totalEgresos) * 100) / 100,
    egresosPorCategoria,
    ingresosPorCanal,
    cantidadMovimientos: movimientos.length,
  };
}

module.exports = {
  calcularCostoProduccion,
  actualizarCostoProducto,
  recalcularProductosPorInsumo,
  registrarIngresoPorVenta,
  generarResumenFinanciero,
};
