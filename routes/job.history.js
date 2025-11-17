// routes/jobHistory.js
import express from 'express';
import { db } from '../db/db.js';

const router = express.Router();

// GET /api/jobs/history
router.get('/', async (req, res) => {
  try {
    // optional limit for rows returned (still preserve the old behaviour)
    const limit = Math.min(Number(req.query.limit || 200), 1000);

    // 1) fetch the recent history rows (as before)
    const [rows] = await db.execute(
      `SELECT history_id, job_id, changed_at, changed_by, operation, old_row, new_row
       FROM job_history
       ORDER BY changed_at DESC
       LIMIT ?`, [limit]
    );

    // 2) fetch summary statistics in efficient queries
    // total jobs + counts by status
    const [jobCountsRows] = await db.execute(
      `SELECT 
         COUNT(*) AS total_jobs,
         SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) AS open_jobs,
         SUM(CASE WHEN status IN ('Ongoing','In Progress') THEN 1 ELSE 0 END) AS ongoing_jobs,
         SUM(CASE WHEN status IN ('Completed','Done') THEN 1 ELSE 0 END) AS completed_jobs
       FROM job`
    );

    // 3) total recruiters and freelancers
    const [[{ total_recruiters }]] = await db.execute(
      `SELECT COUNT(*) AS total_recruiters FROM recruiter`
    );

    const [[{ total_freelancers }]] = await db.execute(
      `SELECT COUNT(*) AS total_freelancers FROM FREELANCER`
    );

    const summary = {
      total_jobs: Number(jobCountsRows[0].total_jobs || 0),
      open_jobs: Number(jobCountsRows[0].open_jobs || 0),
      ongoing_jobs: Number(jobCountsRows[0].ongoing_jobs || 0),
      completed_jobs: Number(jobCountsRows[0].completed_jobs || 0),
      total_recruiters: Number(total_recruiters || 0),
      total_freelancers: Number(total_freelancers || 0),
    };

    res.json({ ok: true, data: rows, summary });
  } catch (err) {
    console.error('Failed to fetch job_history + summary', err);
    res.status(500).json({ ok: false, error: 'Failed to fetch job history' });
  }
});

export default router;
