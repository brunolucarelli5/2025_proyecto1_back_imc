// Setup environment variables for e2e tests
process.env.MONGO_URI = 'mongodb://localhost:27017';
process.env.MONGO_DB = 'imc_test';
process.env.JWT_ACCESS_SECRET = 'testAccessSecret';
process.env.JWT_ACCESS_EXPIRATION = '15m';
process.env.JWT_REFRESH_SECRET = 'testRefreshSecret';
process.env.JWT_REFRESH_EXPIRATION = '1d';
process.env.FRONTEND_URL = 'http://localhost:5173';

// Set default test timeout
jest.setTimeout(30000);