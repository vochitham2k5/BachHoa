import { Router } from 'express';
import db from '../../db/index.js';

const router = Router();

router.get('/products', (req, res) => {
  const { q, sort } = req.query;
  let sql = 'SELECT * FROM products WHERE status = "ACTIVE"';
  const params = [];
  if (q) { sql += ' AND name LIKE ?'; params.push(`%${q}%`); }
  if (sort === 'price_asc') sql += ' ORDER BY price ASC';
  else if (sort === 'price_desc') sql += ' ORDER BY price DESC';
  else sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  rows.forEach(r => { r.images = JSON.parse(r.images || '[]'); });
  res.json(rows);
});

router.get('/products/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ message: 'Not found' });
  p.images = JSON.parse(p.images || '[]');
  res.json(p);
});

export default router;
