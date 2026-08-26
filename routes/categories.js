const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json({ success: true, categories: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

router.post('/', requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Category name required.' });
  try {
    const [result] = await db.query('INSERT INTO categories (name,description) VALUES (?,?)', [name, description||null]);
    res.status(201).json({ success: true, message: 'Category created.', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Category already exists.' });
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

module.exports = router;
