const express = require('express');
const router = express.Router();
const c = require('../controllers/pedidos_proveedor.controller');
const authMw = require('../middleware/auth.middleware');

router.use(authMw);
router.get('/', c.listar);
router.post('/', c.crear);
router.patch('/:id/estado', c.cambiarEstado);

module.exports = router;
