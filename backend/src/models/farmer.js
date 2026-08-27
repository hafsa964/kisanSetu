const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const farmerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  preferredLanguage: { type: String, default: 'en' },
  location: {
    lat: Number,
    lng: Number,
    district: String,
    state: String
  },
  crops: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

farmerSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

farmerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('Farmer', farmerSchema);
