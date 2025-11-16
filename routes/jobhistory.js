// routes/jobHistory.js
import express from 'express';
import { db } from '../db/db.js';

const router = express.Router();

// GET /api/jobs/history
router.get('/', async (req, res) => {
    const limit = Number(req.query.limit || 200);

  try {
    const [rows] = await db.execute(
      `SELECT history_id, job_id, changed_at, changed_by, operation, old_row, new_row
       FROM job_history
       ORDER BY changed_at DESC
       LIMIT 500`
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Failed to fetch job_history', err);
    res.status(500).json({ ok: false, error: 'Failed to fetch job history' });
  }
});

export default router;