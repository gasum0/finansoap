const express = require('express');
const router = express.Router();
const c = require('../controllers/financiero.controller');
const authMw = require('../middleware/auth.middleware');
const { soloAdmin } = require('../middleware/roles.middleware');

router.use(authMw);

router.get('/movimientos',     c.listarMovimientos);
router.post('/movimientos',    c.registrarMovimiento);
router.get('/resumen',         soloAdmin, c.resumenPeriodo);
router.get('/rentabilidad',    c.rentabilidadProductos);
router.get('/conciliacion',    soloAdmin, c.conciliacion);
router.get('/ventas-resumen',  c.ventasResumen);
router.get('/ventas-diarias',  c.ventasDiarias);

module.exports = router;