const express = require('express');
const router = express.Router();
const Train = require('../models/Train');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/trains - get all trains (public for browsing, auth to book)
router.get('/', protect, async (req, res) => {
  try {
    const trains = await Train.find().sort({ trainNo: 1 });
    res.json(trains);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trains/:trainNo - get single train + booked seats
router.get('/:trainNo', protect, async (req, res) => {
  try {
    const train = await Train.findOne({ trainNo: req.params.trainNo });
    if (!train) return res.status(404).json({ error: 'Train not found' });

    const bookings = await Booking.find({ train: train._id });
    const bookedSeats = bookings.flatMap((b) => b.seatNumbers);

    res.json({ train, bookedSeats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trains - add train (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { trainNo, trainName, source, destination, numberOfCoaches, fare } = req.body;

    const exists = await Train.findOne({ trainNo });
    if (exists) return res.status(409).json({ error: 'Train number already exists' });

    const train = await Train.create({
      trainNo,
      trainName,
      source,
      destination,
      numberOfCoaches,
      fare,
    });

    res.status(201).json(train);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/trains/:trainNo - update train (admin only)
router.put('/:trainNo', protect, adminOnly, async (req, res) => {
  try {
    const train = await Train.findOne({ trainNo: req.params.trainNo });
    if (!train) return res.status(404).json({ error: 'Train not found' });

    const { trainName, source, destination, numberOfCoaches, fare } = req.body;

    const oldTotal = train.totalSeats;
    const oldAvailable = train.availableSeats;

    if (trainName) train.trainName = trainName;
    if (source) train.source = source;
    if (destination) train.destination = destination;
    if (fare !== undefined) train.fare = fare;

    if (numberOfCoaches) {
      const newTotal = numberOfCoaches * 60;
      const diff = newTotal - oldTotal;
      train.numberOfCoaches = numberOfCoaches;
      train.totalSeats = newTotal;
      train.availableSeats = Math.max(oldAvailable + diff, 0);
    }

    await train.save({ validateModifiedOnly: true });
    res.json(train);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/trains/:trainNo - delete train (admin only)
router.delete('/:trainNo', protect, adminOnly, async (req, res) => {
  try {
    const train = await Train.findOne({ trainNo: req.params.trainNo });
    if (!train) return res.status(404).json({ error: 'Train not found' });

    await Booking.deleteMany({ train: train._id });
    await Train.deleteOne({ trainNo: req.params.trainNo });

    res.json({ message: 'Train deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
