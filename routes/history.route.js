// routes/jobs.js
import express from 'express';
import { db } from '../db/db.js';


const router = express.Router();


// GET /api/jobs/history
router.get('/history', async (req, res) => {
try {
const limit = Math.min(Number(req.query.limit || 200), 1000);


const [rows] = await db.execute(
`SELECT history_id, job_id, changed_at, changed_by, operation, old_row, new_row
FROM job_history
ORDER BY changed_at DESC
LIMIT ?`, [limit]
);


res.json({ ok: true, data: rows });
} catch (err) {
console.error('Failed to fetch job_history', err);
res.status(500).json({ ok: false, error: 'Failed to fetch job history' });
}
});


// GET /api/jobs/stats
// returns { created, ongoing, completed, total }
router.get('/stats', async (req, res) => {
try {
const recruiterId = req.user?.id || (req.query.recruiter_id ? Number(req.query.recruiter_id) : null);


const whereClause = recruiterId ? 'WHERE recruiter_id = ?' : '';
const params = recruiterId ? [recruiterId] : [];


const [rows] = await db.execute(
`SELECT
COUNT(*) AS total,
SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) AS created,
SUM(CASE WHEN status IN ('Ongoing','In Progress') THEN 1 ELSE 0 END) AS ongoing,
SUM(CASE WHEN status IN ('Completed','Done') THEN 1 ELSE 0 END) AS completed
FROM job
${whereClause}`,
params
);


const result = {
created: Number(rows[0].created || 0),
ongoing: Number(rows[0].ongoing || 0),
completed: Number(rows[0].completed || 0),
total: Number(rows[0].total || 0),
};


res.json({ ok: true, data: result });
} catch (err) {
console.error('Failed to fetch jobs/stats', err);
res.status(500).json({ ok: false, error: 'Failed to fetch job stats' });
}
});


export default router;