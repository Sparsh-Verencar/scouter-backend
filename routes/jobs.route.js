// routes/auth.js
import express from 'express';
import { getUnassignedJobs, applyForJob, getFreeOngoingJobs, finishJob } from '../controllers/jobs.controller.js';

const jobsRoutes = express.Router();

jobsRoutes.get('/getFreeJobs', getUnassignedJobs);
jobsRoutes.get("/getFreeOngoing", getFreeOngoingJobs);
jobsRoutes.post("/apply", applyForJob);
jobsRoutes.put("/finishJob", finishJob);


export default jobsRoutes;
