const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  centre: { type: mongoose.Schema.Types.ObjectId, ref: 'Centre', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  capacity: { type: Number, required: true },
  booked: { type: Number, default: 0 },
  status: { type: String, enum: ['available', 'full', 'cancelled'], default: 'available' }
});

module.exports = mongoose.model('Slot', slotSchema);
