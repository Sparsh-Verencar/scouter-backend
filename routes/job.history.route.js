// routes/jobHistory.js
import express from "express";
import { db } from "../db/db.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Debug: show DB name
    try {
      const [[{ db: currentDb }]] = await db.execute("SELECT DATABASE() AS db");
      console.log("jobHistory route using DB:", currentDb);
    } catch (e) {
      console.warn("Could not run SELECT DATABASE():", e.message);
    }

    // --- FIXED: use the limit variable ---
    const [rows] = await db.execute(
      `SELECT 
          history_id,
          job_id,
          changed_at,
          changed_by,
          operation,
          old_row,
          new_row
       FROM job_history
       ORDER BY changed_at DESC
      `,
    );

    // summary counts
    const [[jobCounts]] = await db.execute(
      `SELECT 
         COUNT(*) AS total_jobs,
         SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) AS open_jobs,
         SUM(CASE WHEN status = 'Ongoing' THEN 1 ELSE 0 END) AS ongoing_jobs,
         SUM(CASE WHEN status = 'Finished' THEN 1 ELSE 0 END) AS completed_jobs
       FROM job`
    );

    const [[recRow]] = await db.execute(`SELECT COUNT(*) AS total_recruiters FROM recruiter`);
    const [[freeRow]] = await db.execute(`SELECT COUNT(*) AS total_freelancers FROM freelancer`);

    const summary = {
      total_jobs: Number(jobCounts.total_jobs || 0),
      open_jobs: Number(jobCounts.open_jobs || 0),
      ongoing_jobs: Number(jobCounts.ongoing_jobs || 0),
      completed_jobs: Number(jobCounts.completed_jobs || 0),
      total_recruiters: Number(recRow.total_recruiters || 0),
      total_freelancers: Number(freeRow.total_freelancers || 0),
    };

    return res.json({ ok: true, data: rows, summary });
  } catch (err) {
    console.error("Failed to fetch job_history + summary:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
