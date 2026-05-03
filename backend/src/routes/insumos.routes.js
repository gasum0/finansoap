const express = require('express');
const router = express.Router();
const c = require('../controllers/inventario.controller');
const authMw = require('../middleware/auth.middleware');
const { soloAdmin } = require('../middleware/roles.middleware');

router.use(authMw);

router.get('/',                    c.listarInsumos);
router.post('/',         soloAdmin, c.crearInsumo);
router.put('/:id',       soloAdmin, c.actualizarInsumo);
router.post('/entrada',            c.registrarEntrada);
router.get('/alertas',             c.listarAlertas);
router.patch('/alertas/:id/resolver', soloAdmin, c.resolverAlerta);

// Revisa todos los insumos y crea alertas donde el stock esté bajo
router.post('/revisar-stock', async (req, res) => {
  try {
    const { Insumo, Producto, AlertaInventario } = require('../models');
    let creadas = 0;
    let resueltas = 0;

    // ── Insumos ──
    const insumos = await Insumo.findAll({ where: { activo: true } });
    for (const ins of insumos) {
      const stockBajo = parseFloat(ins.stock_actual) < parseFloat(ins.stock_minimo);
      const alerta = await AlertaInventario.findOne({
        where: { tipo_item: 'insumo', item_id: ins.id, resuelta: false }
      });

      if (stockBajo && !alerta) {
        await AlertaInventario.create({
          tipo_item: 'insumo', item_id: ins.id,
          nombre_item: ins.nombre,
          stock_actual: ins.stock_actual,
          stock_minimo: ins.stock_minimo,
        });
        creadas++;
      } else if (!stockBajo && alerta) {
        await alerta.update({ resuelta: true });
        resueltas++;
      }
    }

    // ── Productos terminados ──
    const productos = await Producto.findAll({ where: { activo: true } });
    for (const prod of productos) {
      const stockBajo = prod.stock_actual < prod.stock_minimo;
      const alerta = await AlertaInventario.findOne({
        where: { tipo_item: 'producto', item_id: prod.id, resuelta: false }
      });

      if (stockBajo && !alerta) {
        await AlertaInventario.create({
          tipo_item: 'producto', item_id: prod.id,
          nombre_item: prod.nombre,
          stock_actual: prod.stock_actual,
          stock_minimo: prod.stock_minimo,
        });
        creadas++;
      } else if (!stockBajo && alerta) {
        await alerta.update({ resuelta: true });
        resueltas++;
      }
    }

    res.json({ mensaje: `${creadas} alertas creadas, ${resueltas} resueltas.`, creadas, resueltas });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', soloAdmin, async (req, res) => {
  try {
    const { Insumo, Receta } = require('../models');
    const insumo = await Insumo.findByPk(req.params.id);
    if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado' });
    const enUso = await Receta.findOne({ where: { insumo_id: insumo.id } });
    if (enUso) return res.status(400).json({ error: 'No se puede eliminar, está en uso en una receta de producto' });
    await insumo.destroy();
    res.json({ mensaje: 'Insumo eliminado' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar el insumo' });
  }
});

module.exports = router;