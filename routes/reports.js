const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { requireAuth } = require('../middleware/auth');

// GET /reports/dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const [[{ total_products }]] = await db.query('SELECT COUNT(*) AS total_products FROM products WHERE is_active=1');
    const [[{ total_suppliers }]] = await db.query('SELECT COUNT(*) AS total_suppliers FROM suppliers WHERE is_active=1');
    const [[{ low_stock_count }]] = await db.query('SELECT COUNT(*) AS low_stock_count FROM products WHERE is_active=1 AND quantity <= low_stock_alert');
    const [[{ total_value }]] = await db.query('SELECT SUM(quantity * unit_price) AS total_value FROM products WHERE is_active=1');
    const [[{ stock_in_today }]] = await db.query("SELECT COALESCE(SUM(quantity),0) AS stock_in_today FROM stock_transactions WHERE type='in' AND DATE(created_at)=CURDATE()");
    const [[{ stock_out_today }]] = await db.query("SELECT COALESCE(SUM(quantity),0) AS stock_out_today FROM stock_transactions WHERE type='out' AND DATE(created_at)=CURDATE()");

    // recent transactions
    const [recent] = await db.query(`
      SELECT st.*, p.name AS product_name, p.sku, u.name AS user_name
      FROM stock_transactions st
      JOIN products p ON p.id = st.product_id
      JOIN users u ON u.id = st.user_id
      ORDER BY st.created_at DESC LIMIT 8`);

    // low stock items
    const [low_stock] = await db.query(`
      SELECT p.*, c.name AS category_name FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active=1 AND p.quantity <= p.low_stock_alert ORDER BY p.quantity ASC LIMIT 5`);

    // stock movement last 7 days
    const [movement] = await db.query(`
      SELECT DATE(created_at) AS date,
             SUM(CASE WHEN type='in'  THEN quantity ELSE 0 END) AS stock_in,
             SUM(CASE WHEN type='out' THEN quantity ELSE 0 END) AS stock_out
      FROM stock_transactions
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at) ORDER BY date ASC`);

    res.json({ success: true, stats: { total_products, total_suppliers, low_stock_count,
      total_value: parseFloat(total_value||0).toFixed(2), stock_in_today, stock_out_today },
      recent_transactions: recent, low_stock_items: low_stock, movement_chart: movement });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error.' }); }
});

// GET /reports/stock-summary
router.get('/stock-summary', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.name, p.sku, p.quantity, p.unit_price, p.low_stock_alert, p.unit,
             c.name AS category,
             COALESCE(SUM(CASE WHEN st.type='in'  THEN st.quantity ELSE 0 END),0) AS total_in,
             COALESCE(SUM(CASE WHEN st.type='out' THEN st.quantity ELSE 0 END),0) AS total_out
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN stock_transactions st ON st.product_id = p.id
      WHERE p.is_active = 1
      GROUP BY p.id ORDER BY p.name`);
    res.json({ success: true, summary: rows });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

module.exports = router;
