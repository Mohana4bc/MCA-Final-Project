const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// POST /stock/in
router.post('/in', requireAuth, async (req, res) => {
  const { product_id, quantity, note, reference } = req.body;
  if (!product_id || !quantity || quantity <= 0)
    return res.status(400).json({ success: false, message: 'Product and valid quantity required.' });
  try {
    await db.query('UPDATE products SET quantity = quantity + ? WHERE id = ?', [quantity, product_id]);
    await db.query('INSERT INTO stock_transactions (product_id,user_id,type,quantity,note,reference) VALUES (?,?,?,?,?,?)',
      [product_id, req.user.id, 'in', quantity, note||null, reference||null]);
    const [rows] = await db.query('SELECT quantity FROM products WHERE id = ?', [product_id]);
    res.json({ success: true, message: 'Stock added.', new_quantity: rows[0].quantity });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// POST /stock/out
router.post('/out', requireAuth, async (req, res) => {
  const { product_id, quantity, note, reference } = req.body;
  if (!product_id || !quantity || quantity <= 0)
    return res.status(400).json({ success: false, message: 'Product and valid quantity required.' });
  try {
    const [rows] = await db.query('SELECT quantity FROM products WHERE id = ?', [product_id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found.' });
    if (rows[0].quantity < quantity)
      return res.status(400).json({ success: false, message: `Insufficient stock. Available: ${rows[0].quantity}` });
    await db.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [quantity, product_id]);
    await db.query('INSERT INTO stock_transactions (product_id,user_id,type,quantity,note,reference) VALUES (?,?,?,?,?,?)',
      [product_id, req.user.id, 'out', quantity, note||null, reference||null]);
    const [updated] = await db.query('SELECT quantity, low_stock_alert FROM products WHERE id = ?', [product_id]);
    const isLow = updated[0].quantity <= updated[0].low_stock_alert;
    res.json({ success: true, message: 'Stock removed.', new_quantity: updated[0].quantity, low_stock_warning: isLow });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// GET /stock/transactions
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const product_id = req.query.product_id;
    let sql = `SELECT st.*, p.name AS product_name, p.sku, u.name AS user_name
               FROM stock_transactions st
               JOIN products p ON p.id = st.product_id
               JOIN users u ON u.id = st.user_id`;
    const params = [];
    if (product_id) { sql += ' WHERE st.product_id = ?'; params.push(product_id); }
    sql += ' ORDER BY st.created_at DESC LIMIT ?';
    params.push(limit);
    const [rows] = await db.query(sql, params);
    res.json({ success: true, transactions: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

module.exports = router;
