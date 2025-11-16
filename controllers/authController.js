// controllers/authController.js
import { findUserByEmail, createUser } from '../db/users.js';
import { db } from '../db/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const COOKIE_NAME = process.env.COOKIE_NAME || 'auth_token';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function freelancerRegister(req, res) {
  try {
    const id = 101
    const { email, password, name, phone, experience, category } = req.body ?? {};
    console.log(req.body)
    const [existing] = await db.execute('SELECT * FROM FREELANCER WHERE email = ?', [email]);
    console.log(existing)
    if (existing.length>0) return res.status(409).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.execute(
      `INSERT INTO FREELANCER(full_name, email, _password, phone, experience, category) VALUES(?, ?, ?, ?, ?, ?)`, [ name, email, passwordHash, phone, experience, category]
    );
    return res.status(201).json({ ok: true, user });
  } catch (err) {
    console.log('register error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function freelancerLogin(req, res) {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    console.log(req.body)
    const [user] = await db.execute('SELECT * FROM FREELANCER WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    console.log(user)

    const match = await bcrypt.compare(password, user[0]._password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ userId: user.id, email: user.email });

    // set HttpOnly cookie
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
      path: '/',
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function freelancerLogout(req, res) {
  try {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('logout error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
