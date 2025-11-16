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

// replace the login export with this debug-friendly version
export async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};
    console.log('login attempt for email:', email);

    if (!email || !password) {
      console.warn('login missing fields', { emailPresent: !!email, pwdPresent: !!password });
      return res.status(400).json({ error: 'Missing fields' });
    }

    const user = await findUserByEmail(email);
    console.log('findUserByEmail ->', !!user, user ? { id: user.id, email: user.email } : null);

    if (!user) {
      // helpful debug: return 401 but include note (remove in prod)
      return res.status(401).json({ error: 'Invalid credentials (user not found)' });
    }

    // try possible password fields, be resilient
    const storedHash =
      user.passwordHash ?? user.password_hash ?? user.password ?? user.pwd ?? null;

    console.log('storedHash type:', typeof storedHash, 'present:', !!storedHash);

    if (!storedHash || typeof storedHash !== 'string') {
      console.error('User password field missing or not a string', { user });
      return res.status(500).json({ error: 'User password not set correctly' });
    }

    // bcryptjs compare is async
    const match = await bcrypt.compare(password, storedHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials (bad password)' });
    }

    const token = signToken({ userId: user.id, email: user.email });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
      path: '/',
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('login error (stack):', err && err.stack ? err.stack : err);
    // return stack in dev to speed up debugging (remove in prod)
    return res.status(500).json({ error: 'Server error', details: err.message });
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
