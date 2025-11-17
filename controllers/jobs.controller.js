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

export async function getFreeOngoingJobs(req, res) {
  try {
    console.log("===== GET ONGOING JOBS START =====");
    console.log("Cookies:", req.cookies);

    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;
    console.log("Decoded JWT:", decoded);

    // Get freelancer_id
    const [freelancer] = await db.execute(
      "SELECT freelancer_id FROM FREELANCER WHERE email = ?",
      [email]
    );

    if (freelancer.length === 0) {
      console.log("Freelancer not found for email:", email);
      return res.status(404).json({ error: "Freelancer not found" });
    }

    const freelancer_id = freelancer[0].freelancer_id;
    console.log("Freelancer ID:", freelancer_id);

    // Fetch all ongoing jobs assigned to this freelancer
    const [jobs] = await db.execute(
      "SELECT * FROM JOB WHERE freelancer_id = ? AND status = 'Ongoing'",
      [freelancer_id]
    );

    console.log("Ongoing jobs fetched:", jobs);

    return res.json(jobs);
  } catch (err) {
    console.error("===== GET ONGOING JOBS ERROR =====");
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function finishJob(req, res) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;
    const { job_id } = req.body;

    if (!job_id) return res.status(400).json({ error: "Missing job_id" });

    // Get freelancer_id from logged-in user
    const [freelancerRows] = await db.execute(
      "SELECT freelancer_id FROM FREELANCER WHERE email = ?",
      [email]
    );

    if (freelancerRows.length === 0)
      return res.status(404).json({ error: "Freelancer not found" });

    const freelancer_id = freelancerRows[0].freelancer_id;

    // Check if the job is actually assigned to this freelancer and ongoing
    const [jobRows] = await db.execute(
      "SELECT * FROM JOB WHERE job_id = ? AND freelancer_id = ? AND status = 'Ongoing'",
      [job_id, freelancer_id]
    );

    if (jobRows.length === 0)
      return res.status(400).json({ error: "Job not found or not assigned to you" });

    // Mark the job as completed
    const [updateResult] = await db.execute(
      "UPDATE JOB SET status = 'Finished', completed_at = NOW() WHERE job_id = ?",
      [job_id]
    );

    return res.json({ ok: true, message: "Job marked as completed" });
  } catch (err) {
    console.error("Finish job error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function getCompletedJobs(req, res) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    // Get freelancer_id
    const [freelancerRows] = await db.execute(
      "SELECT freelancer_id FROM FREELANCER WHERE email = ?",
      [email]
    );

    if (freelancerRows.length === 0)
      return res.status(404).json({ error: "Freelancer not found" });

    const freelancer_id = freelancerRows[0].freelancer_id;

    // Fetch completed jobs
    const [jobs] = await db.execute(
      "SELECT * FROM JOB WHERE freelancer_id = ? AND status = 'Finished'",
      [freelancer_id]
    );

    return res.json(jobs);
  } catch (err) {
    console.error("Error fetching completed jobs:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
