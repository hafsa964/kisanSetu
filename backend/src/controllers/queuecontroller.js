const Token = require('../models/token');
const Slot = require('../models/Slot');
const Centre = require('../models/Centre');
const aiService = require('../services/aiService');
const { emitToFarmer, emitToCentre } = require('../services/socketService');

// Live Queue: book a token, get AI-predicted wait time immediately
exports.bookToken = async (req, res, next) => {
  try {
    const { slotId, crop, quantityKg } = req.body;
    const slot = await Slot.findById(slotId).populate('centre');
    if (!slot || slot.status !== 'available') {
      return res.status(400).json({ message: 'Slot not available' });
    }
    if (slot.booked >= slot.capacity) {
      slot.status = 'full';
      await slot.save();
      return res.status(400).json({ message: 'Slot is full' });
    }

    const tokenNumber = slot.booked + 1;
    const hourOfDay = new Date().getHours();

    const prediction = await aiService.predictWaitTime({
      queueLength: slot.centre.currentQueueLength,
      capacityPerSlot: slot.centre.capacityPerSlot,
      hourOfDay,
      cropType: crop
    });

    const token = await Token.create({
      farmer: req.farmerId,
      centre: slot.centre._id,
      slot: slot._id,
      crop,
      quantityKg,
      tokenNumber,
      predictedWaitMinutes: prediction.predicted_wait_minutes,
      status: 'booked'
    });

    slot.booked += 1;
    if (slot.booked >= slot.capacity) slot.status = 'full';
    await slot.save();

    await Centre.findByIdAndUpdate(slot.centre._id, { $inc: { currentQueueLength: 1 } });

    emitToCentre(slot.centre._id.toString(), 'queue_updated', { centreId: slot.centre._id });

    res.status(201).json({ token, prediction });
  } catch (err) { next(err); }
};

exports.getTokenStatus = async (req, res, next) => {
  try {
    const token = await Token.findById(req.params.id).populate('centre slot');
    if (!token) return res.status(404).json({ message: 'Token not found' });
    res.json(token);
  } catch (err) { next(err); }
};

// Instant Alerts: admin/system updates a token's status, farmer gets a real-time push
exports.updateTokenStatus = async (req, res, next) => {
  try {
    const { status, message } = req.body;
    const token = await Token.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!token) return res.status(404).json({ message: 'Token not found' });

    emitToFarmer(token.farmer.toString(), 'token_status_update', {
      tokenId: token._id,
      status,
      message
    });

    res.json(token);
  } catch (err) { next(err); }
};

exports.myTokens = async (req, res, next) => {
  try {
    const tokens = await Token.find({ farmer: req.farmerId })
      .populate('centre slot')
      .sort({ createdAt: -1 });
    res.json(tokens);
  } catch (err) { next(err); }
};