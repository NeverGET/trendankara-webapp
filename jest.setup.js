// Jest setup file
// This file runs before each test file

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db'
process.env.MINIO_ENDPOINT = 'localhost'
process.env.MINIO_PORT = '9000'
process.env.MINIO_ACCESS_KEY = 'test'
process.env.MINIO_SECRET_KEY = 'test'
process.env.MINIO_BUCKET = 'test'

// Global test timeout
jest.setTimeout(30000)

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to silence logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}