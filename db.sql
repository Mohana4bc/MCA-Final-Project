-- ============================================================
--  Cloud Inventory Management System — MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','staff') DEFAULT 'staff',
  is_active     TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  email        VARCHAR(150),
  phone        VARCHAR(20),
  address      TEXT,
  contact_name VARCHAR(100),
  is_active    TINYINT(1) DEFAULT 1,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  sku             VARCHAR(100) NOT NULL UNIQUE,
  category_id     INT,
  supplier_id     INT,
  description     TEXT,
  unit            VARCHAR(50) DEFAULT 'pcs',
  unit_price      DECIMAL(10,2) DEFAULT 0.00,
  quantity        INT DEFAULT 0,
  low_stock_alert INT DEFAULT 10,
  is_active       TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS stock_transactions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  user_id     INT NOT NULL,
  type        ENUM('in','out') NOT NULL,
  quantity    INT NOT NULL,
  note        TEXT,
  reference   VARCHAR(100),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) NOT NULL PRIMARY KEY,
  expires    INT(11) UNSIGNED NOT NULL,
  data       MEDIUMTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- password for both accounts is: password123
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User',  'admin@inventory.com', '$2b$10$rQZ3ZVi4KWxYf5vT8K1cHOdPVxIx1iF3BqQr5oHzJ0RL8GKzRg9Uy', 'admin'),
('Staff User',  'staff@inventory.com', '$2b$10$rQZ3ZVi4KWxYf5vT8K1cHOdPVxIx1iF3BqQr5oHzJ0RL8GKzRg9Uy', 'staff');

INSERT INTO categories (name, description) VALUES
('Electronics',    'Electronic components and devices'),
('Office Supplies','Stationery and office materials'),
('Furniture',      'Office and warehouse furniture'),
('Packaging',      'Boxes, tapes, and packaging materials');

INSERT INTO suppliers (name, email, phone, contact_name) VALUES
('TechMart India', 'sales@techmart.in',  '9876543210', 'Ravi Kumar'),
('OfficeHub',      'info@officehub.com', '9123456780', 'Priya Nair'),
('FurniCo',        'orders@furnico.in',  '9988776655', 'Suresh Babu');

INSERT INTO products (name, sku, category_id, supplier_id, unit_price, quantity, low_stock_alert, unit) VALUES
('Laptop Dell Inspiron', 'ELEC-001', 1, 1, 55000.00, 15,  5, 'pcs'),
('Wireless Mouse',       'ELEC-002', 1, 1,   850.00, 42, 10, 'pcs'),
('A4 Printing Paper',    'OFFC-001', 2, 2,   450.00,  8, 20, 'ream'),
('Ballpoint Pen Box',    'OFFC-002', 2, 2,    75.00, 60, 15, 'box'),
('Office Chair',         'FURN-001', 3, 3,  8500.00,  3,  5, 'pcs'),
('Bubble Wrap Roll',     'PACK-001', 4, 2,   320.00, 25, 10, 'roll');

INSERT INTO stock_transactions (product_id, user_id, type, quantity, note) VALUES
(1, 1, 'in',  20, 'Initial stock'),
(1, 1, 'out',  5, 'Issued to IT dept'),
(2, 1, 'in',  50, 'Initial stock'),
(2, 1, 'out',  8, 'Issued to HR dept'),
(3, 2, 'in',  30, 'Monthly restock'),
(3, 2, 'out', 22, 'Used in office');
