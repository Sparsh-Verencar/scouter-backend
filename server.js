// server.js
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jobsRoutes from './routes/jobs.route.js';
import jobHistoryRoutes from './routes/jobhistory.js';

import { connectToDB, db } from './db/db.js';

import authRoutes from './routes/auth.route.js';
import portfolioRoutes from './routes/portfolio.route.js';
import projectRoutes from './routes/projects.route.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

const FRONTEND = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.get('/', (req, res) => res.send('Auth server running'));


app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/jobs/history', jobHistoryRoutes);app.use('/api/portfolio', portfolioRoutes);
app.use('/api/projects', projectRoutes);


const startServer = async () => {
  try {
    await connectToDB();
    try {
      const [rows] = await db.execute('SELECT 1');
      console.log('DB smoke test OK, result:', rows);
    } catch (qErr) {
      console.warn('DB connected but smoke-test query failed (this may be OK in dev):', qErr.message);
    }
  } catch (err) {
    console.warn('Failed to connect to DB. Running without DB. Error:', err.message || err);
  }

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Frontend origin allowed: ${FRONTEND}`);
  });
};

startServer();
