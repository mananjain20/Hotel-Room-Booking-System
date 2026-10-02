/**
 * tests/health.test.js
 * Phase 1 smoke test — verifies the Express app responds correctly on
 * the health-check endpoint WITHOUT requiring a real MongoDB connection.
 *
 * Run with:  npm test
 */

const request = require('supertest');
const app = require('../app');

describe('GET /health', () => {
  it('should return 200 with success: true', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/running/i);
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('Unknown route', () => {
  it('should return 404 for an unregistered path', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
