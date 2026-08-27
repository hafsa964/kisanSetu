const Centre = require('../models/Centre');

exports.createCentre = async (req, res, next) => {
  try {
    const centre = await Centre.create(req.body);
    res.status(201).json(centre);
  } catch (err) { next(err); }
};

exports.listCentres = async (req, res, next) => {
  try {
    const { crop, district } = req.query;
    const filter = {};
    if (crop) filter.cropsAccepted = crop;
    if (district) filter['location.district'] = district;
    const centres = await Centre.find(filter);
    res.json(centres);
  } catch (err) { next(err); }
};

exports.getCentre = async (req, res, next) => {
  try {
    const centre = await Centre.findById(req.params.id);
    if (!centre) return res.status(404).json({ message: 'Centre not found' });
    res.json(centre);
  } catch (err) { next(err); }
};

exports.updateCentreStatus = async (req, res, next) => {
  try {
    const centre = await Centre.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, currentQueueLength: req.body.currentQueueLength },
      { new: true }
    );
    res.json(centre);
  } catch (err) { next(err); }
};