const Alert = require('../models/Alert');
const { emitToFarmer } = require('../services/socketService');

exports.createAlert = async (req, res, next) => {
  try {
    const alert = await Alert.create(req.body);
    emitToFarmer(alert.farmer.toString(), 'new_alert', alert);
    res.status(201).json(alert);
  } catch (err) { next(err); }
};

exports.myAlerts = async (req, res, next) => {
  try {
    const alerts = await Alert.find({ farmer: req.farmerId }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(alert);
  } catch (err) { next(err); }
};