const Slot = require('../models/Slot');
const Centre = require('../models/Centre');
const aiService = require('../services/aiService');

exports.createSlot = async (req, res, next) => {
  try {
    const slot = await Slot.create(req.body);
    res.status(201).json(slot);
  } catch (err) { next(err); }
};

exports.listSlots = async (req, res, next) => {
  try {
    const { centreId, date } = req.query;
    const filter = { status: 'available' };
    if (centreId) filter.centre = centreId;
    if (date) filter.date = new Date(date);
    const slots = await Slot.find(filter).populate('centre', 'name location');
    res.json(slots);
  } catch (err) { next(err); }
};

// Smart Slots + Smart Centre Recommendation (AI-powered, matches PPT feature set)
exports.recommendSlot = async (req, res, next) => {
  try {
    const { crop, farmerLocation, date } = req.body;
    const centres = await Centre.find({ cropsAccepted: crop, status: { $ne: 'closed' } });
    if (!centres.length) {
      return res.status(404).json({ message: 'No centres accept this crop currently' });
    }

    const recommendation = await aiService.recommendCentre({ farmerLocation, crop, centres });
    const recommendedCentre =
      centres.find((c) => c._id.toString() === String(recommendation.recommended_centre_id)) || centres[0];

    const slots = await Slot.find({
      centre: recommendedCentre._id,
      status: 'available',
      ...(date && { date: new Date(date) })
    })
      .sort({ date: 1, startTime: 1 })
      .limit(5);

    res.json({ recommendedCentre, recommendation, availableSlots: slots });
  } catch (err) { next(err); }
};