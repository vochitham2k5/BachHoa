import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import db from '../db/index.js';

export function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      if (required) return res.status(401).json({ message: 'Unauthorized' });
      return next();
    }
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      const user = db.prepare('SELECT id, email, name, roles, is_admin, seller_id, shipper_id FROM users WHERE id = ?').get(payload.sub);
      if (!user) return res.status(401).json({ message: 'Invalid token' });
      user.roles = JSON.parse(user.roles || '[]');
      req.user = user;
      next();
    } catch (err) {
      if (required) return res.status(401).json({ message: 'Unauthorized' });
      next();
    }
  };
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user.is_admin) return next();
    const has = roles.some(r => req.user.roles.includes(r));
    if (!has) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.is_admin || req.user.roles.includes('ADMIN')) return next();
  return res.status(403).json({ message: 'Admin required' });
}
