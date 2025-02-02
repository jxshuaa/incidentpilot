// Mock Supabase before importing anything else
jest.mock('@supabase/supabase-js');

import { describe, beforeEach, jest, expect } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { User, UserRole } from '../src/models/User';
import { TestDataSource } from './setup';
import { mockSupabase, mockUserStore } from './mocks/supabase';
import { app } from '../src/app';

describe('User Authentication', () => {
  const testUserEmail = 'test@example.com';
  const testUserPassword = 'testpassword123';
  const testUserFullName = 'Test User';
  const testUserId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(async () => {
    // Clear mocks and store before each test
    jest.clearAllMocks();
    mockUserStore.clear();
    
    // Add user to mock store first
    mockUserStore.set(testUserEmail, {
      id: testUserId,
      email: testUserEmail,
      password: testUserPassword,
      metadata: {
        full_name: testUserFullName,
        role: UserRole.VIEWER
      }
    });

    // Then create user in database with same ID
    const userRepository = TestDataSource.getRepository(User);
    await userRepository.save({
      id: testUserId,
      email: testUserEmail,
      full_name: testUserFullName,
      role: UserRole.VIEWER,
      password_hash: await bcrypt.hash(testUserPassword, 10)
    });

    // Setup default successful mocks
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: testUserId,
          email: testUserEmail,
          role: UserRole.VIEWER,
          user_metadata: {
            full_name: testUserFullName,
            role: UserRole.VIEWER
          }
        },
        session: {
          access_token: 'mock_access_token'
        }
      },
      error: null
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUserEmail,
          password: testUserPassword
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', testUserEmail);
      expect(response.body.user).toHaveProperty('full_name', testUserFullName);
      expect(response.body.user).toHaveProperty('role', UserRole.VIEWER);
    });

    it('should fail with incorrect password', async () => {
      // Override the mock for this specific test
      mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 401 }
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: testUserEmail,
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUserPassword
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });
  });

  describe('POST /auth/register', () => {
    const newUserEmail = 'newuser@example.com';
    const newUserPassword = 'newpassword123';
    const newUserFullName = 'New User';
    const newUserId = '123e4567-e89b-12d3-a456-426614174001';

    beforeEach(() => {
      // Override signUp mock for new user registration
      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: newUserId,
            email: newUserEmail,
            role: UserRole.VIEWER,
            user_metadata: {
              full_name: newUserFullName,
              role: UserRole.VIEWER
            }
          },
          session: {
            access_token: 'mock_access_token'
          }
        },
        error: null
      });
    });

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: newUserEmail,
          password: newUserPassword,
          full_name: newUserFullName
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', newUserEmail);
      expect(response.body.user).toHaveProperty('full_name', newUserFullName);
      expect(response.body.user).toHaveProperty('role', UserRole.VIEWER);

      // Verify user was created in database
      const userRepository = TestDataSource.getRepository(User);
      const savedUser = await userRepository.findOne({ where: { email: newUserEmail } });
      expect(savedUser).toBeTruthy();
      expect(savedUser?.id).toBe(newUserId);
      expect(savedUser?.email).toBe(newUserEmail);
      expect(savedUser?.full_name).toBe(newUserFullName);
      expect(savedUser?.role).toBe(UserRole.VIEWER);
    });

    it('should fail when registering with existing email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: testUserEmail,
          password: newUserPassword,
          full_name: newUserFullName
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email already exists');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: newUserPassword,
          full_name: newUserFullName
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should fail with short password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: newUserEmail,
          password: '123',
          full_name: newUserFullName
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });
}); 