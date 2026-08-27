const Farmer = require('../models/farmer');
const generateToken = require('../utils/generateToken');

exports.register = async (req, res, next) => {
  try {
    const { name, phone, password, preferredLanguage, location, crops } = req.body;
    const exists = await Farmer.findOne({ phone });
    if (exists) return res.status(400).json({ message: 'Phone already registered' });

    const farmer = await Farmer.create({ name, phone, password, preferredLanguage, location, crops });
    res.status(201).json({
      farmer: { id: farmer._id, name: farmer.name, phone: farmer.phone },
      token: generateToken(farmer._id)
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const farmer = await Farmer.findOne({ phone });
    if (!farmer || !(await farmer.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({
      farmer: { id: farmer._id, name: farmer.name, phone: farmer.phone },
      token: generateToken(farmer._id)
    });
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const farmer = await Farmer.findById(req.farmerId).select('-password');
    res.json(farmer);
  } catch (err) {
    next(err);
  }
};