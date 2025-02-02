import { config } from 'dotenv';
import { resolve } from 'path';
import { DataSource } from 'typeorm';
import { User } from '../src/models/User';
import { Incident } from '../src/models/Incident';
import { Task } from '../src/models/Task';
import { Comment } from '../src/models/Comment';
import { Alert } from '../src/models/Alert';

// Load test environment variables
config({ path: resolve(__dirname, '../.env.test') });

// Create a separate test database connection
export const TestDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Incident, Task, Comment, Alert],
  synchronize: true, // This will create tables automatically
  dropSchema: true, // This will drop all tables before each test run
  logging: false,
  ssl: {
    rejectUnauthorized: false // Required for Supabase connection
  }
});

// Initialize database before tests
beforeAll(async () => {
  try {
    await TestDataSource.initialize();
    console.log('Test database connected');
  } catch (error) {
    console.error('Error connecting to test database:', error);
    throw error;
  }
});

// Close database connection after tests
afterAll(async () => {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
    console.log('Test database connection closed');
  }
});

// Reset database between tests
beforeEach(async () => {
  try {
    // Drop all tables and recreate them
    await TestDataSource.synchronize(true);
  } catch (error) {
    console.error('Database reset failed:', error);
    throw error;
  }
}); 