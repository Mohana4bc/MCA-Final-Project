const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /products
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.name AS category_name, s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN suppliers  s ON s.id = p.supplier_id
      WHERE p.is_active = 1 ORDER BY p.name`);
    res.json({ success: true, products: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// GET /products/low-stock
router.get('/low-stock', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.name AS category_name, s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN suppliers  s ON s.id = p.supplier_id
      WHERE p.is_active = 1 AND p.quantity <= p.low_stock_alert ORDER BY p.quantity ASC`);
    res.json({ success: true, products: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// GET /products/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.name AS category_name, s.name AS supplier_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN suppliers  s ON s.id = p.supplier_id
      WHERE p.id = ? AND p.is_active = 1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// POST /products  (admin only)
router.post('/', requireAdmin, async (req, res) => {
  const { name, sku, category_id, supplier_id, description, unit, unit_price, quantity, low_stock_alert } = req.body;
  if (!name || !sku) return res.status(400).json({ success: false, message: 'Name and SKU required.' });
  try {
    const [exist] = await db.query('SELECT id FROM products WHERE sku = ?', [sku]);
    if (exist.length) return res.status(409).json({ success: false, message: 'SKU already exists.' });
    const [result] = await db.query(
      `INSERT INTO products (name,sku,category_id,supplier_id,description,unit,unit_price,quantity,low_stock_alert)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [name, sku, category_id||null, supplier_id||null, description||null,
       unit||'pcs', unit_price||0, quantity||0, low_stock_alert||10]);
    // log initial stock transaction if quantity > 0
    if ((quantity||0) > 0) {
      await db.query('INSERT INTO stock_transactions (product_id,user_id,type,quantity,note) VALUES (?,?,?,?,?)',
        [result.insertId, req.user.id, 'in', quantity, 'Initial stock on product creation']);
    }
    res.status(201).json({ success: true, message: 'Product created.', id: result.insertId });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error.' }); }
});

// PUT /products/:id  (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, sku, category_id, supplier_id, description, unit, unit_price, low_stock_alert } = req.body;
  try {
    await db.query(
      `UPDATE products SET name=?,sku=?,category_id=?,supplier_id=?,description=?,unit=?,unit_price=?,low_stock_alert=?
       WHERE id=?`,
      [name, sku, category_id||null, supplier_id||null, description||null,
       unit||'pcs', unit_price||0, low_stock_alert||10, req.params.id]);
    res.json({ success: true, message: 'Product updated.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// DELETE /products/:id  (admin only — soft delete)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

module.exports = router;
