const mongoose = require('mongoose');

const BOOKING_STATUSES = ['confirmed', 'cancelled', 'completed'];

const bookingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room reference is required'],
    },

    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest',
      required: [true, 'Guest reference is required'],
    },

    checkIn: {
      type: Date,
      required: [true, 'Check-in date is required'],
    },

    checkOut: {
      type: Date,
      required: [true, 'Check-out date is required'],
      validate: {
        validator: function (checkOutValue) {
          return checkOutValue > this.checkIn;
        },
        message: 'Check-out date must be after check-in date',
      },
    },

    status: {
      type: String,
      enum: {
        values: BOOKING_STATUSES,
        message: `Status must be one of: ${BOOKING_STATUSES.join(', ')}`,
      },
      default: 'confirmed',
    },

    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price must be a positive number'],
    },
  },
  { timestamps: true }
);

bookingSchema.index({ room: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ guest: 1, status: 1 });

// Checks if a room has any overlapping confirmed bookings for a given date range.
// Overlap condition formula: (Existing checkIn < New checkOut) AND (Existing checkOut > New checkIn)
bookingSchema.statics.hasOverlap = async function (roomId, checkIn, checkOut, excludeBookingId = null) {
  const query = {
    room: roomId,
    status: 'confirmed',
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const count = await this.countDocuments(query);
  return count > 0;
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
