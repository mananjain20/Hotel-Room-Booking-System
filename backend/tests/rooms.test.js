/**
 * tests/rooms.test.js
 * Integration tests for the room management API (Phase 2).
 *
 * These tests run against the Express app layer WITHOUT a real MongoDB
 * connection by using mongodb-memory-server (installed below). This keeps
 * tests fast, isolated and deterministic.
 *
 * Run with: npm test
 *
 * Tests cover:
 *  - GET  /api/rooms          (filtering, sorting, pagination, validation)
 *  - GET  /api/rooms/:id      (found, not found, invalid id)
 *  - POST /api/rooms          (missing token → 401, non-manager → 403, valid → 201)
 *  - PUT  /api/rooms/:id      (auth guard, valid update, invalid update)
 *  - DELETE /api/rooms/:id    (auth guard, soft-delete, already inactive)
 *  - GET  /health             (regression — Phase 1 still works)
 */

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const Room = require('../models/Room');
const Guest = require('../models/Guest');

// ── In-memory MongoDB ─────────────────────────────────────────────────────────
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean up all collections between tests to ensure isolation
  await Room.deleteMany({});
  await Guest.deleteMany({});
});

// ── Token factory ─────────────────────────────────────────────────────────────
// Signs a JWT using the same secret the middleware reads.
// We set JWT_SECRET here because dotenv is not loaded in test mode.
process.env.JWT_SECRET = 'test_jwt_secret_for_jest_phase2';

const signToken = (id, role = 'guest') =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

// ── Seed helpers ──────────────────────────────────────────────────────────────
const makeRoom = (overrides = {}) =>
  Room.create({
    roomNumber: overrides.roomNumber || '101',
    type: overrides.type || 'Standard',
    pricePerNight: overrides.pricePerNight || 100,
    capacity: overrides.capacity || 2,
    description: overrides.description || '',
    isActive: overrides.isActive !== undefined ? overrides.isActive : true,
  });

const makeManager = async () => {
  const manager = await Guest.create({
    name: 'Test Manager',
    email: 'manager@test.com',
    password: 'securePassword123',
    role: 'manager',
  });
  const token = signToken(manager._id, 'manager');
  return { manager, token };
};

const makeGuest = async () => {
  const guest = await Guest.create({
    name: 'Test Guest',
    email: 'guest@test.com',
    password: 'securePassword123',
    role: 'guest',
  });
  const token = signToken(guest._id, 'guest');
  return { guest, token };
};

