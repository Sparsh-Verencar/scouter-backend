// routes/auth.js
import express from 'express';
import { getUnassignedJobs, applyForJob } from '../controllers/jobs.controller.js';

const jobsRoutes = express.Router();

jobsRoutes.get('/getFreeJobs', getUnassignedJobs);
jobsRoutes.post("/apply", applyForJob);


export default jobsRoutes;
