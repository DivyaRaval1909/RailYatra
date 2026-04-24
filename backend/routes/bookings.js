const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Booking = require('../models/Booking');
const Train = require('../models/Train');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/bookings - create booking
router.post('/', protect, async (req, res) => {
  try {
    const { trainNo, selectedSeats } = req.body;

    if (!selectedSeats || selectedSeats.length === 0 || selectedSeats.length > 4) {
      return res.status(400).json({ error: 'Select between 1 and 4 seats' });
    }

    const train = await Train.findOne({ trainNo });
    if (!train) return res.status(404).json({ error: 'Train not found' });

    if (train.availableSeats < selectedSeats.length) {
      return res.status(400).json({ error: 'Not enough seats available' });
    }

    // Check for already-booked seats
    const existingBookings = await Booking.find({ train: train._id });
    const bookedSeats = existingBookings.flatMap((b) => b.seatNumbers);

    const conflict = selectedSeats.find((s) => bookedSeats.includes(s));
    if (conflict) {
      return res.status(409).json({ error: `Seat ${conflict} is already booked` });
    }

    const totalFare = train.fare * selectedSeats.length;

    const booking = await Booking.create({
      bookingId: uuidv4(),
      user: req.user._id,
      train: train._id,
      seatsBooked: selectedSeats.length,
      seatNumbers: selectedSeats,
      fare: totalFare,
      paid: false,
      bookingTime: new Date(),
    });

    // Decrease available seats
    train.availableSeats -= selectedSeats.length;
    await train.save({ validateModifiedOnly: true });

    await booking.populate(['user', 'train']);

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/my - get current user's bookings
router.get('/my', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('train')
      .sort({ bookingTime: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/:bookingId - get specific booking
router.get('/:bookingId', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId })
      .populate('user', '-password')
      .populate('train');

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Only owner or admin can view
    if (
      booking.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'ROLE_ADMIN'
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bookings/:bookingId/pay - mark as paid after payment verification
router.patch('/:bookingId/pay', protect, async (req, res) => {
  try {
    const { razorpayPaymentId, razorpayOrderId } = req.body;

    const booking = await Booking.findOne({ bookingId: req.params.bookingId });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    booking.paid = true;
    booking.razorpayPaymentId = razorpayPaymentId;
    booking.razorpayOrderId = razorpayOrderId;
    await booking.save();

    await booking.populate(['user', 'train']);
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings - admin: get all bookings
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'username email')
      .populate('train', 'trainName trainNo source destination')
      .sort({ bookingTime: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
