# Cloud Based Inventory Management System
## MCA Final Sem Project

---

## Tech Stack
- Frontend: HTML5, CSS3, JavaScript (Vanilla)
- Backend:  Node.js + Express.js
- Database: MySQL
- Auth:     Passport.js (Local strategy) + bcrypt
- Sessions: express-mysql-session

---

## Features
- User login with role-based access (Admin / Staff)
- Product management (Add, Edit, Delete)
- Stock In / Stock Out tracking with history
- Supplier management
- Category management
- Low stock alerts
- Dashboard with stats and charts
- Stock summary reports

---

## Setup Steps

### 1. Install Node.js
Download from https://nodejs.org (LTS version)

### 2. Install MySQL + MySQL Workbench
Download from https://dev.mysql.com/downloads/mysql/

### 3. Create Database
In MySQL Workbench, run db.sql:
- File → Open SQL Script → select db.sql
- Press Ctrl+Shift+Enter

### 4. Update .env
Open .env and set your MySQL password:
  DB_PASSWORD=your_mysql_password
  DB_HOST=127.0.0.1

### 5. Install Dependencies
Open VS Code terminal in project folder:
  npm install

### 6. Start the Server
  npm run dev

### 7. Open in Browser
  http://localhost:3000

---

## Default Login Credentials
Admin:  admin@inventory.com  / password123
Staff:  staff@inventory.com  / password123

---

## API Endpoints

### Auth
POST   /auth/login
GET    /auth/logout
GET    /auth/me
GET    /auth/users       (admin)
POST   /auth/users       (admin)
DELETE /auth/users/:id   (admin)

### Products
GET    /products
GET    /products/low-stock
GET    /products/:id
POST   /products         (admin)
PUT    /products/:id     (admin)
DELETE /products/:id     (admin)

### Stock
POST   /stock/in
POST   /stock/out
GET    /stock/transactions

### Suppliers
GET    /suppliers
POST   /suppliers        (admin)
PUT    /suppliers/:id    (admin)
DELETE /suppliers/:id    (admin)

### Categories
GET    /categories
POST   /categories       (admin)
DELETE /categories/:id   (admin)

### Reports
GET    /reports/dashboard
GET    /reports/stock-summary

---

## Project Structure
inventory-app/
├── server.js
├── package.json
├── .env
├── db.sql
├── README.md
├── config/
│   ├── db.js
│   └── passport.js
├── middleware/
│   └── auth.js
├── routes/
│   ├── auth.js
│   ├── products.js
│   ├── stock.js
│   ├── suppliers.js
│   ├── categories.js
│   └── reports.js
└── public/
    └── index.html
