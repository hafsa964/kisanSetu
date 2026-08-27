const axios = require('axios');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function predictWaitTime({ queueLength, capacityPerSlot, hourOfDay, cropType }) {
  try {
    const { data } = await axios.post(
      `${AI_URL}/predict/wait-time`,
      {
        queue_length: queueLength,
        capacity_per_slot: capacityPerSlot,
        hour_of_day: hourOfDay,
        crop_type: cropType
      },
      { timeout: 3000 }
    );
    return data;
  } catch (err) {
    const estimatedMinutes = Math.round((queueLength / Math.max(capacityPerSlot, 1)) * 15);
    return {
      predicted_wait_minutes: estimatedMinutes,
      congestion_level: estimatedMinutes > 60 ? 'high' : estimatedMinutes > 30 ? 'moderate' : 'normal',
      fallback: true
    };
  }
}

async function recommendCentre({ farmerLocation, crop, centres }) {
  try {
    const { data } = await axios.post(
      `${AI_URL}/recommend/centre`,
      { farmer_location: farmerLocation, crop, centres },
      { timeout: 3000 }
    );
    return data;
  } catch (err) {
    const sorted = [...centres].sort((a, b) => a.currentQueueLength - b.currentQueueLength);
    return {
      recommended_centre_id: sorted[0]?._id,
      reason: 'lowest current queue (fallback, AI service unreachable)',
      fallback: true
    };
  }
}

module.exports = { predictWaitTime, recommendCentre };
