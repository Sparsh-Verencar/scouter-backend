// controller
import { db } from "../db/db.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// =============================
//  GET ALL UNASSIGNED JOBS
// =============================
export async function getUnassignedJobs(req, res) {
  try {
    const [jobs] = await db.execute(
      `SELECT * FROM JOB 
       WHERE status = 'Open'`
    );
    console.log(jobs)
    res.json(jobs);
  } catch (err) {
    console.error("Error in getUnassignedJobs:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// =============================
//  APPLY FOR A JOB
// =============================
export async function applyForJob(req, res) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;
    const { job_id } = req.body;

    if (!job_id) return res.status(400).json({ error: "Missing job_id" });

    // Get freelancer
    const [freelancer] = await db.execute(
      "SELECT freelancer_id FROM FREELANCER WHERE email = ?",
      [email]
    );
    if (freelancer.length === 0)
      return res.status(404).json({ error: "Freelancer not found" });

    const freelancer_id = freelancer[0].freelancer_id;

    // Check job availability
    const [job] = await db.execute(
      "SELECT * FROM JOB WHERE job_id = ?",
      [job_id]
    );
    if (job.length === 0)
      return res
        .status(400)
        .json({ error: "Job unavailable or already assigned" });

    // Assign freelancer to JOB
    await db.execute(
      `UPDATE JOB 
       SET status = 'Ongoing'
       WHERE job_id = ?`,
      [job_id]
    );

    // Add submission entry
    await db.execute(
      `INSERT INTO SUBMISSION(job_id, freelancer_id)
       VALUES (?, ?)`,
      [job_id, freelancer_id]
    );

    return res.json({ ok: true, message: "Job Applied Successfully" });
  } catch (err) {
    console.error("applyForJob ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// =============================
//  GET FREELANCER ONGOING JOBS
// =============================
export async function getFreeOngoingJobs(req, res) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    const [f] = await db.execute(
      "SELECT freelancer_id FROM FREELANCER WHERE email = ?",
      [email]
    );
    if (f.length === 0)
      return res.status(404).json({ error: "Freelancer not found" });

    const freelancer_id = f[0].freelancer_id;

    const [jobs] = await db.execute(
      //join for the job info otherwise submission just gives submission info
      `SELECT * FROM JOB
       NATURAL JOIN SUBMISSION
       WHERE freelancer_id = ?
       AND status = 'Ongoing'`,
      [freelancer_id]
    );

    return res.json(jobs);
  } catch (err) {
    console.error("getFreeOngoingJobs ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// =============================
//  MARK JOB AS FINISHED
// =============================
export async function finishJob(req, res) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;
    const { job_id, submission_link } = req.body;

    if (!job_id || !submission_link) return res.status(400).json({ error: "Missing job_id or submission_link" });

    const [freelancer] = await db.execute(
      "SELECT freelancer_id FROM FREELANCER WHERE email = ?",
      [email]
    );
    if (freelancer.length === 0)
      return res.status(404).json({ error: "Freelancer not found" });

    const freelancer_id = freelancer[0].freelancer_id;

    // Check if job is ongoing
    const [rows] = await db.execute(
      `SELECT * FROM SUBMISSION NATURAL JOIN JOB  
       WHERE job_id = ? AND freelancer_id = ? AND status = 'Ongoing'`,
      [job_id, freelancer_id]
    );

    if (rows.length === 0)
      return res
        .status(400)
        .json({ error: "Job not found or not ongoing" });

    // Update submission status
    await db.execute(
      `UPDATE SUBMISSION NATURAL JOIN JOB
       SET status = 'Finished', completed_at = NOW(), submission_link = ?
       WHERE job_id = ? AND freelancer_id = ?`,
      [submission_link, job_id, freelancer_id]
    );

    return res.json({ ok: true, message: "Job marked as finished" });
  } catch (err) {
    console.error("finishJob ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// =============================
//  GET COMPLETED JOBS
// =============================
export async function getCompletedJobs(req, res) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    const [f] = await db.execute(
      "SELECT freelancer_id FROM FREELANCER WHERE email = ?",
      [email]
    );
    if (f.length === 0)
      return res.status(404).json({ error: "Freelancer not found" });

    const freelancer_id = f[0].freelancer_id;

    const [jobs] = await db.execute(
      `SELECT * from JOB NATURAL JOIN SUBMISSION
       WHERE freelancer_id = ?
       AND status = 'Finished'`,
      [freelancer_id]
    );

    return res.json(jobs);
  } catch (err) {
    console.error("getCompletedJobs ERROR:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

// =============================
//  FREELANCER STATS
// =============================
export async function getFreelancerStats(req, res) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    const [f] = await db.execute(
      "SELECT freelancer_id FROM FREELANCER WHERE email = ?",
      [email]
    );
    if (f.length === 0)
      return res.status(404).json({ error: "Freelancer not found" });

    const freelancer_id = f[0].freelancer_id;

    // Get aggregated stats
    const [rows] = await db.execute(
      `SELECT status, COUNT(*) AS count
       FROM SUBMISSION natural join JOB
       WHERE freelancer_id = ?
       GROUP BY status`,
      [freelancer_id]
    );

    const stats = { totalApplied: 0, ongoing: 0, finished: 0 };

    for (const row of rows) {
      stats.totalApplied  += row.count;
      if (row.status === "Ongoing") stats.ongoing = row.count;
      if (row.status === "Finished") stats.finished = row.count;
    }

    return res.json(stats);
  } catch (err) {
    console.error("Stats Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}


export async function recCreateJobs(req, res) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const { title, _description, salary, location, category } = req.body;

    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    // Find recruiter ID
    const [row] = await db.execute(
      "SELECT recruiter_id FROM RECRUITER WHERE email = ?",
      [email]
    );

    if (row.length === 0)
      return res.status(404).json({ error: "Recruiter not found" });

    const recruiter_id = row[0].recruiter_id;

    // Insert job
    const [job] = await db.execute(
      `INSERT INTO JOB (recruiter_id, title, _description, salary, location, category)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [recruiter_id, title, _description, salary, location, category]
    );

    return res.json({
      message: "Job created successfully",
    });

  } catch (err) {
    console.error("Create Job Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

export async function recGetJobs(req, res) {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: "Not logged in" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const email = decoded.email;

    // Find recruiter
    const [rows] = await db.execute(
      "SELECT recruiter_id FROM RECRUITER WHERE email = ?",
      [email]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Recruiter not found" });

    const recruiter_id = rows[0].recruiter_id;

    // Fetch all jobs
    const [jobs] = await db.execute(
      "SELECT job_id, title, _description, salary, location, category, created_at FROM JOB WHERE recruiter_id = ? ORDER BY created_at DESC",
      [recruiter_id]
    );

    return res.json(jobs);

  } catch (err) {
    console.error("Get Jobs Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}