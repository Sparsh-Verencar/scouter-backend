// routes/auth.js
import express from 'express';
import { freelancerLogin, freelancerRegister, freelancerLogout, freeMe   } from '../controllers/authController.js';

const authRoutes = express.Router();

authRoutes.post('/freelancer-login', freelancerLogin);
authRoutes.post('/freelancer-register', freelancerRegister);
authRoutes.post('/freelancer-logout', freelancerLogout);
authRoutes.get('/free-me', freeMe);

export default authRoutes;
