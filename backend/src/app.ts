import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import loanRoutes from './routes/loanRoutes';
import summaryRoutes from './routes/summaryRoutes';

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'MiniLedger API',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/loans', loanRoutes);
  app.use('/api/summary', summaryRoutes);

  // 404 handler for undefined routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
  });

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('API Error:', err);

    // Check for PostgreSQL connection / availability errors
    const isDbUnavailable =
      err.code === 'ECONNREFUSED' ||
      err.code === 'ENOTFOUND' ||
      err.code === '28P01' || // invalid password
      err.code === '3D000' || // database does not exist
      err.name === 'AggregateError' ||
      (typeof err.message === 'string' &&
        (err.message.includes('Connection terminated') ||
          err.message.includes('connection error') ||
          err.message.includes('connect ECONNREFUSED')));

    if (isDbUnavailable) {
      res.status(503).json({
        error: 'Database is unavailable. Please verify that PostgreSQL is running and DATABASE_URL is set correctly.',
        code: err.code || 'DB_UNAVAILABLE',
      });
      return;
    }

    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
    });
  });

  return app;
};

export default createApp();
