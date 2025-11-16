// routes/jobs.route.js
import express from 'express';
import { db } from '../db/db.js';

const router = express.Router();

// (Optional) other job routes may already exist above — keep them if present

// PUT /api/jobs/:id  -- update a job and return recent history for that job
router.put('/:id', async (req, res) => {
  const jobId = Number(req.params.id);
  const {
    title,
    description,
    _description, // include whichever one your DB uses
    salary,
    status,
    location,
    category,
  } = req.body;

  // prefer the correct description field - pick the one your table uses
  const descValue = description ?? _description ?? null;

  try {
    const [result] = await db.execute(
      `UPDATE job
       SET title = ?, _description = ?, description = ?, salary = ?, status = ?, location = ?, category = ?
       WHERE job_id = ?`,
      [title, descValue, descValue, salary, status, location, category, jobId]
    );

    // Trigger in DB will fire and insert into job_history automatically.

    // Return the latest history rows for this job so frontend can refresh immediately
    const [history] = await db.execute(
      `SELECT history_id, job_id, changed_at, operation, old_row, new_row
       FROM job_history
       WHERE job_id = ?
       ORDER BY changed_at DESC
       LIMIT 10`,
      [jobId]
    );

    res.json({ ok: true, updated: result.affectedRows, history });
  } catch (err) {
    console.error('Job update error:', err);
    res.status(500).json({ ok: false, error: 'Failed to update job' });
  }
});

export default router;
