const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  centre: { type: mongoose.Schema.Types.ObjectId, ref: 'Centre', required: true },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  crop: { type: String, required: true },
  quantityKg: Number,
  tokenNumber: { type: Number, required: true },
  predictedWaitMinutes: Number,
  status: {
    type: String,
    enum: ['booked', 'in_queue', 'in_progress', 'completed', 'cancelled'],
    default: 'booked'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Token', tokenSchema);
