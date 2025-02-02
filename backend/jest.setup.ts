import 'reflect-metadata';
import { jest } from '@jest/globals';

// Set up global Jest configuration
jest.setTimeout(10000);

// Make Jest available globally
global.jest = jest;

// Mock console.error to keep test output clean
console.error = jest.fn(); 