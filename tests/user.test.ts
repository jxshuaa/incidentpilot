import { describe, beforeEach, jest, expect } from '@jest/globals';
import { mockSupabase } from './setup';

describe('User Authentication', () => {
  beforeEach(async () => {
    // Clear mocks before each test
    jest.clearAllMocks();
    
    // Setup default successful mocks
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          role: 'viewer'
        },
        session: {
          access_token: 'mock_access_token'
        }
      },
      error: null
    });

    mockSupabase.auth.signUp.mockResolvedValue({
      data: {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          email: 'newuser@example.com',
          role: 'viewer'
        },
        session: {
          access_token: 'mock_access_token'
        }
      },
      error: null
    });
  });

  describe('POST /auth/login', () => {
    // ... existing code ...
  });

  describe('POST /auth/register', () => {
    // ... existing code ...
  });
}); 