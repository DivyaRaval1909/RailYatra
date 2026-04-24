const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    train: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Train',
      required: true,
    },
    seatsBooked: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
    },
    fare: {
      type: Number,
      required: true,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    bookingTime: {
      type: Date,
      default: Date.now,
    },
    seatNumbers: {
      type: [String],
      required: true,
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
