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

module.exports = router;
