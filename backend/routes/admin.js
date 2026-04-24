const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Train = require('../models/Train');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/admin/stats - dashboard statistics
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalTrains, totalBookings, paidBookings] = await Promise.all([
      User.countDocuments({ role: 'ROLE_USER' }),
      Train.countDocuments(),
      Booking.countDocuments(),
      Booking.countDocuments({ paid: true }),
    ]);

    const revenueResult = await Booking.aggregate([
      { $match: { paid: true } },
      { $group: { _id: null, total: { $sum: '$fare' } } },
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      totalUsers,
      totalTrains,
      totalBookings,
      paidBookings,
      totalRevenue,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users - list all users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'ROLE_USER' }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/bookings - list all bookings with full details
router.get('/bookings', protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'username email')
      .populate('train', 'trainName trainNo source destination fare')
      .sort({ bookingTime: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
