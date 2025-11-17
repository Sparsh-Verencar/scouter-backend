// controller
import { db } from '../db/db.js';
import dotenv from 'dotenv';
dotenv.config();

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
