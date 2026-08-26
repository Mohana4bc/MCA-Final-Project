const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM suppliers WHERE is_active = 1 ORDER BY name');
    res.json({ success: true, suppliers: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

router.post('/', requireAdmin, async (req, res) => {
  const { name, email, phone, address, contact_name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Supplier name required.' });
  try {
    const [result] = await db.query(
      'INSERT INTO suppliers (name,email,phone,address,contact_name) VALUES (?,?,?,?,?)',
      [name, email||null, phone||null, address||null, contact_name||null]);
    res.status(201).json({ success: true, message: 'Supplier added.', id: result.insertId });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { name, email, phone, address, contact_name } = req.body;
  try {
    await db.query('UPDATE suppliers SET name=?,email=?,phone=?,address=?,contact_name=? WHERE id=?',
      [name, email||null, phone||null, address||null, contact_name||null, req.params.id]);
    res.json({ success: true, message: 'Supplier updated.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE suppliers SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Supplier removed.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

module.exports = router;
