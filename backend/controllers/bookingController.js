const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const validateObjectId = (id, fieldName = 'ID') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`'${id}' is not a valid ${fieldName}.`, 400);
  }
};

const createBooking = asyncHandler(async (req, res) => {
  const roomId = req.body.roomId || req.body.room;
  const { checkIn, checkOut } = req.body;

  if (!roomId || !checkIn || !checkOut) {
    throw new AppError('roomId, checkIn and checkOut dates are all required.', 400);
  }

  validateObjectId(roomId, 'room ID');

  // Validate dates and ensure check-in is not in the past
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    throw new AppError('Invalid date format provided for checkIn or checkOut.', 400);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const checkInNormalized = new Date(checkInDate);
  checkInNormalized.setHours(0, 0, 0, 0);

  if (checkInNormalized < today) {
    throw new AppError('Check-in date cannot be in the past.', 400);
  }

  if (checkOutDate <= checkInDate) {
    throw new AppError('Check-out date must be strictly after check-in date.', 400);
  }

  const room = await Room.findById(roomId);
  if (!room || !room.isActive) {
    throw new AppError(`No active room found with ID: ${roomId}`, 404);
  }

  let booking;
  let session = null;

  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      // Prevent double booking by checking overlapping date ranges
      const isOverlapping = await Booking.hasOverlap(room._id, checkInDate, checkOutDate);
      if (isOverlapping) {
        throw new AppError(
          `Room ${room.roomNumber} is already booked for the selected date range. Please choose different dates.`,
          409
        );
      }

      // Calculate total stay duration (in nights) and total price
      const timeDifference = checkOutDate.getTime() - checkInDate.getTime();
      const nights = Math.ceil(timeDifference / (1000 * 3600 * 24));
      const totalPrice = nights * room.pricePerNight;

      const created = await Booking.create(
        [
          {
            room: room._id,
            guest: req.user._id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            totalPrice,
            status: 'confirmed',
          },
        ],
        { session }
      );
      booking = created[0];
    });
  } catch (err) {
    // Fallback for standalone MongoDB instances without replica set transactions
    if (
      err.message &&
      (err.message.includes('replica set') || err.message.includes('Transaction numbers'))
    ) {
      const isOverlapping = await Booking.hasOverlap(room._id, checkInDate, checkOutDate);
      if (isOverlapping) {
        throw new AppError(
          `Room ${room.roomNumber} is already booked for the selected date range. Please choose different dates.`,
          409
        );
      }

      const timeDifference = checkOutDate.getTime() - checkInDate.getTime();
      const nights = Math.ceil(timeDifference / (1000 * 3600 * 24));
      const totalPrice = nights * room.pricePerNight;

      booking = await Booking.create({
        room: room._id,
        guest: req.user._id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalPrice,
        status: 'confirmed',
      });
    } else {
      throw err;
    }
  } finally {
    if (session) {
      await session.endSession();
    }
  }

  await booking.populate([
    { path: 'room', select: 'roomNumber type pricePerNight capacity' },
    { path: 'guest', select: 'name email role' },
  ]);

  res.status(201).json({
    success: true,
    message: 'Booking created successfully.',
    data: booking,
  });
});

const getMyBookings = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;

  const filter = { guest: req.user._id };

  if (status) {
    const VALID_STATUSES = ['confirmed', 'cancelled', 'completed'];
    if (!VALID_STATUSES.includes(status)) {
      throw new AppError(
        `Invalid status '${status}'. Allowed values: ${VALID_STATUSES.join(', ')}.`,
        400
      );
    }
    filter.status = status;
  }

  let pageNum = parseInt(page, 10) || DEFAULT_PAGE;
  let limitNum = parseInt(limit, 10) || DEFAULT_LIMIT;

  if (pageNum < 1) pageNum = DEFAULT_PAGE;
  if (limitNum < 1) limitNum = DEFAULT_LIMIT;
  if (limitNum > MAX_LIMIT) limitNum = MAX_LIMIT;

  const skip = (pageNum - 1) * limitNum;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('room', 'roomNumber type pricePerNight capacity')
      .populate('guest', 'name email role')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum),
    Booking.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  res.status(200).json({
    success: true,
    results: bookings.length,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
    data: bookings,
  });
});

const getBookings = asyncHandler(async (req, res) => {
  const { status, guest, room, page, limit } = req.query;

  const filter = {};

  if (req.user.role !== 'manager') {
    filter.guest = req.user._id;
  } else {
    if (guest) {
      validateObjectId(guest, 'guest filter ID');
      filter.guest = guest;
    }
  }

  if (room) {
    validateObjectId(room, 'room filter ID');
    filter.room = room;
  }

  if (status) {
    const VALID_STATUSES = ['confirmed', 'cancelled', 'completed'];
    if (!VALID_STATUSES.includes(status)) {
      throw new AppError(
        `Invalid status '${status}'. Allowed values: ${VALID_STATUSES.join(', ')}.`,
        400
      );
    }
    filter.status = status;
  }

  let pageNum = parseInt(page, 10) || DEFAULT_PAGE;
  let limitNum = parseInt(limit, 10) || DEFAULT_LIMIT;

  if (pageNum < 1) pageNum = DEFAULT_PAGE;
  if (limitNum < 1) limitNum = DEFAULT_LIMIT;
  if (limitNum > MAX_LIMIT) limitNum = MAX_LIMIT;

  const skip = (pageNum - 1) * limitNum;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('room', 'roomNumber type pricePerNight capacity')
      .populate('guest', 'name email role')
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum),
    Booking.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  res.status(200).json({
    success: true,
    results: bookings.length,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
    data: bookings,
  });
});

const getBookingById = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'booking ID');

  const booking = await Booking.findById(req.params.id)
    .populate('room', 'roomNumber type pricePerNight capacity description')
    .populate('guest', 'name email role');

  if (!booking) {
    throw new AppError(`No booking found with ID: ${req.params.id}`, 404);
  }

  const isOwner = booking.guest._id.toString() === req.user._id.toString();
  const isManager = req.user.role === 'manager';

  if (!isOwner && !isManager) {
    throw new AppError('Access denied. You do not have permission to view this booking.', 403);
  }

  res.status(200).json({
    success: true,
    data: booking,
  });
});

const cancelBooking = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id, 'booking ID');

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new AppError(`No booking found with ID: ${req.params.id}`, 404);
  }

  const isOwner = booking.guest.toString() === req.user._id.toString();
  const isManager = req.user.role === 'manager';

  if (!isOwner && !isManager) {
    throw new AppError('Access denied. You do not have permission to cancel this booking.', 403);
  }

  if (booking.status === 'cancelled') {
    throw new AppError('This booking is already cancelled.', 400);
  }

  booking.status = 'cancelled';
  await booking.save();

  await booking.populate([
    { path: 'room', select: 'roomNumber type pricePerNight' },
    { path: 'guest', select: 'name email role' },
  ]);

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully.',
    data: booking,
  });
});

module.exports = {
  createBooking,
  getMyBookings,
  getBookings,
  getBookingById,
  cancelBooking,
};
