const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

// Setup environment variables for e2e tests
process.env.JWT_ACCESS_SECRET = 'testAccessSecret';
process.env.JWT_ACCESS_EXPIRATION = '15m';
process.env.JWT_REFRESH_SECRET = 'testRefreshSecret';
process.env.JWT_REFRESH_EXPIRATION = '1d';
process.env.FRONTEND_URL = 'http://localhost:5173';

// Global setup for MongoDB Memory Server
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGO_URI = uri;
  process.env.MONGO_DB = 'imc_test';
}, 60000);

// Global teardown
afterAll(async () => {
  if (mongod) {
    await mongod.stop();
  }
}, 10000);

// Set default test timeout
jest.setTimeout(30000);