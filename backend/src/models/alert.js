const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
  token: { type: mongoose.Schema.Types.ObjectId, ref: 'Token' },
  type: {
    type: String,
    enum: ['delay', 'slot_change', 'turn_approaching', 'centre_change', 'general'],
    required: true
  },
  message: { type: String, required: true },
  language: { type: String, default: 'en' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);
