// Setup file for Jest tests
// This runs before each test file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';
process.env.DB_NAME = 'quad_vision_test';
process.env.DB_PORT = '3306';

// Mock console.log for cleaner test output
// Use global.jest instead of jest for ES modules
const originalLog = console.log;
if (global.jest) {
  console.log = global.jest.fn();
} else {
  // Fallback if jest is not available
  console.log = () => {};
}

// Restore console.log after all tests
afterAll(() => {
  console.log = originalLog;
});
