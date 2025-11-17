// controllers/recruiterJobsController.js
import { db } from '../db/db.js';
import { getEmailFromCookie } from '../middleware/authRecruiter.js';

/**
 * POST /api/recruiter/jobs
 * Body: { title, _description, salary, location, category, status }
 * Optionally provide recruiter_id (admin) or uses cookie email
 */
export async function createJob(req, res) {
  try {
    const { title, _description = null, salary = null, location = null, category = null, status = 'Open', recruiter_id } = req.body || {};
    const rIdFromBody = recruiter_id ? Number(recruiter_id) : null;

    let recruiterId = rIdFromBody;
    if (!recruiterId) {
      const email = getEmailFromCookie(req);
      if (!email) return res.status(401).json({ ok: false, error: 'Not logged in' });
      const [rows] = await db.execute('SELECT recruiter_id FROM recruiter WHERE email = ? LIMIT 1', [email]);
      recruiterId = rows?.[0]?.recruiter_id;
      if (!recruiterId) return res.status(400).json({ ok: false, error: 'Recruiter not found' });
    }

    if (!title) return res.status(400).json({ ok: false, error: 'Missing title' });

    const [result] = await db.execute(
      `INSERT INTO job (recruiter_id, title, _description, salary, location, category, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [recruiterId, title, _description, salary, location, category, status]
    );

    const [jobRows] = await db.execute('SELECT * FROM job WHERE job_id = ? LIMIT 1', [result.insertId]);
    res.status(201).json({ ok: true, job_id: result.insertId, data: jobRows?.[0] || null });
  } catch (err) {
    console.error('createJob error', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
}

/**
 * GET /api/recruiter/jobs
 * Query: ?recruiter_id= or ?limit= & ?offset=
 */
export async function listJobs(req, res) {
  try {
    const recruiterIdQuery = Number(req.query.recruiter_id || 0) || null;
    const limit = Math.min(Number(req.query.limit || 200), 1000);
    const offset = Number(req.query.offset || 0);

    if (recruiterIdQuery) {
      const [rows] = await db.execute('SELECT * FROM job WHERE recruiter_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?', [recruiterIdQuery, limit, offset]);
      return res.json({ ok: true, data: rows });
    }

    // if no recruiter filter, return all (admin view)
    const [rows] = await db.execute('SELECT * FROM job ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]);
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('listJobs error', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
}

/**
 * GET /api/recruiter/jobs/:id
 */
export async function getJob(req, res) {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.execute('SELECT * FROM job WHERE job_id = ? LIMIT 1', [id]);
    if (!rows?.length) return res.status(404).json({ ok: false, error: 'Not found' });
    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    console.error('getJob error', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
}

/**
 * PUT /api/recruiter/jobs/:id
 * Only recruiter who owns job should update — we enforce that check.
 */
export async function updateJob(req, res) {
  try {
    const id = Number(req.params.id);
    const { title, _description, salary, status, location, category } = req.body || {};

    // Fetch job owner
    const [rowsJob] = await db.execute('SELECT recruiter_id FROM job WHERE job_id = ? LIMIT 1', [id]);
    if (!rowsJob?.length) return res.status(404).json({ ok: false, error: 'Job not found' });
    const ownerId = rowsJob[0].recruiter_id;

    // verify requester is owner (from cookie)
    const email = getEmailFromCookie(req);
    if (!email) return res.status(401).json({ ok: false, error: 'Not logged in' });

    const [recRows] = await db.execute('SELECT recruiter_id FROM recruiter WHERE email = ? LIMIT 1', [email]);
    const requesterId = recRows?.[0]?.recruiter_id;
    if (!requesterId) return res.status(401).json({ ok: false, error: 'Recruiter not found' });

    if (requesterId !== ownerId) return res.status(403).json({ ok: false, error: 'Forbidden' });

    // perform update
    const [result] = await db.execute(
      `UPDATE job SET
         title = COALESCE(?, title),
         _description = COALESCE(?, _description),
         salary = COALESCE(?, salary),
         status = COALESCE(?, status),
         location = COALESCE(?, location),
         category = COALESCE(?, category)
       WHERE job_id = ?`,
      [title, _description, salary, status, location, category, id]
    );

    // DB trigger inserts job_history automatically. Return recent history
    const [history] = await db.execute(
      `SELECT history_id, job_id, changed_at, operation, old_row, new_row
       FROM job_history WHERE job_id = ? ORDER BY changed_at DESC LIMIT 10`,
      [id]
    );

    res.json({ ok: true, updated: result.affectedRows, history });
  } catch (err) {
    console.error('updateJob error', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
}

/**
 * DELETE /api/recruiter/jobs/:id
 * Only owner can delete
 */
export async function deleteJob(req, res) {
  try {
    const id = Number(req.params.id);

    const [rowsJob] = await db.execute('SELECT recruiter_id FROM job WHERE job_id = ? LIMIT 1', [id]);
    if (!rowsJob?.length) return res.status(404).json({ ok: false, error: 'Job not found' });

    const ownerId = rowsJob[0].recruiter_id;

    const email = getEmailFromCookie(req);
    if (!email) return res.status(401).json({ ok: false, error: 'Not logged in' });

    const [recRows] = await db.execute('SELECT recruiter_id FROM recruiter WHERE email = ? LIMIT 1', [email]);
    const requesterId = recRows?.[0]?.recruiter_id;
    if (!requesterId) return res.status(401).json({ ok: false, error: 'Recruiter not found' });

    if (requesterId !== ownerId) return res.status(403).json({ ok: false, error: 'Forbidden' });

    const [result] = await db.execute('DELETE FROM job WHERE job_id = ?', [id]);
    res.json({ ok: true, deleted: result.affectedRows });
  } catch (err) {
    console.error('deleteJob error', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
}
