require('dotenv').config();

const express    = require('express');
const session    = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cors       = require('cors');
const path       = require('path');
const passport   = require('passport');

require('./config/passport');

const authRoutes       = require('./routes/auth');
const productRoutes    = require('./routes/products');
const stockRoutes      = require('./routes/stock');
const supplierRoutes   = require('./routes/suppliers');
const categoryRoutes   = require('./routes/categories');
const reportRoutes     = require('./routes/reports');

const app  = express();
const PORT = process.env.PORT || 3000;

const sessionStore = new MySQLStore({
  host:     process.env.DB_HOST     || '127.0.0.1',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'inventory_db'
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.APP_URL || 'http://localhost:3000', credentials: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'inv_secret',
  resave: false, saveUninitialized: false,
  store: sessionStore,
  cookie: { maxAge: 1000*60*60*24*7, httpOnly: true, secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/auth',        authRoutes);
app.use('/products',    productRoutes);
app.use('/stock',       stockRoutes);
app.use('/suppliers',   supplierRoutes);
app.use('/categories',  categoryRoutes);
app.use('/reports',     reportRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server error.' });
});

app.listen(PORT, () => {
  console.log(`\n🚀  Inventory System running at http://localhost:${PORT}`);
  console.log(`\nPress Ctrl+C to stop.\n`);
});
