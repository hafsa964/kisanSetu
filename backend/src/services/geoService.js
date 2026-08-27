const axios = require('axios');

const OLA_MAPS_URL = 'https://api.olamaps.io/places/v1/reverse-geocode';
const OLA_KEY = process.env.OLA_MAPS_API_KEY;

/**
 * Reverse-geocodes lat/lng into district/state using Ola Maps (India-optimized).
 * Falls back gracefully (returns nulls) if the geocoding call fails, so a
 * farmer's location can still be saved even when the geocoder is down.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{district: string|null, state: string|null, fallback?: boolean}>}
 */
async function reverseGeocode(lat, lng) {
  try {
    const { data } = await axios.get(OLA_MAPS_URL, {
      params: { latlng: `${lat},${lng}`, api_key: OLA_KEY },
      timeout: 4000
    });

    const components = data?.results?.[0]?.address_components || [];
    const district = components.find(c => c.types.includes('administrative_area_level_3'))?.long_name || null;
    const state = components.find(c => c.types.includes('administrative_area_level_1'))?.long_name || null;

    return { district, state };
  } catch (err) {
    console.error('Reverse geocoding error:', err.message);
    return { district: null, state: null, fallback: true };
  }
}

module.exports = { reverseGeocode };
