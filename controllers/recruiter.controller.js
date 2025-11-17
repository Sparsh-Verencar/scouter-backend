// controllers/recruiterController.js
import { db } from '../db/db.js';
import { getEmailFromCookie } from '../middleware/authRecruiter.js';

/**
 * GET /api/recruiter/profile
 * If ?id provided returns that recruiter, otherwise uses auth cookie email
 */
export async function getProfile(req, res) {
  try {
    const idQuery = Number(req.query.id || 0);
    let recruiterId = idQuery || null;

    if (!recruiterId) {
      const email = getEmailFromCookie(req);
      if (!email) return res.status(401).json({ ok: false, error: 'Not logged in' });

      const [rows] = await db.execute('SELECT recruiter_id FROM recruiter WHERE email = ? LIMIT 1', [email]);
      recruiterId = rows?.[0]?.recruiter_id;
      if (!recruiterId) return res.json({ ok: true, data: null });
    }

    const [profileRows] = await db.execute(
      'SELECT recruiter_id, name, email, company, bio, website, created_at FROM recruiter WHERE recruiter_id = ? LIMIT 1',
      [recruiterId]
    );
    res.json({ ok: true, data: profileRows?.[0] || null });
  } catch (err) {
    console.error('getProfile error', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
}

export async function updateProfile(req, res) {
  try {
    // use recruiter id from query or from cookie
    const idQuery = Number(req.query.id || 0);
    let recruiterId = idQuery || null;
    if (!recruiterId) {
      const email = getEmailFromCookie(req);
      if (!email) return res.status(401).json({ ok: false, error: 'Not logged in' });
      const [rows] = await db.execute('SELECT recruiter_id FROM recruiter WHERE email = ? LIMIT 1', [email]);
      recruiterId = rows?.[0]?.recruiter_id;
      if (!recruiterId) return res.status(404).json({ ok: false, error: 'Recruiter not found' });
    }

    const { name, company, bio, website } = req.body || {};
    const [result] = await db.execute(
      `UPDATE recruiter SET
         name = COALESCE(?, name),
         company = COALESCE(?, company),
         bio = COALESCE(?, bio),
         website = COALESCE(?, website)
       WHERE recruiter_id = ?`,
      [name, company, bio, website, recruiterId]
    );

    const [updated] = await db.execute(
      'SELECT recruiter_id, name, email, company, bio, website, created_at FROM recruiter WHERE recruiter_id = ? LIMIT 1',
      [recruiterId]
    );

    res.json({ ok: true, updated: result.affectedRows, data: updated?.[0] || null });
  } catch (err) {
    console.error('updateProfile error', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
}
