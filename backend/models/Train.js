const mongoose = require('mongoose');

const trainSchema = new mongoose.Schema(
  {
    trainNo: {
      type: Number,
      required: true,
      unique: true,
    },
    trainName: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    numberOfCoaches: {
      type: Number,
      required: true,
      min: 1,
    },
    totalSeats: {
      type: Number,
    },
    fare: {
      type: Number,
      required: true,
      min: 0,
    },
    availableSeats: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Auto-calculate totalSeats and availableSeats before save
trainSchema.pre('save', function (next) {
  if (this.isModified('numberOfCoaches') || this.isNew) {
    const total = this.numberOfCoaches * 60;
    this.totalSeats = total;
    if (this.isNew) {
      this.availableSeats = total;
    }
  }
  next();
});

module.exports = mongoose.model('Train', trainSchema);
