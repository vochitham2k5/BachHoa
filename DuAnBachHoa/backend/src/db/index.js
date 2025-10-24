import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../../db.sqlite3');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT,
  name TEXT,
  password_hash TEXT NOT NULL,
  roles TEXT NOT NULL DEFAULT '[]', -- JSON array
  seller_id TEXT,
  shipper_id TEXT,
  is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('SELLER','SHIPPER')),
  data TEXT NOT NULL, -- JSON payload
  status TEXT NOT NULL CHECK(status IN ('PENDING','APPROVED','REJECTED','AWAITING_INFO')) DEFAULT 'PENDING',
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT,
  rejection_reason TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  shop_name TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  payout_info TEXT, -- JSON
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS shippers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  vehicle_type TEXT,
  payout_info TEXT, -- JSON
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  price REAL NOT NULL,
  sale_price REAL,
  stock INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  images TEXT, -- JSON array
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(seller_id) REFERENCES sellers(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  shipper_id TEXT,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'CREATED',
  address TEXT NOT NULL, -- JSON
  payment_method TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(buyer_id) REFERENCES users(id),
  FOREIGN KEY(seller_id) REFERENCES sellers(id),
  FOREIGN KEY(shipper_id) REFERENCES shippers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  qty INTEGER NOT NULL,
  price REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  details TEXT, -- JSON
  created_at TEXT NOT NULL
);
`);

// Seed default admin if not exists
export function seedAdmin(email) {
  const row = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!row) {
    const now = new Date().toISOString();
    const id = uuidv4();
    const password_hash = bcrypt.hashSync('Admin@123', 10);
    db.prepare(`INSERT INTO users (id, email, phone, name, password_hash, roles, seller_id, shipper_id, is_admin, created_at, updated_at)
      VALUES (@id, @email, @phone, @name, @password_hash, @roles, NULL, NULL, 1, @created_at, @updated_at)`) 
      .run({ id, email, phone: '', name: 'Super Admin', password_hash, roles: JSON.stringify(['ADMIN']), created_at: now, updated_at: now });
  }
}

export default db;
