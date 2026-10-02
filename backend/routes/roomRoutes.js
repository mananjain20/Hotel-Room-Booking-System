

const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} = require('../controllers/roomController');

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/', getRooms);
router.get('/:id', getRoomById);

// ── Manager only ──────────────────────────────────────────────────────────────
router.post('/', protect, restrictTo('manager'), createRoom);
router.put('/:id', protect, restrictTo('manager'), updateRoom);
router.delete('/:id', protect, restrictTo('manager'), deleteRoom);

module.exports = router;
