import { Router } from 'express';
import db from '../../db/index.js';
import { auth, requireAdmin } from '../../middleware/auth.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(auth(true), requireAdmin);

router.get('/applications', (req, res) => {
  const { type, status } = req.query; // type: seller|shipper or undefined
  let sql = 'SELECT a.*, u.email, u.name FROM applications a JOIN users u ON u.id = a.user_id WHERE 1=1';
  const params = [];
  if (type) { sql += ' AND a.type = ?'; params.push(type.toUpperCase()); }
  if (status) { sql += ' AND a.status = ?'; params.push(status.toUpperCase()); }
  sql += ' ORDER BY a.submitted_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(r => ({ ...r, data: undefined })));
});

router.get('/applications/:id', (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ message: 'Not found' });
  res.json({ ...app, data: JSON.parse(app.data) });
});

router.put('/applications/:id/approve', (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app || app.status !== 'PENDING') return res.status(400).json({ message: 'Invalid application state' });
  const now = new Date().toISOString();
  db.prepare('UPDATE applications SET status = "APPROVED", reviewed_at = ?, reviewed_by = ? WHERE id = ?')
    .run(now, req.user.id, app.id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(app.user_id);
  const roles = JSON.parse(user.roles || '[]');

  if (app.type === 'SELLER') {
    const sellerId = uuidv4();
    const payload = JSON.parse(app.data || '{}');
    const shopName = payload.shopName || payload.basic?.fullName || 'Shop';
    db.prepare('INSERT INTO sellers (id, user_id, shop_name, status, payout_info, created_at) VALUES (?,?,?,?,?,?)')
      .run(sellerId, user.id, shopName, 'ACTIVE', JSON.stringify(payload.bank || {}), now);
    roles.push('SELLER');
    db.prepare('UPDATE users SET roles = ?, seller_id = ?, updated_at = ? WHERE id = ?')
      .run(JSON.stringify([...new Set(roles)]), sellerId, now, user.id);
    logAudit('application', app.id, 'APPROVE', req.user.id, { sellerId });
    return res.json({ sellerId });
  }

  if (app.type === 'SHIPPER') {
    const shipperId = uuidv4();
    const payload = JSON.parse(app.data || '{}');
    db.prepare('INSERT INTO shippers (id, user_id, status, vehicle_type, payout_info, created_at) VALUES (?,?,?,?,?,?)')
      .run(shipperId, user.id, 'ACTIVE', payload.vehicleType || null, JSON.stringify(payload.bank || {}), now);
    roles.push('SHIPPER');
    db.prepare('UPDATE users SET roles = ?, shipper_id = ?, updated_at = ? WHERE id = ?')
      .run(JSON.stringify([...new Set(roles)]), shipperId, now, user.id);
    logAudit('application', app.id, 'APPROVE', req.user.id, { shipperId });
    return res.json({ shipperId });
  }

  return res.json({ ok: true });
});

router.put('/applications/:id/reject', (req, res) => {
  const { reason } = req.body || {};
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app || app.status !== 'PENDING') return res.status(400).json({ message: 'Invalid application state' });
  const now = new Date().toISOString();
  db.prepare('UPDATE applications SET status = "REJECTED", reviewed_at = ?, reviewed_by = ?, rejection_reason = ? WHERE id = ?')
    .run(now, req.user.id, reason || 'unspecified', app.id);
  logAudit('application', app.id, 'REJECT', req.user.id, { reason });
  res.json({ message: 'Rejected' });
});

function logAudit(resource_type, resource_id, action, performed_by, details) {
  db.prepare('INSERT INTO audit_logs (id, resource_type, resource_id, action, performed_by, details, created_at) VALUES (?,?,?,?,?,?,?)')
    .run(uuidv4(), resource_type, resource_id, action, performed_by, JSON.stringify(details || {}), new Date().toISOString());
}

export default router;
