const mongoose = require('mongoose');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const VALID_ROOM_TYPES = ['Standard', 'Deluxe', 'Suite'];
const VALID_SORT_FIELDS = ['pricePerNight', '-pricePerNight'];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const success = (res, statusCode, data) => res.status(statusCode).json({ success: true, ...data });

const validateObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`'${id}' is not a valid room ID.`, 400);
  }
};

const getRooms = asyncHandler(async (req, res) => {
  const { type, maxPrice, sort, page, limit } = req.query;

  const filter = { isActive: true };

  if (type !== undefined) {
    if (!VALID_ROOM_TYPES.includes(type)) {
      throw new AppError(
        `Invalid room type '${type}'. Must be one of: ${VALID_ROOM_TYPES.join(', ')}.`,
        400
      );
    }
    filter.type = type;
  }

  if (maxPrice !== undefined) {
    const maxPriceNum = Number(maxPrice);
    if (isNaN(maxPriceNum) || maxPriceNum < 1) {
      throw new AppError('maxPrice must be a positive number.', 400);
    }
    filter.pricePerNight = { $lte: maxPriceNum };
  }

  let sortOption = 'createdAt';
  if (sort !== undefined) {
    if (!VALID_SORT_FIELDS.includes(sort)) {
      throw new AppError(
        `Invalid sort value '${sort}'. Allowed values: ${VALID_SORT_FIELDS.join(', ')}.`,
        400
      );
    }
    sortOption = sort;
  }

  let pageNum = parseInt(page, 10) || DEFAULT_PAGE;
  let limitNum = parseInt(limit, 10) || DEFAULT_LIMIT;

  if (pageNum < 1) {
    throw new AppError('page must be a positive integer.', 400);
  }
  if (limitNum < 1) {
    throw new AppError('limit must be a positive integer.', 400);
  }
  if (limitNum > MAX_LIMIT) {
    limitNum = MAX_LIMIT;
  }

  const skip = (pageNum - 1) * limitNum;

  const [rooms, total] = await Promise.all([
    Room.find(filter).sort(sortOption).skip(skip).limit(limitNum),
    Room.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  success(res, 200, {
    results: rooms.length,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
    data: rooms,
  });
});

const getRoomById = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id);

  const room = await Room.findOne({ _id: req.params.id, isActive: true });

  if (!room) {
    throw new AppError(`No active room found with ID: ${req.params.id}`, 404);
  }

  success(res, 200, { data: room });
});

const createRoom = asyncHandler(async (req, res) => {
  const { roomNumber, type, pricePerNight, capacity, description } = req.body;

  if (!roomNumber || !type || pricePerNight === undefined || capacity === undefined) {
    throw new AppError(
      'roomNumber, type, pricePerNight and capacity are all required.',
      400
    );
  }

  const room = await Room.create({ roomNumber, type, pricePerNight, capacity, description });

  success(res, 201, {
    message: 'Room created successfully.',
    data: room,
  });
});

const updateRoom = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id);

  const ALLOWED_UPDATES = ['roomNumber', 'type', 'pricePerNight', 'capacity', 'description', 'isActive'];

  const updates = {};
  for (const key of ALLOWED_UPDATES) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw new AppError(
      `No valid fields provided for update. Updatable fields: ${ALLOWED_UPDATES.join(', ')}.`,
      400
    );
  }

  const room = await Room.findByIdAndUpdate(
    req.params.id,
    updates,
    { returnDocument: 'after', runValidators: true }
  );

  if (!room) {
    throw new AppError(`No room found with ID: ${req.params.id}`, 404);
  }

  success(res, 200, {
    message: 'Room updated successfully.',
    data: room,
  });
});

const deleteRoom = asyncHandler(async (req, res) => {
  validateObjectId(req.params.id);

  const room = await Room.findById(req.params.id);

  if (!room) {
    throw new AppError(`No room found with ID: ${req.params.id}`, 404);
  }

  if (!room.isActive) {
    throw new AppError('This room is already deactivated.', 400);
  }

  const activeBookingCount = await Booking.countDocuments({
    room: req.params.id,
    status: 'confirmed',
  });

  if (activeBookingCount > 0) {
    throw new AppError(
      `Cannot deactivate room ${room.roomNumber}: it has ${activeBookingCount} active ` +
        `booking(s). Please cancel them first.`,
      409
    );
  }

  room.isActive = false;
  await room.save();

  success(res, 200, {
    message: `Room ${room.roomNumber} has been deactivated and is no longer available for new bookings.`,
    data: room,
  });
});

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
};
