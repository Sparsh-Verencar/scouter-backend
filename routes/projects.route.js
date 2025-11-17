// routes/auth.js
import express from 'express';
import { getFreelancerProjects, createFreelancerProjects} from '../controllers/projects.controller.js';

const projectRoutes = express.Router();

projectRoutes.get('/getProjects', getFreelancerProjects);
projectRoutes.post('/addProject', createFreelancerProjects);

export default projectRoutes;