// =============================================================================
// Phase 1 regression
// =============================================================================
describe('GET /health (Phase 1 regression)', () => {
  it('should still return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// =============================================================================
// GET /api/rooms
// =============================================================================
describe('GET /api/rooms', () => {
  beforeEach(async () => {
    await Room.create([
      { roomNumber: '101', type: 'Standard', pricePerNight: 80,  capacity: 2, isActive: true  },
      { roomNumber: '102', type: 'Deluxe',   pricePerNight: 150, capacity: 3, isActive: true  },
      { roomNumber: '103', type: 'Suite',    pricePerNight: 300, capacity: 4, isActive: true  },
      { roomNumber: '104', type: 'Standard', pricePerNight: 90,  capacity: 2, isActive: false }, // inactive
    ]);
  });

  it('returns only active rooms by default', async () => {
    const res = await request(app).get('/api/rooms');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.results).toBe(3); // room 104 is inactive
    res.body.data.forEach((r) => expect(r.isActive).toBe(true));
  });

  it('filters by type', async () => {
    const res = await request(app).get('/api/rooms?type=Standard');
    expect(res.statusCode).toBe(200);
    expect(res.body.results).toBe(1); // only room 101 (104 is inactive)
    expect(res.body.data[0].type).toBe('Standard');
  });

  it('filters by maxPrice', async () => {
    const res = await request(app).get('/api/rooms?maxPrice=100');
    expect(res.statusCode).toBe(200);
    expect(res.body.results).toBe(1); // only room 101 (80 <= 100)
    expect(res.body.data[0].roomNumber).toBe('101');
  });

  it('sorts by pricePerNight ascending', async () => {
    const res = await request(app).get('/api/rooms?sort=pricePerNight');
    expect(res.statusCode).toBe(200);
    const prices = res.body.data.map((r) => r.pricePerNight);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  it('sorts by pricePerNight descending', async () => {
    const res = await request(app).get('/api/rooms?sort=-pricePerNight');
    expect(res.statusCode).toBe(200);
    const prices = res.body.data.map((r) => r.pricePerNight);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  it('paginates correctly', async () => {
    const res = await request(app).get('/api/rooms?page=1&limit=2');
    expect(res.statusCode).toBe(200);
    expect(res.body.results).toBe(2);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(2);
    expect(res.body.pagination.totalPages).toBe(2); // 3 active / 2 per page
    expect(res.body.pagination.total).toBe(3);
  });

  it('returns page 2 correctly', async () => {
    const res = await request(app).get('/api/rooms?page=2&limit=2');
    expect(res.statusCode).toBe(200);
    expect(res.body.results).toBe(1);
    expect(res.body.pagination.page).toBe(2);
  });

  it('returns 400 for invalid type', async () => {
    const res = await request(app).get('/api/rooms?type=Penthouse');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid sort', async () => {
    const res = await request(app).get('/api/rooms?sort=capacity');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for non-numeric maxPrice', async () => {
    const res = await request(app).get('/api/rooms?maxPrice=abc');
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('caps limit at MAX_LIMIT (50) without erroring', async () => {
    const res = await request(app).get('/api/rooms?limit=999');
    expect(res.statusCode).toBe(200);
    expect(res.body.pagination.limit).toBe(50);
  });
});

// =============================================================================
// GET /api/rooms/:id
// =============================================================================
describe('GET /api/rooms/:id', () => {
  it('returns a room by valid ID', async () => {
    const room = await makeRoom();
    const res = await request(app).get(`/api/rooms/${room._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.roomNumber).toBe('101');
  });

  it('returns 404 for an inactive room', async () => {
    const room = await makeRoom({ isActive: false });
    const res = await request(app).get(`/api/rooms/${room._id}`);
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 for an invalid ObjectId', async () => {
    const res = await request(app).get('/api/rooms/not-a-valid-id');
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for a valid but non-existent ObjectId', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/rooms/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });
});

// =============================================================================
// POST /api/rooms (manager only)
// =============================================================================
describe('POST /api/rooms', () => {
  const validRoom = {
    roomNumber: '201',
    type: 'Deluxe',
    pricePerNight: 200,
    capacity: 3,
    description: 'Spacious deluxe room',
  };

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).post('/api/rooms').send(validRoom);
    expect(res.statusCode).toBe(401);
  });

  it('returns 403 when a guest (non-manager) token is provided', async () => {
    const { token } = await makeGuest();
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send(validRoom);
    expect(res.statusCode).toBe(403);
  });

  it('creates a room with a valid manager token', async () => {
    const { token } = await makeManager();
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send(validRoom);
    expect(res.statusCode).toBe(201);
    expect(res.body.data.roomNumber).toBe('201');
    expect(res.body.data.type).toBe('Deluxe');
  });

  it('returns 400 when required fields are missing', async () => {
    const { token } = await makeManager();
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ roomNumber: '202' }); // missing type, pricePerNight, capacity
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for an invalid room type', async () => {
    const { token } = await makeManager();
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validRoom, type: 'Presidential' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for a non-integer capacity', async () => {
    const { token } = await makeManager();
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validRoom, capacity: 2.5 });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 for pricePerNight below minimum (0)', async () => {
    const { token } = await makeManager();
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validRoom, pricePerNight: 0 });
    expect(res.statusCode).toBe(400);
  });

  it('returns 409 for a duplicate room number', async () => {
    const { token } = await makeManager();
    await makeRoom({ roomNumber: '201' });
    const res = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send(validRoom); // same roomNumber '201'
    expect(res.statusCode).toBe(409);
  });
});

// =============================================================================
// PUT /api/rooms/:id (manager only)
// =============================================================================
describe('PUT /api/rooms/:id', () => {
  it('returns 401 without a token', async () => {
    const room = await makeRoom();
    const res = await request(app).put(`/api/rooms/${room._id}`).send({ pricePerNight: 120 });
    expect(res.statusCode).toBe(401);
  });

  it('returns 403 for a guest token', async () => {
    const room = await makeRoom();
    const { token } = await makeGuest();
    const res = await request(app)
      .put(`/api/rooms/${room._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ pricePerNight: 120 });
    expect(res.statusCode).toBe(403);
  });

  it('updates allowed fields with a manager token', async () => {
    const room = await makeRoom();
    const { token } = await makeManager();
    const res = await request(app)
      .put(`/api/rooms/${room._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ pricePerNight: 150, description: 'Updated description' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.pricePerNight).toBe(150);
    expect(res.body.data.description).toBe('Updated description');
  });

  it('returns 400 when no valid fields are provided', async () => {
    const room = await makeRoom();
    const { token } = await makeManager();
    const res = await request(app)
      .put(`/api/rooms/${room._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ unknownField: 'value' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for a non-existent room', async () => {
    const { token } = await makeManager();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/rooms/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ pricePerNight: 150 });
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 for an invalid ObjectId', async () => {
    const { token } = await makeManager();
    const res = await request(app)
      .put('/api/rooms/bad-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ pricePerNight: 150 });
    expect(res.statusCode).toBe(400);
  });
});

// =============================================================================
// DELETE /api/rooms/:id (manager only — soft-delete)
// =============================================================================
describe('DELETE /api/rooms/:id', () => {
  it('returns 401 without a token', async () => {
    const room = await makeRoom();
    const res = await request(app).delete(`/api/rooms/${room._id}`);
    expect(res.statusCode).toBe(401);
  });

  it('returns 403 for a guest token', async () => {
    const room = await makeRoom();
    const { token } = await makeGuest();
    const res = await request(app)
      .delete(`/api/rooms/${room._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(403);
  });

  it('soft-deletes a room (sets isActive: false)', async () => {
    const room = await makeRoom();
    const { token } = await makeManager();
    const res = await request(app)
      .delete(`/api/rooms/${room._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    // Verify the room is now inactive in the database
    const updated = await Room.findById(room._id);
    expect(updated.isActive).toBe(false);
  });

  it('returns 400 when trying to deactivate an already-inactive room', async () => {
    const room = await makeRoom({ isActive: false });
    const { token } = await makeManager();
    const res = await request(app)
      .delete(`/api/rooms/${room._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 for a non-existent room', async () => {
    const { token } = await makeManager();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/rooms/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});
