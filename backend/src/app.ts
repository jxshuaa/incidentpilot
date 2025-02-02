import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from './models/User';
import { Incident } from './models/Incident';
import { Task } from './models/Task';
import { Comment } from './models/Comment';
import { Alert } from './models/Alert';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Incident, Task, Comment, Alert],
  migrations: ['src/migrations/*.ts'],
  migrationsRun: true, // Automatically run migrations on startup
  synchronize: false, // Disable synchronize in favor of migrations
  logging: process.env.NODE_ENV === 'development',
  ssl: {
    rejectUnauthorized: false // Required for Supabase connection
  }
});

// Initialize database connection (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  AppDataSource.initialize()
    .then(() => {
      console.log('Database connected successfully');
    })
    .catch((error: Error) => {
      console.error('Error connecting to database:', error);
      process.exit(1);
    });
}

// Routes
app.use('/auth', authRoutes);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy' });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export { app }; 