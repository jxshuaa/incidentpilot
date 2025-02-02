import { jest } from '@jest/globals';

// Mock response types
type AuthResponse<T> = {
  data: T;
  error: null | { message: string; status?: number };
};

type AuthUser = {
  id: string;
  email: string;
  role?: string;
  user_metadata?: Record<string, any>;
} | null;

type Session = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
} | null;

// Create mock storage for users
export const mockUserStore = new Map<string, { 
  id: string; 
  email: string; 
  password: string;
  metadata?: Record<string, any>;
}>();

// Create the mock Supabase client
export const mockSupabase = {
  auth: {
    signUp: jest.fn(async ({ email, password, options }: { 
      email: string; 
      password: string; 
      options?: { data?: Record<string, any> } 
    }): Promise<AuthResponse<{ user: AuthUser; session: Session }>> => {
      // Check if user exists
      if (mockUserStore.has(email)) {
        return {
          data: { user: null, session: null },
          error: { message: 'User already exists', status: 400 }
        };
      }

      // Create new user with random ID if not provided in store
      const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create user in store
      mockUserStore.set(email, {
        id: userId,
        email,
        password,
        metadata: options?.data
      });

      return {
        data: {
          user: {
            id: userId,
            email,
            role: options?.data?.role,
            user_metadata: options?.data
          },
          session: {
            access_token: `mock_token_${userId}`
          }
        },
        error: null
      };
    }),

    signInWithPassword: jest.fn(async ({ email, password }: { 
      email: string; 
      password: string 
    }): Promise<AuthResponse<{ user: AuthUser; session: Session }>> => {
      const user = mockUserStore.get(email);

      if (!user || user.password !== password) {
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials', status: 401 }
        };
      }

      return {
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.metadata?.role,
            user_metadata: user.metadata
          },
          session: {
            access_token: `mock_token_${user.id}`
          }
        },
        error: null
      };
    }),

    getUser: jest.fn(async (): Promise<AuthResponse<{ user: AuthUser }>> => {
      // This would normally use the current session
      return {
        data: { user: null },
        error: null
      };
    })
  }
};

// Mock the Supabase module
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabase
})); 