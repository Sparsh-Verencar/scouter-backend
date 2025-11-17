// controller
import jwt from 'jsonwebtoken';
import { db } from '../db/db.js';
import dotenv from 'dotenv';
dotenv.config();

export async function getFreelancerProjects(req, res) {
  try {
    // Log the cookies
    console.log('Cookies received:', req.cookies);

    const token = req.cookies?.auth_token; // your cookie name
    console.log('Token extracted from cookie:', token);

    if (!token) return res.status(401).json({ error: 'Not logged in' });

    // Verify JWT
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
      console.log('JWT payload:', payload);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const email = payload.email;
    console.log('Email extracted from token:', email);

    // Get freelancer_id from email
    const [freelancer] = await db.execute(
      'SELECT freelancer_id FROM FREELANCER WHERE email = ?',
      [email]
    );
    console.log('Freelancer query result:', freelancer);

    if (!freelancer.length) return res.status(404).json({ error: 'Freelancer not found' });

    const freelancerId = freelancer[0].freelancer_id;
    console.log('Freelancer ID:', freelancerId);

    // Get projects
    const [projects] = await db.execute(
      `SELECT p.project_id, p.project_title, p.project_description, p.project_link
       FROM PROJECTS p
       JOIN PORTFOLIO pf ON p.portfolio_id = pf.portfolio_id
       WHERE pf.freelancer_id = ?`,
      [freelancerId]
    );

    console.log('Projects fetched:', projects);

    res.json(projects);
  } catch (err) {
    console.error('Error in getFreelancerProjects:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
export async function createFreelancerProjects(req, res) {
  try {
    // 1. Log cookies
    console.log("Cookies received:", req.cookies);

    const token = req.cookies?.auth_token; // cookie name
    console.log("Token extracted:", token);

    if (!token) {
      return res.status(401).json({ error: "Not logged in" });
    }

    // 2. Verify token
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
      console.log("JWT payload:", payload);
    } catch (err) {
      console.error("JWT verification failed:", err);
      return res.status(401).json({ error: "Invalid token" });
    }

    // 3. Extract email
    const email = payload.email;
    console.log("Email extracted:", email);

    // 4. Get freelancer_id from email
    const [freelancer] = await db.execute(
      "SELECT freelancer_id FROM FREELANCER WHERE email = ?",
      [email]
    );
    console.log("Freelancer lookup:", freelancer);

    if (!freelancer.length) {
      return res.status(404).json({ error: "Freelancer not found" });
    }

    const freelancer_id = freelancer[0].freelancer_id;
    console.log("Freelancer ID:", freelancer_id);

    // 5. Extract project data from frontend
    const { project_title, project_description, project_link } = req.body;

    if (!project_title || !project_description) {
      return res.status(400).json({ error: "Title and description are required" });
    }

    // 6. Get portfolio_id for this freelancer
    const [portfolio] = await db.execute(
      "SELECT portfolio_id FROM PORTFOLIO WHERE freelancer_id = ?",
      [freelancer_id]
    );
    console.log("Portfolio lookup:", portfolio);

    if (portfolio.length === 0) {
      return res.status(404).json({ error: "Portfolio not found for this freelancer" });
    }

    const portfolio_id = portfolio[0].portfolio_id;

    // 7. Insert the project
    const [result] = await db.execute(
      `INSERT INTO PROJECTS (portfolio_id, project_title, project_description, project_link)
       VALUES (?, ?, ?, ?)`,
      [portfolio_id, project_title, project_description, project_link]
    );

    console.log("Project insert result:", result);

    // 8. Send response
    res.status(201).json({
      message: "Project added successfully",
      project: {
        project_id: result.insertId,
        portfolio_id,
        project_title,
        project_description,
        project_link,
      },
    });

  } catch (err) {
    console.error("Error in createFreelancerProjects:", err);
    res.status(500).json({ error: "Server error" });
  }
}
