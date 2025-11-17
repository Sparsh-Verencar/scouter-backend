// routes/auth.js
import express from 'express';
import { getUnassignedJobs } from '../controllers/jobs.controller.js';

const jobsRoutes = express.Router();

jobsRoutes.get('/getFreeJobs', getUnassignedJobs);


export default jobsRoutes;
