const express = require('express');
const router = express.Router();
const c = require('../controllers/inventario.controller');
const authMw = require('../middleware/auth.middleware');
const { soloAdmin } = require('../middleware/roles.middleware');

router.use(authMw);

router.get('/', c.listarProductos);
router.post('/', soloAdmin, c.crearProducto);
router.put('/:id', soloAdmin, c.actualizarProducto);

router.delete('/:id', soloAdmin, async (req, res) => {
  try {
    const { Producto, Receta } = require('../models');
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    await Receta.destroy({ where: { producto_id: producto.id } });
    await producto.destroy();
    res.json({ mensaje: 'Producto eliminado' });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});

module.exports = router;