const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const {
  createBooking,
  getMyBookings,
  getBookings,
  getBookingById,
  cancelBooking,
} = require('../controllers/bookingController');

const router = express.Router();

// ── All booking routes are protected ──────────────────────────────────────────
router.use(protect);

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.get('/', getBookings);
router.get('/:id', getBookingById);
router.patch('/:id/cancel', cancelBooking);
router.delete('/:id', cancelBooking); // Alias for cancel

module.exports = router;
