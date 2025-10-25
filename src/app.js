import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import { errorHandler } from './middleware/error.js';
export const createApp = (io) => {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(morgan('dev'));

  // Supply io in req for controllers to broadcast
  app.use((req, res, next) => {
    req.io = io;
    next();
  });

  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/auth', authRoutes);
  app.use('/tasks', taskRoutes);
  app.use(errorHandler);
  return app;
};
