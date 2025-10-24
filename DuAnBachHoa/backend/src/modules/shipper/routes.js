import { Router } from 'express';
import db from '../../db/index.js';
import { auth, requireRoles } from '../../middleware/auth.js';

const router = Router();
router.use(auth(true), requireRoles('SHIPPER'));

router.get('/tasks', (req, res) => {
  const rows = db.prepare('SELECT * FROM orders WHERE shipper_id = ? ORDER BY created_at DESC').all(req.user.shipper_id);
  res.json(rows);
});

router.put('/tasks/:id/status', (req, res) => {
  const { status, note } = req.body || {};
  const allowed = ['PICKED','ENROUTE','DELIVERED','FAILED'];
  if (!allowed.includes((status || '').toUpperCase())) return res.status(400).json({ message: 'Invalid status' });
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND shipper_id = ?').get(req.params.id, req.user.shipper_id);
  if (!order) return res.status(404).json({ message: 'Not found' });
  const now = new Date().toISOString();
  db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?')
    .run(status.toUpperCase(), now, order.id);
  res.json({ message: 'Status updated' });
});

export default router;
