const mongoose = require('mongoose');

const ROOM_TYPES = ['Standard', 'Deluxe', 'Suite'];

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
    },

    type: {
      type: String,
      required: [true, 'Room type is required'],
      enum: {
        values: ROOM_TYPES,
        message: `Room type must be one of: ${ROOM_TYPES.join(', ')}`,
      },
    },

    pricePerNight: {
      type: Number,
      required: [true, 'Price per night is required'],
      min: [1, 'Price per night must be a positive number (minimum 1)'],
    },

    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Capacity must be a whole number',
      },
    },

    description: {
      type: String,
      trim: true,
      default: '',
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

roomSchema.index({ type: 1, isActive: 1 });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
