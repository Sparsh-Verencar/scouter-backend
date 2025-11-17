// routes/auth.js
import express from 'express';
import { getFreelancerProjects} from '../controllers/projects.controller.js';

const projectRoutes = express.Router();

projectRoutes.get('/getProjects', getFreelancerProjects);
//projectRoutes.post('/createProject', freelancerRegister);

export default projectRoutes;
