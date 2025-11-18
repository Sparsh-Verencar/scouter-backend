// controllers/authController.js
import { db } from '../db/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const COOKIE_NAME = process.env.COOKIE_NAME || 'auth_token';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function freelancerRegister(req, res) {
  try {
    const { email, password, name, phone, experience, category } = req.body ?? {};
    console.log(req.body)
    const [existing] = await db.execute('SELECT * FROM FREELANCER WHERE email = ?', [email]);
    console.log(existing)
    if (existing.length > 0) return res.status(409).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.execute(
      `INSERT INTO FREELANCER(full_name, email, _password, phone, experience, category) VALUES(?, ?, ?, ?, ?, ?)`, [name, email, passwordHash, phone, experience, category]
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
if (user.length === 0) {
      return res.status(404).json({ error: "No account found. Please register first." });
    }    console.log(user)

    const match = await bcrypt.compare(password, user[0]._password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ email: user[0].email });
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 1000,
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
export async function freelancerDelete(req, res) {
  try {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const payload = jwt.verify(token, JWT_SECRET);

    // Get user info BEFORE deleting (optional but recommended)
    const [existing] = await db.execute(
      "SELECT * FROM FREELANCER WHERE email = ?",
      [payload.email]
    );

    if (existing.length === 0)
      return res.status(404).json({ error: "User does not exist" });

    // Delete user
    const [result] = await db.execute(
      "DELETE FROM FREELANCER WHERE email = ?",
      [payload.email]
    );

    res.clearCookie("auth_token");

    return res.json({
      ok: true,
      message: "User deleted",
      deletedUser: existing[0],
      affectedRows: result.affectedRows,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function freeMe(req, res) {
  try {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const payload = jwt.verify(token, JWT_SECRET);
    
    const [user] = await db.execute(
      "SELECT * FROM FREELANCER WHERE email = ?",
      [payload.email]
    );

    res.json({ user: user[0] });
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Server error" });
  }
}
//recruiter routes
export async function recruiterRegister(req, res) {
  try {
    const { full_name, company_name, email, password, phone } = req.body ?? {};
    console.log(req.body)
    const [existing] = await db.execute('SELECT * FROM RECRUITER WHERE email = ?', [email]);
    console.log(existing)
    if (existing.length > 0) return res.status(409).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.execute(
      `INSERT INTO RECRUITER(full_name, company_name, email, _password, phone) VALUES(?, ?, ?, ?, ?)`, [full_name, company_name, email, passwordHash, phone]
    );
    return res.status(201).json({ ok: true, user });
  } catch (err) {
    console.log('register error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function recruiterLogin(req, res) {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    console.log(req.body)
    const [user] = await db.execute('SELECT * FROM RECRUITER WHERE email = ?', [email]);
if (user.length === 0) {
      return res.status(404).json({ error: "No account found. Please register first." });
    }    console.log(user)

    const match = await bcrypt.compare(password, user[0]._password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ email: user[0].email });
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 1000,
    }); 
    return res.json({ ok: true });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export async function recruiterLogout(req, res) {
  try {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('logout error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
export async function recruiterDelete(req, res) {
  try {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const payload = jwt.verify(token, JWT_SECRET);

    // Get user info BEFORE deleting (optional but recommended)
    const [existing] = await db.execute(
      "SELECT * FROM RECRUITER WHERE email = ?",
      [payload.email]
    );

    if (existing.length === 0)
      return res.status(404).json({ error: "User does not exist" });

    // Delete user
    const [result] = await db.execute(
      "DELETE FROM RECRUITER WHERE email = ?",
      [payload.email]
    );

    res.clearCookie("auth_token");

    return res.json({
      ok: true,
      message: "User deleted",
      deletedUser: existing[0],
      affectedRows: result.affectedRows,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function recMe(req, res) {
  try {
    console.log("=== /recruiter-me HIT ===");

    // 1. Check token
    const token = req.cookies[COOKIE_NAME];
    console.log("Token from cookies:", token);

    if (!token) {
      console.log("No token found → user not logged in");
      return res.status(401).json({ error: "Not logged in" });
    }

    // 2. Verify token
    const payload = jwt.verify(token, JWT_SECRET);
    console.log("Decoded JWT payload:", payload);

    // 3. Fetch recruiter
    const [rows] = await db.execute(
      "SELECT full_name, email FROM RECRUITER WHERE email = ?",
      [payload.email]
    );

    console.log("DB result rows:", rows);

    if (rows.length === 0) {
      console.log("Recruiter not found in DB");
      return res.status(404).json({ error: "Recruiter not found" });
    }

    console.log("Returning recruiter:", rows[0]);

    return res.json({ user: rows[0] });

  } catch (err) {
    console.error("recMe error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
