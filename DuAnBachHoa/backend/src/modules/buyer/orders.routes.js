import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import db from '../../db/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Create order
router.post('/orders', auth(true), (req, res) => {
  const { sellerId, items, address, paymentMethod } = req.body;
  if (!sellerId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'sellerId and items required' });
  }
  // Calculate total and check stock
  const now = new Date().toISOString();
  let total = 0;
  const products = [];
  for (const it of items) {
    const p = db.prepare('SELECT * FROM products WHERE id = ? AND seller_id = ?').get(it.productId, sellerId);
    if (!p) return res.status(400).json({ message: `Invalid product ${it.productId}` });
    if (p.stock < it.qty) return res.status(400).json({ message: `Out of stock: ${p.name}` });
    const price = p.sale_price ?? p.price;
    total += price * it.qty;
    products.push({ p, qty: it.qty, price });
  }
  // Start simple transaction
  const trx = db.transaction(() => {
    const orderId = uuidv4();
    db.prepare('INSERT INTO orders (id, buyer_id, seller_id, shipper_id, total, status, address, payment_method, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(orderId, req.user.id, sellerId, null, total, 'CREATED', JSON.stringify(address || {}), paymentMethod || 'COD', now, now);
    for (const { p, qty, price } of products) {
      db.prepare('INSERT INTO order_items (id, order_id, product_id, qty, price, subtotal) VALUES (?,?,?,?,?,?)')
        .run(uuidv4(), orderId, p.id, qty, price, price * qty);
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(qty, p.id);
    }
    return orderId;
  });
  const orderId = trx();
  res.status(201).json({ orderId, total, status: 'CREATED' });
});

// List my orders
router.get('/orders', auth(true), (req, res) => {
  const rows = db.prepare('SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(rows);
});

// Get order detail
router.get('/orders/:id', auth(true), (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND buyer_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ message: 'Not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
});

export default router;
