function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso restringido a administradores' });
  }
  next();
}

function adminOOperadora(req, res, next) {
  if (!['admin', 'operadora'].includes(req.usuario?.rol)) {
    return res.status(403).json({ error: 'No tienes permiso para esta acción' });
  }
  next();
}

module.exports = { soloAdmin, adminOOperadora };
