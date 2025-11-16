// routes/auth.js
import express from 'express';
import { freelancerLogin, freelancerRegister, freelancerLogout } from '../controllers/authController.js';

const authRoutes = express.Router();

authRoutes.post('/freelancer-login', freelancerLogin);
authRoutes.post('/freelancer-register', freelancerRegister);
authRoutes.post('/freelancer-logout', freelancerLogout);

export default authRoutes;
