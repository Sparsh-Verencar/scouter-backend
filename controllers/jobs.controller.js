// controller
import { db } from '../db/db.js';
import dotenv from 'dotenv';
import jwt from "jsonwebtoken";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export async function getUnassignedJobs(req, res) {
  try {
    const [jobs] = await db.execute(
      "SELECT * FROM JOB WHERE freelancer_id IS NULL"
    );

    res.json(jobs);
  } catch (err) {
    console.error("Error in getUnassignedJobs:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export async function applyForJob(req, res) {
  try {
    console.log("===== APPLY FOR JOB START =====");

    console.log("Cookies:", req.cookies);

    const token = req.cookies?.auth_token;
    console.log("Token received:", token);

    if (!token) return res.status(401).json({ error: "Not logged in" });

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded JWT:", decoded);

    const email = decoded.email;
    const { job_id } = req.body;

    console.log("Email from JWT:", email);
    console.log("Job ID from body:", job_id);

    if (!job_id) {
      console.log("Missing job_id");
      return res.status(400).json({ error: "Missing job_id" });
    }

    // Get freelancer_id
    const [freelancer] = await db.execute(
      "SELECT freelancer_id FROM FREELANCER WHERE email = ?",
      [email]
    );

    console.log("Freelancer lookup result:", freelancer);

    if (freelancer.length === 0) {
      console.log("Freelancer not found for email:", email);
      return res.status(404).json({ error: "Freelancer not found" });
    }

    const freelancer_id = freelancer[0].freelancer_id;
    console.log("Freelancer ID:", freelancer_id);

    // Check job availability
    const [job] = await db.execute(
      "SELECT * FROM JOB WHERE job_id = ? AND freelancer_id IS NULL AND status = 'Open'",
      [job_id]
    );

    console.log("Job lookup result:", job);

    if (job.length === 0) {
      console.log("Job unavailable OR already assigned:", job_id);
      return res.status(400).json({ error: "Job unavailable or already assigned" });
    }

    // Apply for job
    console.log("Executing UPDATE JOB query with:", {
      freelancer_id,
      job_id
    });

    const [updateResult] = await db.execute(
      "UPDATE JOB SET applied_at = NOW(), freelancer_id = ?, status = 'Ongoing' WHERE job_id = ?",
      [freelancer_id, job_id]
    );

    console.log("UPDATE result:", updateResult);

    console.log("===== APPLY FOR JOB SUCCESS =====");

    return res.json({ ok: true, message: "Application submitted" });

  } catch (err) {
    console.error("===== APPLY FOR JOB ERROR =====");
    console.error(err);
    console.error("================================");

    return res.status(500).json({ error: "Server error" });
  }
}

