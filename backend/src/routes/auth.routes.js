// ── auth.routes.js ──
const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller');
const authMw = require('../middleware/auth.middleware');
const { soloAdmin } = require('../middleware/roles.middleware');

router.post('/login', auth.login);
router.post('/registro', authMw, soloAdmin, auth.registro);
router.get('/me', authMw, auth.me);

module.exports = router;
