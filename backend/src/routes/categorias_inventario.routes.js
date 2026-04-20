const express = require('express');
const router = express.Router();
const authMw = require('../middleware/auth.middleware');
const { soloAdmin } = require('../middleware/roles.middleware');
const { CategoriaInventario } = require('../models');

router.use(authMw);

router.get('/', async (req, res) => {
  const cats = await CategoriaInventario.findAll({ order: [['nombre', 'ASC']] });
  res.json({ categorias: cats });
});

router.post('/', soloAdmin, async (req, res) => {
  try {
    const { nombre, descripcion, color } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
    const cat = await CategoriaInventario.create({ nombre, descripcion, color });
    res.status(201).json({ categoria: cat });
  } catch (e) { res.status(500).json({ error: 'Error al crear categoría' }); }
});

router.put('/:id', soloAdmin, async (req, res) => {
  try {
    const cat = await CategoriaInventario.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ error: 'No encontrada' });
    await cat.update(req.body);
    res.json({ categoria: cat });
  } catch (e) { res.status(500).json({ error: 'Error al actualizar' }); }
});

router.delete('/:id', soloAdmin, async (req, res) => {
  try {
    const cat = await CategoriaInventario.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ error: 'No encontrada' });
    await cat.destroy();
    res.json({ mensaje: 'Categoría eliminada' });
  } catch (e) { res.status(500).json({ error: 'Error al eliminar' }); }
});

module.exports = router;
