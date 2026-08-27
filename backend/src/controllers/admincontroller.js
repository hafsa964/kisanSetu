const Centre = require('../models/Centre');
const Token = require('../models/token');

exports.dashboardOverview = async (req, res, next) => {
  try {
    const centres = await Centre.find();
    const totalActiveTokens = await Token.countDocuments({
      status: { $in: ['booked', 'in_queue', 'in_progress'] }
    });
    const totalCompleted = await Token.countDocuments({ status: 'completed' });

    const centreStats = centres.map((c) => ({
      id: c._id,
      name: c.name,
      currentQueueLength: c.currentQueueLength,
      capacityPerSlot: c.capacityPerSlot,
      status: c.status,
      congestionLevel:
        c.currentQueueLength > c.capacityPerSlot * 2
          ? 'high'
          : c.currentQueueLength > c.capacityPerSlot
          ? 'moderate'
          : 'normal'
    }));

    res.json({ totalActiveTokens, totalCompleted, centres: centreStats });
  } catch (err) { next(err); }
};

exports.centreQueueDetail = async (req, res, next) => {
  try {
    const tokens = await Token.find({
      centre: req.params.centreId,
      status: { $in: ['booked', 'in_queue', 'in_progress'] }
    })
      .populate('farmer', 'name phone')
      .sort({ tokenNumber: 1 });
    res.json(tokens);
  } catch (err) { next(err); }
};