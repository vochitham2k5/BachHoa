import { Router } from 'express';
import { auth } from '../../middleware/auth.js';
import db from '../../db/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Submit application for seller or shipper
router.post('/:type', auth(true), (req, res) => {
  const { type } = req.params; // 'seller' | 'shipper'
  const TYPE = type.toUpperCase();
  if (!['SELLER','SHIPPER'].includes(TYPE)) return res.status(400).json({ message: 'Invalid application type' });
  const pending = db.prepare('SELECT id FROM applications WHERE user_id = ? AND type = ? AND status = "PENDING"').get(req.user.id, TYPE);
  if (pending) return res.status(409).json({ message: 'An application is already pending' });

  const id = uuidv4();
  const now = new Date().toISOString();
  const data = req.body || {};
  db.prepare(`INSERT INTO applications (id, user_id, type, data, status, submitted_at)
    VALUES (@id, @user_id, @type, @data, 'PENDING', @submitted_at)`).run({
      id, user_id: req.user.id, type: TYPE, data: JSON.stringify(data), submitted_at: now
    });
  res.status(201).json({ applicationId: id, status: 'PENDING' });
});

// Get my application(s)
router.get('/:type/me', auth(true), (req, res) => {
  const { type } = req.params; // seller | shipper
  const TYPE = type.toUpperCase();
  const rows = db.prepare('SELECT id, type, status, submitted_at, reviewed_at, rejection_reason FROM applications WHERE user_id = ? AND type = ? ORDER BY submitted_at DESC').all(req.user.id, TYPE);
  res.json(rows);
});

export default router;
