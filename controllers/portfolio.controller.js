// controllers/portfolioController.js
import { db } from "../db/db.js";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// util: extract freelancer email from cookie
function getEmailFromCookie(req) {
  const token = req.cookies.auth_token;
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.email;
  } catch (e) {
    return null;
  }
}

export async function getPortfolio(req, res) {
  try {
    const email = getEmailFromCookie(req);
    if (!email) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const [[freelancer]] = await db.execute(
      "SELECT freelancer_id FROM FREELANCER WHERE email = ?",
      [email]
    );

    if (!freelancer) {
      return res.json({ portfolio: null });
    }

    const [portfolio] = await db.execute(
      "SELECT * FROM PORTFOLIO WHERE freelancer_id = ?",
      [freelancer.freelancer_id]
    );
    res.json({ portfolio: portfolio[0] || null });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }

}

export async function createPortfolio(req, res) {

  try {
    const email = getEmailFromCookie(req);

    if (!email) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const { title, description } = req.body;

    const [freelancer] = await db.execute(
      "SELECT freelancer_id FROM FREELANCER WHERE email = ?",
      [email]
    );

    const freelancerId = freelancer[0]?.freelancer_id;

    if (!freelancerId) {
      return res.status(400).json({ error: "Freelancer not found" });
    }
    await db.execute(
      "INSERT INTO PORTFOLIO (freelancer_id, title, _description) VALUES (?, ?, ?)",
      [freelancerId, title, description]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }

}
