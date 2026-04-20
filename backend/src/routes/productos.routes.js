const express = require('express');
const router = express.Router();
const c = require('../controllers/inventario.controller');
const authMw = require('../middleware/auth.middleware');
const { soloAdmin } = require('../middleware/roles.middleware');

router.use(authMw);

router.get('/', c.listarProductos);
router.post('/', soloAdmin, c.crearProducto);
router.put('/:id', soloAdmin, c.actualizarProducto);

module.exports = router;
