// controllers/authController.js
import { findUserByEmail, createUser } from '../db/users.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const COOKIE_NAME = process.env.COOKIE_NAME || 'auth_token';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function register(req, res) {
  try {
    const { email, password, name } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, passwordHash, name });
    return res.status(201).json({ ok: true, user });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
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

export async function logout(req, res) {
  try {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('logout error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function me(req, res) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return res.status(401).json({ error: 'Not logged in' });

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await findUserByEmail(payload.email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { passwordHash, ...safe } = user;
    return res.json({ user: safe });
  } catch (err) {
    console.error('me error', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
