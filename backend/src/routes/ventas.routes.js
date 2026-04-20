const express = require('express');
const router = express.Router();
const c = require('../controllers/ventas.controller');
const authMw = require('../middleware/auth.middleware');

router.use(authMw);
router.get('/', c.listar);
router.get('/:id', c.obtener);
router.post('/', c.crear);
router.patch('/:id/estado', c.cambiarEstado);
router.patch('/:id/pago', c.confirmarPago);

module.exports = router;
