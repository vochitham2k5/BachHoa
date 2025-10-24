import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import db from '../../db/index.js';
import { env } from '../../config/env.js';

const router = Router();

function issueToken(user) {
  const payload = { sub: user.id, roles: JSON.parse(user.roles || '[]'), is_admin: !!user.is_admin };
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  return token;
}

router.post('/register',
  body('fullName').isString().isLength({ min: 2 }),
  body('email').isEmail(),
  body('phone').isString().isLength({ min: 8 }),
  body('password').isLength({ min: 8 }),
  body('roleChoice').isIn(['BUYER','SELLER','SHIPPER']),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { fullName, email, phone, password, roleChoice } = req.body;
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const now = new Date().toISOString();
    const id = uuidv4();
    const password_hash = bcrypt.hashSync(password, 10);

    // Buyer active immediately; Seller/Shipper: create application PENDING
    const roles = ['BUYER'];
    db.prepare(`INSERT INTO users (id, email, phone, name, password_hash, roles, created_at, updated_at, is_admin)
      VALUES (@id, @email, @phone, @name, @password_hash, @roles, @created_at, @updated_at, 0)`) 
      .run({ id, email, phone, name: fullName, password_hash, roles: JSON.stringify(roles), created_at: now, updated_at: now });

    let application = null;
    if (roleChoice === 'SELLER' || roleChoice === 'SHIPPER') {
      const appId = uuidv4();
      const data = { basic: { fullName, phone, email }, type: roleChoice };
      db.prepare(`INSERT INTO applications (id, user_id, type, data, status, submitted_at)
        VALUES (@id, @user_id, @type, @data, 'PENDING', @submitted_at)`) 
        .run({ id: appId, user_id: id, type: roleChoice, data: JSON.stringify(data), submitted_at: now });
      application = { id: appId, status: 'PENDING', type: roleChoice };
    }

    const token = issueToken({ id, roles: JSON.stringify(roles), is_admin: 0 });
    res.status(201).json({ userId: id, application, token });
  }
);

router.post('/login',
  body('email').isEmail(),
  body('password').isString(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = issueToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, roles: JSON.parse(user.roles || '[]'), is_admin: !!user.is_admin, seller_id: user.seller_id, shipper_id: user.shipper_id } });
  }
);

export default router;
