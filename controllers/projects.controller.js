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
