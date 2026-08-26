const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcrypt');
const passport = require('passport');
const db       = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// POST /auth/login
router.post('/login', (req, res, next) => {
  if (!req.body.email || !req.body.password)
    return res.status(400).json({ success: false, message: 'Email and password required.' });
  passport.authenticate('local', (err, user, info) => {
    if (err)   return res.status(500).json({ success: false, message: 'Server error.' });
    if (!user) return res.status(401).json({ success: false, message: info?.message || 'Login failed.' });
    req.login(user, (err) => {
      if (err) return res.status(500).json({ success: false, message: 'Session error.' });
      const { password_hash: _, ...safeUser } = user;
      return res.json({ success: true, message: 'Logged in!', user: safeUser });
    });
  })(req, res, next);
});

// GET /auth/logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ success: false, message: 'Logout failed.' });
    req.session.destroy(() => { res.clearCookie('connect.sid'); res.json({ success: true }); });
  });
});

// GET /auth/me
router.get('/me', requireAuth, (req, res) => {
  const { password_hash: _, ...safeUser } = req.user;
  res.json({ success: true, user: safeUser });
});

// GET /auth/users  (admin only)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id,name,email,role,is_active,created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, users: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// POST /auth/users  (admin only)
router.post('/users', requireAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'All fields required.' });
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Email already exists.' });
    const hash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)',
      [name, email, hash, role || 'staff']);
    res.status(201).json({ success: true, message: 'User created.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// DELETE /auth/users/:id  (admin only)
router.delete('/users/:id', requireAdmin, async (req, res) => {
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ success: false, message: 'Cannot delete yourself.' });
  try {
    await db.query('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deactivated.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

module.exports = router;
