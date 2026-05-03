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
    const { Insumo, AlertaInventario } = require('../models');
    const insumos = await Insumo.findAll({ where: { activo: true } });
    let creadas = 0;

    for (const ins of insumos) {
      if (parseFloat(ins.stock_actual) <= parseFloat(ins.stock_minimo)) {
        const yaExiste = await AlertaInventario.findOne({
          where: { tipo_item: 'insumo', item_id: ins.id, resuelta: false }
        });
        if (!yaExiste) {
          await AlertaInventario.create({
            tipo_item: 'insumo',
            item_id: ins.id,
            nombre_item: ins.nombre,
            stock_actual: ins.stock_actual,
            stock_minimo: ins.stock_minimo,
          });
          creadas++;
        }
      }
    }

    // Igual para productos
    const { Producto } = require('../models');
    const productos = await Producto.findAll({ where: { activo: true } });

    for (const prod of productos) {
      if (prod.stock_actual <= prod.stock_minimo) {
        const yaExiste = await AlertaInventario.findOne({
          where: { tipo_item: 'producto', item_id: prod.id, resuelta: false }
        });
        if (!yaExiste) {
          await AlertaInventario.create({
            tipo_item: 'producto',
            item_id: prod.id,
            nombre_item: prod.nombre,
            stock_actual: prod.stock_actual,
            stock_minimo: prod.stock_minimo,
          });
          creadas++;
        }
      }
    }

    res.json({ mensaje: `Revisión completada. ${creadas} alertas nuevas creadas.`, creadas });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;