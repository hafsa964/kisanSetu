const twilio = require('twilio');

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER;
// Public HTTPS base URL for this backend (e.g. an ngrok URL in dev, or your
// real domain in prod) — Twilio needs to be able to reach these endpoints.
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL;

const client = ACCOUNT_SID && AUTH_TOKEN ? twilio(ACCOUNT_SID, AUTH_TOKEN) : null;

/**
 * Places an outbound call to a farmer for a given alert. Twilio will fetch
 * TwiML instructions from our /api/voice/twiml/:alertId endpoint, which
 * plays the alert's synthesized audio and records the farmer's reply.
 * @param {string} alertId
 * @param {string} farmerPhone - E.164 format, e.g. '+91XXXXXXXXXX'
 */
async function placeAlertCall(alertId, farmerPhone) {
  if (!client) {
    const error = new Error('IVR is not configured (missing Twilio credentials)');
    error.statusCode = 503;
    throw error;
  }
  if (!PUBLIC_BASE_URL) {
    const error = new Error('PUBLIC_BASE_URL is not set — Twilio cannot reach this server');
    error.statusCode = 503;
    throw error;
  }

  try {
    const call = await client.calls.create({
      to: farmerPhone,
      from: TWILIO_NUMBER,
      url: `${PUBLIC_BASE_URL}/api/voice/twiml/${alertId}`,
      statusCallback: `${PUBLIC_BASE_URL}/api/voice/status`,
      statusCallbackEvent: ['completed', 'failed', 'no-answer']
    });
    return { sid: call.sid, status: call.status };
  } catch (err) {
    console.error('IVR call error:', err.message);
    const error = new Error('Failed to place IVR call');
    error.statusCode = 502;
    throw error;
  }
}

module.exports = { placeAlertCall };
