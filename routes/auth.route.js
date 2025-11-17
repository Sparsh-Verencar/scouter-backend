// routes/auth.js
import express from 'express';
import { freelancerLogin, freelancerRegister, freelancerLogout,freelancerDelete, freeMe   } 
from '../controllers/auth.controller.js';

const authRoutes = express.Router();

authRoutes.post('/freelancer-login', freelancerLogin);
authRoutes.post('/freelancer-register', freelancerRegister);
authRoutes.post('/freelancer-logout', freelancerLogout);
authRoutes.delete('/freelancer-delete', freelancerDelete);
authRoutes.get('/free-me', freeMe);

export default authRoutes;
