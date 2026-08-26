function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ success: false, message: 'Login required.' });
}

function requireAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access required.' });
}

module.exports = { requireAuth, requireAdmin };
