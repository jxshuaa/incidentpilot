import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../models/User';
import { TestDataSource } from '../../tests/setup';

const router = Router();

// Validation middleware
const registerValidation = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('full_name').trim().notEmpty().withMessage('Full name is required')
];

const loginValidation = [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required')
];

// Register route
router.post('/register', registerValidation, async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log('Register request:', { email: req.body.email, full_name: req.body.full_name });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, full_name } = req.body;

    // Check if user exists in our database first
    const userRepository = TestDataSource.getRepository(User);
    const existingUser = await userRepository.findOne({ where: { email } });

    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create user in Supabase
    console.log('Creating user in Supabase...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role: UserRole.VIEWER
        }
      }
    });

    console.log('Supabase signup response:', { 
      success: !authError && !!authData.user,
      error: authError?.message,
      userId: authData?.user?.id
    });

    if (authError || !authData.user || !authData.session) {
      console.error('Supabase signup error:', authError);
      return res.status(400).json({ message: authError?.message || 'Registration failed' });
    }

    // Create user in our database
    console.log('Creating user in database...');
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = userRepository.create({
      id: authData.user.id,
      email,
      password_hash: hashedPassword,
      full_name,
      role: UserRole.VIEWER
    });

    await userRepository.save(user);
    console.log('User created successfully:', { id: user.id, email: user.email });

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token: authData.session.access_token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : String(error) });
  }
});

// Login route
router.post('/login', loginValidation, async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log('Login request:', { email: req.body.email });
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Sign in with Supabase first
    console.log('Authenticating with Supabase...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log('Supabase signin response:', { 
      success: !authError && !!authData.user,
      error: authError?.message,
      userId: authData?.user?.id
    });

    if (authError || !authData.user) {
      console.error('Supabase signin error:', authError);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Get user from our database
    const userRepository = TestDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      console.log('User not found in database:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Login successful:', { id: user.id, email: user.email });
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role
      },
      token: authData.session?.access_token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;