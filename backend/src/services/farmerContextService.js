const Token = require('../models/token');
const Farmer = require('../models/farmer');

/**
 * Gathers a farmer's real current status (active token, centre, wait time)
 * so the LLM answers questions using actual data instead of guessing.
 * @param {string} farmerId
 * @returns {Promise<object>} plain-object context, safe to JSON.stringify into a prompt
 */
async function getFarmerContext(farmerId) {
  const farmer = await Farmer.findById(farmerId).select('-password');

  const activeToken = await Token.findOne({
    farmer: farmerId,
    status: { $in: ['booked', 'in_queue', 'in_progress'] }
  })
    .sort({ createdAt: -1 })
    .populate('centre', 'name location currentQueueLength capacityPerSlot status operatingHours')
    .populate('slot', 'date startTime endTime status');

  if (!farmer) return null;

  return {
    farmerName: farmer.name,
    preferredLanguage: farmer.preferredLanguage,
    district: farmer.location?.district || null,
    activeToken: activeToken
      ? {
          tokenNumber: activeToken.tokenNumber,
          crop: activeToken.crop,
          quantityKg: activeToken.quantityKg,
          status: activeToken.status,
          predictedWaitMinutes: activeToken.predictedWaitMinutes,
          centreName: activeToken.centre?.name,
          centreStatus: activeToken.centre?.status,
          centreQueueLength: activeToken.centre?.currentQueueLength,
          centreOperatingHours: activeToken.centre?.operatingHours,
          slotDate: activeToken.slot?.date,
          slotTime: activeToken.slot ? `${activeToken.slot.startTime}-${activeToken.slot.endTime}` : null,
          slotStatus: activeToken.slot?.status
        }
      : null
  };
}

module.exports = { getFarmerContext };
