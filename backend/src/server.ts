import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { checkDbConnection } from './config/db';

const PORT = parseInt(process.env.PORT || '5000', 10);

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`============================================================`);
  console.log(`🚀 MiniLedger Backend Server is running on port ${PORT}`);
  console.log(`📡 Local API URL:    http://localhost:${PORT}/api`);
  console.log(`📡 Emulator API URL: http://10.0.2.2:${PORT}/api`);
  console.log(`============================================================`);

  const dbConnected = await checkDbConnection();
  if (dbConnected) {
    console.log('✅ PostgreSQL Database connected successfully!');
  } else {
    console.warn('⚠️  PostgreSQL Database is not reachable.');
    console.warn('   Ensure PostgreSQL is installed, running, and DATABASE_URL is configured in backend/.env');
    console.warn('   Run `npm run db:init` after starting PostgreSQL to initialize tables.');
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
