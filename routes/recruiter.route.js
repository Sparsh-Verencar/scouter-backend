// routes/recruiter.route.js
import express from 'express';
import { getProfile, updateProfile } from '../controllers/recruiterController.js';
import { createJob, listJobs, getJob, updateJob, deleteJob } from '../controllers/recruiterJobsController.js';
import { requireRecruiter } from '../middleware/authRecruiter.js';

const router = express.Router();

// profile routes (require auth to update)
router.get('/profile', getProfile);
router.put('/profile', requireRecruiter, updateProfile);

// jobs
router.post('/jobs', requireRecruiter, createJob);
router.get('/jobs', listJobs);
router.get('/jobs/:id', getJob);
router.put('/jobs/:id', requireRecruiter, updateJob);
router.delete('/jobs/:id', requireRecruiter, deleteJob);

export default router;
