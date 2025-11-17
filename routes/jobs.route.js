// routes/jobs.route.js
import express from 'express';
import { register, login, logout, me } from '../controllers/authController.js';

jobsRoutes.get('/getFreeJobs', getUnassignedJobs);

router.get('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', me);

export default jobsRoutes;
