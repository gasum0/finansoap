// tests/financiero.test.js
const { sequelize, Producto, Insumo, Receta, Categoria } = require('../models');
const { calcularCostoProduccion, actualizarCostoProducto } = require('../services/financiero.service');

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('calcularCostoProduccion', () => {
  let productoId;

  beforeAll(async () => {
    const cat = await Categoria.create({ nombre: 'Cat Financiero Test' });
    const producto = await Producto.create({
      nombre: 'Jabón Financiero Test', sku: 'JAB-FIN-01', precio_venta: 15000,
      stock_actual: 10, stock_minimo: 2, categoria_id: cat.id,
    });
    productoId = producto.id;

    const ins1 = await Insumo.create({ nombre: 'Glicerina test', unidad: 'g', stock_actual: 1000, stock_minimo: 100, costo_unitario: 12 });
    const ins2 = await Insumo.create({ nombre: 'Fragancia test', unidad: 'ml', stock_actual: 200, stock_minimo: 30, costo_unitario: 120 });

    // Receta: 100g glicerina + 3ml fragancia
    await Receta.create({ producto_id: productoId, insumo_id: ins1.id, cantidad_por_unidad: 100 });
    await Receta.create({ producto_id: productoId, insumo_id: ins2.id, cantidad_por_unidad: 3 });
  });

  it('calcula correctamente el costo de producción', async () => {
    // 100 × 12 + 3 × 120 = 1200 + 360 = 1560
    const costo = await calcularCostoProduccion(productoId);
    expect(costo).toBe(1560);
  });

  it('calcula el margen correctamente', async () => {
    const resultado = await actualizarCostoProducto(productoId);
    // margen = (15000 - 1560) / 15000 * 100 = 89.6%
    expect(resultado.costo).toBe(1560);
    expect(resultado.margen).toBeCloseTo(89.6, 0);
    expect(resultado.alerta).toBe(false);
  });

  it('emite alerta cuando el margen es negativo', async () => {
    const cat = await Categoria.create({ nombre: 'Cat Alerta' });
    const prodCaro = await Producto.create({
      nombre: 'Producto sin margen', sku: 'SIN-MARGEN', precio_venta: 100,
      stock_actual: 5, stock_minimo: 1, categoria_id: cat.id,
    });
    const ins = await Insumo.create({ nombre: 'Insumo caro', unidad: 'g', stock_actual: 100, stock_minimo: 10, costo_unitario: 500 });
    await Receta.create({ producto_id: prodCaro.id, insumo_id: ins.id, cantidad_por_unidad: 1 });

    const resultado = await actualizarCostoProducto(prodCaro.id);
    expect(resultado.alerta).toBe(true);
    expect(resultado.margen).toBeLessThanOrEqual(0);
  });

  it('retorna 0 si el producto no tiene receta', async () => {
    const cat = await Categoria.create({ nombre: 'Cat Sin Receta' });
    const sinReceta = await Producto.create({
      nombre: 'Sin receta', sku: 'SIN-REC', precio_venta: 5000,
      stock_actual: 5, stock_minimo: 1, categoria_id: cat.id,
    });
    const costo = await calcularCostoProduccion(sinReceta.id);
    expect(costo).toBe(0);
  });
});
