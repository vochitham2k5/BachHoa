import { Router } from 'express';
import db from '../../db/index.js';
import { auth, requireRoles } from '../../middleware/auth.js';

const router = Router();
router.use(auth(true), requireRoles('SELLER'));

router.get('/orders', (req, res) => {
  const rows = db.prepare('SELECT * FROM orders WHERE seller_id = ? ORDER BY created_at DESC').all(req.user.seller_id);
  res.json(rows);
});

router.put('/orders/:id/status', (req, res) => {
  const { status } = req.body || {};
  const allowed = ['CONFIRMED','PACKED','READY_FOR_PICKUP','SHIPPED_BY_PARTNER','CANCELLED'];
  if (!allowed.includes((status || '').toUpperCase())) return res.status(400).json({ message: 'Invalid status' });
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND seller_id = ?').get(req.params.id, req.user.seller_id);
  if (!order) return res.status(404).json({ message: 'Not found' });
  const now = new Date().toISOString();
  db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
    .run(status.toUpperCase(), now, order.id);
  res.json({ message: 'Status updated' });
});

export default router;
