import express from 'express';
import cors from 'cors';
import { config } from './config.js';

// Route imports
import authRouter from './routes/auth.js';
import interviewsRouter from './routes/interviews.js';
import evaluationsRouter from './routes/evaluations.js';
import dashboardRouter from './routes/dashboard.js';
import coachRouter from './routes/coach.js';
import analyticsRouter from './routes/analytics.js';
import gamificationRouter from './routes/gamification.js';
import historyRouter from './routes/history.js';
import healthRouter from './routes/health.js';

export const app = express();

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.corsOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive in development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Internal-Secret'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health routes
app.use('/', healthRouter);

// Version 1 REST API routers
const apiV1 = express.Router();
apiV1.use('/auth', authRouter);
apiV1.use('/interviews', interviewsRouter);
apiV1.use('/', evaluationsRouter);
apiV1.use('/dashboard', dashboardRouter);
apiV1.use('/coach', coachRouter);
apiV1.use('/analytics', analyticsRouter);
apiV1.use('/gamification', gamificationRouter);
apiV1.use('/history', historyRouter);

app.use('/api/v1', apiV1);

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ detail: `Route '${req.method} ${req.path}' not found.` });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  console.error(`[Server Error] ${req.method} ${req.path}:`, err);
  res.status(status).json({ detail: message });
});

export default app;

