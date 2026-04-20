const { MovimientoFinanciero, Producto, Venta } = require('../models');
const { generarResumenFinanciero } = require('../services/financiero.service');
const { Op } = require('sequelize');

// GET /api/financiero/movimientos
async function listarMovimientos(req, res) {
  try {
    const { tipo, categoria, fecha_inicio, fecha_fin, page = 1, limit = 100 } = req.query;
    const where = {};
    if (tipo)      where.tipo      = tipo;
    if (categoria) where.categoria = categoria;
    if (fecha_inicio && fecha_fin) {
      where.fecha = { [Op.between]: [fecha_inicio, fecha_fin] };
    }

    const movimientos = await MovimientoFinanciero.findAll({
      where,
      order: [['fecha', 'DESC'], ['created_at', 'DESC']],
      limit:  parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ movimientos });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener movimientos' });
  }
}

// POST /api/financiero/movimientos — egreso manual (gasto operativo)
async function registrarMovimiento(req, res) {
  try {
    const { tipo, categoria, monto, descripcion, canal_pago, fecha } = req.body;
    if (!tipo || !monto) return res.status(400).json({ error: 'tipo y monto son requeridos' });

    const movimiento = await MovimientoFinanciero.create({
      tipo,
      categoria: categoria || 'gasto_operativo',
      monto,
      descripcion,
      usuario_id: req.usuario.id,
      canal_pago: canal_pago || 'n_a',
      fecha:      fecha || new Date(),
    });
    res.status(201).json({ movimiento });
  } catch (e) {
    res.status(500).json({ error: 'Error al registrar el movimiento' });
  }
}

// GET /api/financiero/resumen?fecha_inicio=2024-01-01&fecha_fin=2024-01-31
async function resumenPeriodo(req, res) {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'fecha_inicio y fecha_fin son requeridos' });
    }
    const resumen = await generarResumenFinanciero(fecha_inicio, fecha_fin);
    res.json({ resumen });
  } catch (e) {
    res.status(500).json({ error: 'Error al generar el resumen' });
  }
}

// GET /api/financiero/rentabilidad — margen por producto
async function rentabilidadProductos(req, res) {
  try {
    const productos = await Producto.findAll({
      where: { activo: true },
      attributes: ['id', 'nombre', 'sku', 'precio_venta', 'costo_produccion', 'margen'],
      order: [['margen', 'ASC']],
    });

    const conAlerta = productos.map((p) => ({
      ...p.toJSON(),
      alerta_margen: parseFloat(p.margen) <= 0,
    }));

    res.json({ productos: conAlerta });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener rentabilidad' });
  }
}

// GET /api/financiero/conciliacion?fecha_inicio=...&fecha_fin=...
async function conciliacion(req, res) {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const where = { tipo: 'ingreso', categoria: 'venta' };
    if (fecha_inicio && fecha_fin) {
      where.fecha = { [Op.between]: [fecha_inicio, fecha_fin] };
    }

    const ingresos = await MovimientoFinanciero.findAll({ where });

    const porCanal = ingresos.reduce((acc, m) => {
      const canal = m.canal_pago;
      if (!acc[canal]) acc[canal] = { total: 0, cantidad: 0 };
      acc[canal].total    += parseFloat(m.monto);
      acc[canal].cantidad += 1;
      return acc;
    }, {});

    const totalFacturado = ingresos.reduce((s, m) => s + parseFloat(m.monto), 0);
    res.json({ totalFacturado, porCanal, movimientos: ingresos });
  } catch (e) {
    res.status(500).json({ error: 'Error al generar conciliación' });
  }
}

// GET /api/financiero/ventas-resumen — métricas rápidas para el dashboard
async function ventasResumen(req, res) {
  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
    const fin       = hoy.toISOString().split('T')[0];

    const [ventasActivas, resumen] = await Promise.all([
      Venta.count({ where: { estado: ['confirmado', 'elaboracion', 'enviado'] } }),
      generarResumenFinanciero(inicioMes, fin),
    ]);

    res.json({ ventasActivas, ...resumen });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener resumen de ventas' });
  }
}

module.exports = {
  listarMovimientos,
  registrarMovimiento,
  resumenPeriodo,
  rentabilidadProductos,
  conciliacion,
  ventasResumen,
};
