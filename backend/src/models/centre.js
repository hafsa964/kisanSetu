const mongoose = require('mongoose');

const centreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    lat: Number,
    lng: Number,
    address: String,
    district: String
  },
  cropsAccepted: [{ type: String }],
  capacityPerSlot: { type: Number, default: 20 },
  operatingHours: {
    open: { type: String, default: '08:00' },
    close: { type: String, default: '18:00' }
  },
  currentQueueLength: { type: Number, default: 0 },
  status: { type: String, enum: ['open', 'closed', 'delayed'], default: 'open' }
});

module.exports = mongoose.model('Centre', centreSchema);
