// ── clientes.routes.js ──
const express = require('express');
const authMw = require('../middleware/auth.middleware');
const { Cliente } = require('../models');

const router = express.Router();
router.use(authMw);

router.get('/', async (req, res) => {
  const { busqueda } = req.query;
  const where = {};
  if (busqueda) {
    const { Op } = require('sequelize');
    where.nombre = { [Op.iLike]: `%${busqueda}%` };
  }
  const clientes = await Cliente.findAll({ where, order: [['nombre', 'ASC']] });
  res.json({ clientes });
});

router.get('/:id', async (req, res) => {
  const cliente = await Cliente.findByPk(req.params.id);
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json({ cliente });
});

router.post('/', async (req, res) => {
  try {
    const { nombre, telefono, direccion, email, notas } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });
    const cliente = await Cliente.create({ nombre, telefono, direccion, email, notas });
    res.status(201).json({ cliente });
  } catch (e) {
    res.status(500).json({ error: 'Error al crear el cliente' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    await cliente.update(req.body);
    res.json({ cliente });
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar el cliente' });
  }
});

module.exports = router;
