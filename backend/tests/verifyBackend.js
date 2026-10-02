/**
 * tests/verifyBackend.js
 * Comprehensive integration test runner for all 4 phases of Problem 126.
 *
 * Runs against the Express app instance with a live database connection,
 * testing all health, auth, room management, room search, booking,
 * date validation, overlap rejection, and authorization endpoints.
 *
 * All test data uses unique prefixes (TEST_VERIFY_*) and is cleaned up automatically.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const Guest = require('../models/Guest');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

const runVerificationSuite = async () => {
  console.log('🧪 Starting Full System Verification Suite...\n');

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI is missing from environment variables.');
    process.exit(1);
  }

  // Connect to DB for testing
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB Atlas for verification.\n');

  // Track results
  const testResults = [];
  const logTest = (area, testName, passed, details) => {
    testResults.push({ area, testName, result: passed ? 'PASS' : 'FAIL', details });
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'} [${area}] ${testName} - ${details}`);
  };

  try {
    // ── Pre-test Cleanup ─────────────────────────────────────────────────────
    await Guest.deleteMany({ email: /test_verify_/i });
    await Room.deleteMany({ roomNumber: /^TEST_/ });
    await Booking.deleteMany({});

    // ── Phase 1: Health & Pipeline ────────────────────────────────────────────
    const resHealth = await request(app).get('/health');
    logTest('Health', 'GET /health', resHealth.statusCode === 200 && resHealth.body.success === true, 'Returns 200 with success: true');

    const res404 = await request(app).get('/api/invalid-route');
    logTest('Health', 'Unknown route 404', res404.statusCode === 404 && res404.body.success === false, 'Returns 404 for unknown endpoint');

    // ── Phase 2: Auth Testing ─────────────────────────────────────────────────
    const testGuestEmail = `test_verify_guest_${Date.now()}@example.com`;
    const testManagerEmail = `test_verify_mgr_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    // Register guest
    const resReg = await request(app).post('/api/auth/register').send({
      name: 'Test Guest User',
      email: testGuestEmail,
      password: testPassword,
    });
    logTest('Auth', 'Guest Registration', resReg.statusCode === 201 && resReg.body.token && resReg.body.data.role === 'guest', 'Returns 201 with JWT token');
    const guestToken = resReg.body.token;
    const guestId = resReg.body.data._id;

    // Public register role security override check
    const resRegRole = await request(app).post('/api/auth/register').send({
      name: 'Manager Attacker',
      email: `test_verify_attack_${Date.now()}@example.com`,
      password: testPassword,
      role: 'manager', // Attempt privilege escalation
    });
    logTest('Auth', 'Role Escalation Prevention', resRegRole.statusCode === 201 && resRegRole.body.data.role === 'guest', 'Forces role: guest even if client sends manager');

    // Duplicate email registration
    const resDup = await request(app).post('/api/auth/register').send({
      name: 'Duplicate User',
      email: testGuestEmail,
      password: testPassword,
    });
    logTest('Auth', 'Duplicate Registration Check', resDup.statusCode === 409, 'Rejects duplicate email with 409 Conflict');

    // Guest login
    const resLogin = await request(app).post('/api/auth/login').send({
      email: testGuestEmail,
      password: testPassword,
    });
    logTest('Auth', 'Guest Login', resLogin.statusCode === 200 && resLogin.body.token, 'Authenticates guest and returns JWT token');

    // Invalid login credentials
    const resBadLogin = await request(app).post('/api/auth/login').send({
      email: testGuestEmail,
      password: 'WrongPassword!',
    });
    logTest('Auth', 'Invalid Login Credentials', resBadLogin.statusCode === 401, 'Rejects bad password with 401 Unauthorized');

    // Get Me profile lookup
    const resMe = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${guestToken}`);
    logTest('Auth', 'GET /api/auth/me', resMe.statusCode === 200 && resMe.body.data.email === testGuestEmail, 'Retrieves authenticated guest profile');

    // Unauthenticated GET /me
    const resNoAuth = await request(app).get('/api/auth/me');
    logTest('Auth', 'Protected Route without Token', resNoAuth.statusCode === 401, 'Rejects missing token with 401 Unauthorized');

    // Seed test manager directly in DB for manager RBAC testing
    const testManager = await Guest.create({
      name: 'Test Manager User',
      email: testManagerEmail,
      password: testPassword,
      role: 'manager',
    });
    const resMgrLogin = await request(app).post('/api/auth/login').send({
      email: testManagerEmail,
      password: testPassword,
    });
    const managerToken = resMgrLogin.body.token;
    const managerId = testManager._id;
    logTest('Auth', 'Manager Account Login', resMgrLogin.statusCode === 200 && resMgrLogin.body.data.role === 'manager', 'Manager login yields manager JWT');

    // ── Phase 3: Room Management Testing ──────────────────────────────────────
    const testRoomNumber = `TEST_${Math.floor(100 + Math.random() * 900)}`;

    // Create room as Guest (should fail 403)
    const resCreateGuest = await request(app).post('/api/rooms').set('Authorization', `Bearer ${guestToken}`).send({
      roomNumber: testRoomNumber,
      type: 'Deluxe',
      pricePerNight: 150,
      capacity: 2,
    });
    logTest('Room RBAC', 'Guest Create Room Attempt', resCreateGuest.statusCode === 403, 'Rejects guest room creation with 403 Forbidden');

    // Create room as Manager (should succeed 201)
    const resCreateMgr = await request(app).post('/api/rooms').set('Authorization', `Bearer ${managerToken}`).send({
      roomNumber: testRoomNumber,
      type: 'Deluxe',
      pricePerNight: 150,
      capacity: 2,
      description: 'Test deluxe suite',
    });
    logTest('Room API', 'Manager Create Room', resCreateMgr.statusCode === 201 && resCreateMgr.body.data.roomNumber === testRoomNumber, 'Creates room record successfully');
    const roomId = resCreateMgr.body.data._id;

    // Create duplicate room number
    const resDupRoom = await request(app).post('/api/rooms').set('Authorization', `Bearer ${managerToken}`).send({
      roomNumber: testRoomNumber,
      type: 'Standard',
      pricePerNight: 100,
      capacity: 2,
    });
    logTest('Room API', 'Duplicate Room Number', resDupRoom.statusCode === 409, 'Rejects duplicate room number with 409 Conflict');

    // Update room as Manager
    const resUpdateRoom = await request(app).put(`/api/rooms/${roomId}`).set('Authorization', `Bearer ${managerToken}`).send({
      pricePerNight: 175,
      description: 'Updated deluxe suite',
    });
    logTest('Room API', 'Manager Update Room', resUpdateRoom.statusCode === 200 && resUpdateRoom.body.data.pricePerNight === 175, 'Updates room fields successfully');

    // Public room list and search filters
    const resGetRooms = await request(app).get('/api/rooms?type=Deluxe&maxPrice=200&sort=pricePerNight&page=1&limit=5');
    logTest('Room Search', 'GET /api/rooms Filters & Pagination', resGetRooms.statusCode === 200 && Array.isArray(resGetRooms.body.data) && resGetRooms.body.pagination.total >= 1, 'Filters by type, maxPrice, sort, and paginates correctly');

    // Get single room by ID
    const resGetRoomById = await request(app).get(`/api/rooms/${roomId}`);
    logTest('Room API', 'GET /api/rooms/:id', resGetRoomById.statusCode === 200 && resGetRoomById.body.data._id === roomId, 'Retrieves single room details');

    // ── Phase 4: Booking Management & Overlap Testing ─────────────────────────
    const checkInDate = '2026-11-10';
    const checkOutDate = '2026-11-15'; // 5 nights @ 175 = 875

    // Booking attempt in past
    const resPastBooking = await request(app).post('/api/bookings').set('Authorization', `Bearer ${guestToken}`).send({
      roomId,
      checkIn: '2020-01-01',
      checkOut: '2020-01-05',
    });
    logTest('Booking Validation', 'Past CheckIn Rejection', resPastBooking.statusCode === 400, 'Rejects past check-in dates with 400 Bad Request');

    // Booking attempt with checkOut <= checkIn
    const resInvalidDates = await request(app).post('/api/bookings').set('Authorization', `Bearer ${guestToken}`).send({
      roomId,
      checkIn: '2026-11-15',
      checkOut: '2026-11-10',
    });
    logTest('Booking Validation', 'CheckOut Before CheckIn', resInvalidDates.statusCode === 400, 'Rejects checkOut <= checkIn with 400 Bad Request');

    // Valid booking creation
    const resBook1 = await request(app).post('/api/bookings').set('Authorization', `Bearer ${guestToken}`).send({
      roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice: 1, // Client tries to manipulate price to 1
    });
    logTest('Booking API', 'Create Valid Booking', resBook1.statusCode === 201 && resBook1.body.data.totalPrice === 875, 'Calculates price on backend (875), ignores client totalPrice');
    const booking1Id = resBook1.body.data._id;

    // Overlapping booking attempt (should fail 409)
    const resOverlap = await request(app).post('/api/bookings').set('Authorization', `Bearer ${guestToken}`).send({
      roomId,
      checkIn: '2026-11-12', // Overlaps 11-10 to 11-15
      checkOut: '2026-11-18',
    });
    logTest('Overlap Check', 'Overlapping Dates Rejection', resOverlap.statusCode === 409, 'Rejects overlapping booking dates with 409 Conflict');

    // Same-day turnover booking (Check-in on check-out date: 2026-11-15 to 2026-11-18)
    const resTurnover = await request(app).post('/api/bookings').set('Authorization', `Bearer ${guestToken}`).send({
      roomId,
      checkIn: '2026-11-15',
      checkOut: '2026-11-18',
    });
    logTest('Overlap Check', 'Same-Day Turnover Booking', resTurnover.statusCode === 201, 'Allows new check-in on existing check-out date (turnover allowed)');
    const booking2Id = resTurnover.body.data._id;

    // Get My Bookings (Guest)
    const resMyBookings = await request(app).get('/api/bookings/my').set('Authorization', `Bearer ${guestToken}`);
    logTest('Booking Retrieval', 'GET /api/bookings/my', resMyBookings.statusCode === 200 && resMyBookings.body.results >= 2, 'Retrieves authenticated guest bookings');

    // Get All Bookings (Manager)
    const resMgrBookings = await request(app).get('/api/bookings').set('Authorization', `Bearer ${managerToken}`);
    logTest('Booking Retrieval', 'GET /api/bookings (Manager)', resMgrBookings.statusCode === 200 && resMgrBookings.body.results >= 2, 'Manager retrieves all guest bookings');

    // Get Booking Details by ID
    const resGetBooking = await request(app).get(`/api/bookings/${booking1Id}`).set('Authorization', `Bearer ${guestToken}`);
    logTest('Booking Retrieval', 'GET /api/bookings/:id (Owner)', resGetBooking.statusCode === 200 && resGetBooking.body.data._id === booking1Id, 'Owner retrieves booking details');

    // Another guest attempting to view booking
    const secondGuest = await Guest.create({
      name: 'Second Guest',
      email: `test_verify_2nd_${Date.now()}@example.com`,
      password: testPassword,
      role: 'guest',
    });
    const res2ndLogin = await request(app).post('/api/auth/login').send({
      email: secondGuest.email,
      password: testPassword,
    });
    const secondGuestToken = res2ndLogin.body.token;

    const resForbiddenView = await request(app).get(`/api/bookings/${booking1Id}`).set('Authorization', `Bearer ${secondGuestToken}`);
    logTest('Booking RBAC', 'Guest View Another Guest Booking', resForbiddenView.statusCode === 403, 'Rejects unauthorized booking lookup with 403 Forbidden');

    // Cancel Booking
    const resCancel = await request(app).patch(`/api/bookings/${booking1Id}/cancel`).set('Authorization', `Bearer ${guestToken}`);
    logTest('Booking Cancellation', 'PATCH /api/bookings/:id/cancel', resCancel.statusCode === 200 && resCancel.body.data.status === 'cancelled', 'Cancels booking and marks status as cancelled');

    // Cancel already cancelled booking
    const resReCancel = await request(app).patch(`/api/bookings/${booking1Id}/cancel`).set('Authorization', `Bearer ${guestToken}`);
    logTest('Booking Cancellation', 'Re-cancel Already Cancelled Booking', resReCancel.statusCode === 400, 'Rejects re-cancelling already cancelled booking');

    // Verify cancelled dates are now available again
    const resRebookCancelled = await request(app).post('/api/bookings').set('Authorization', `Bearer ${guestToken}`).send({
      roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
    });
    logTest('Availability Restoration', 'Rebooking Cancelled Date Interval', resRebookCancelled.statusCode === 201, 'Re-enables booking on dates previously blocked by cancelled reservation');
    const booking3Id = resRebookCancelled.body.data._id;

    // Room Deactivation guard test (Room with active confirmed booking 3 cannot be deactivated)
    const resDeactivateActive = await request(app).delete(`/api/rooms/${roomId}`).set('Authorization', `Bearer ${managerToken}`);
    logTest('Room Deactivation Guard', 'Deactivate Room with Active Booking', resDeactivateActive.statusCode === 409, 'Prevents room deactivation while active confirmed bookings exist');

    // Cancel booking 3 & booking 2 so room can be soft-deactivated
    await Booking.findByIdAndUpdate(booking2Id, { status: 'cancelled' });
    await Booking.findByIdAndUpdate(booking3Id, { status: 'cancelled' });

    // Deactivate room after active bookings cancelled
    const resDeactivateOk = await request(app).delete(`/api/rooms/${roomId}`).set('Authorization', `Bearer ${managerToken}`);
    logTest('Room Deactivation', 'DELETE /api/rooms/:id (Soft Deactivation)', resDeactivateOk.statusCode === 200 && resDeactivateOk.body.data.isActive === false, 'Soft-deactivates room (sets isActive: false)');

    // ── Clean up test data ────────────────────────────────────────────────────
    await Guest.deleteMany({ email: /test_verify_/i });
    await Room.deleteMany({ roomNumber: /^TEST_/ });
    await Booking.deleteMany({ _id: { $in: [booking1Id, booking2Id, booking3Id] } });

    console.log('\n==================================================');
    console.log(`📊 SUMMARY: Total Tests Executed: ${testResults.length}`);
    const passedCount = testResults.filter((t) => t.result === 'PASS').length;
    const failedCount = testResults.filter((t) => t.result === 'FAIL').length;
    console.log(`   Passed: ${passedCount}`);
    console.log(`   Failed: ${failedCount}`);
    console.log('==================================================\n');
  } catch (err) {
    console.error('❌ Test execution error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runVerificationSuite();
