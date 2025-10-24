import { Router } from 'express';
import db from '../../db/index.js';
import { auth, requireRoles } from '../../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(auth(true), requireRoles('SELLER'));

// Create product
router.post('/products', (req, res) => {
  const sellerId = req.user.seller_id;
  if (!sellerId) return res.status(409).json({ message: 'Seller profile not found' });
  const { name, sku, price, salePrice, stock, description, images } = req.body;
  if (!name || !price) return res.status(400).json({ message: 'name and price are required' });
  const id = uuidv4();
  const now = new Date().toISOString();
  try {
    db.prepare('INSERT INTO products (id, seller_id, name, sku, price, sale_price, stock, description, images, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, sellerId, name, sku || null, price, salePrice || null, stock || 0, description || '', JSON.stringify(images || []), 'ACTIVE', now, now);
    res.status(201).json({ productId: id });
  } catch (e) {
    if (String(e).includes('UNIQUE constraint failed: products.sku')) return res.status(409).json({ message: 'SKU already exists' });
    throw e;
  }
});

// List my products
router.get('/products', (req, res) => {
  const sellerId = req.user.seller_id;
  const rows = db.prepare('SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC').all(sellerId);
  rows.forEach(r => { r.images = JSON.parse(r.images || '[]'); });
  res.json(rows);
});

// Update product
router.put('/products/:id', (req, res) => {
  const sellerId = req.user.seller_id;
  const prod = db.prepare('SELECT * FROM products WHERE id = ? AND seller_id = ?').get(req.params.id, sellerId);
  if (!prod) return res.status(404).json({ message: 'Not found' });
  const fields = req.body || {};
  const now = new Date().toISOString();
  const merged = {
    ...prod,
    name: fields.name ?? prod.name,
    sku: fields.sku ?? prod.sku,
    price: fields.price ?? prod.price,
    sale_price: fields.salePrice ?? prod.sale_price,
    stock: fields.stock ?? prod.stock,
    description: fields.description ?? prod.description,
    images: JSON.stringify(fields.images ?? JSON.parse(prod.images || '[]')),
    updated_at: now
  };
  db.prepare('UPDATE products SET name=?, sku=?, price=?, sale_price=?, stock=?, description=?, images=?, updated_at=? WHERE id=?')
    .run(merged.name, merged.sku, merged.price, merged.sale_price, merged.stock, merged.description, merged.images, merged.updated_at, prod.id);
  res.json({ message: 'Updated' });
});

// Delete product
router.delete('/products/:id', (req, res) => {
  const sellerId = req.user.seller_id;
  const prod = db.prepare('SELECT id FROM products WHERE id = ? AND seller_id = ?').get(req.params.id, sellerId);
  if (!prod) return res.status(404).json({ message: 'Not found' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

export default router;
