// routes/jobs.route.js
import express from 'express';
import { getUnassignedJobs, applyForJob, getFreeOngoingJobs, finishJob, getCompletedJobs, getFreelancerStats} from '../controllers/jobs.controller.js';

const jobsRoutes = express.Router();

jobsRoutes.get('/getFreeJobs', getUnassignedJobs);
jobsRoutes.get("/getFreeOngoing", getFreeOngoingJobs);
jobsRoutes.get("/myStats", getFreelancerStats);
jobsRoutes.post("/apply", applyForJob);
jobsRoutes.put("/finishJob", finishJob);
jobsRoutes.get("/getCompletedJobs", getCompletedJobs);

export default jobsRoutes;