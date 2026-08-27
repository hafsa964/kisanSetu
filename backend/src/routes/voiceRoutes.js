const router = require('express').Router();
const auth = require('../middleware/auth');
const {
  transcribeAudio,
  callFarmerForAlert,
  getTwimlForAlert,
  handleRecording
} = require('../controllers/voiceController');

// Farmer-app voice input (recorded in-app, sent up for transcription)
router.post('/transcribe', auth, transcribeAudio);

// Triggers an outbound IVR call for an alert. Left unauthenticated for now
// to match this repo's existing admin routes (adminRoutes.js has no auth
// middleware either) — add an admin-auth check before this goes to prod.
router.post('/call/:alertId', callFarmerForAlert);

// Twilio webhooks — Twilio calls these directly, so they can't carry our
// JWT. In production, verify the X-Twilio-Signature header instead.
router.post('/twiml/:alertId', getTwimlForAlert);
router.get('/twiml/:alertId', getTwimlForAlert);
router.post('/recording/:alertId', handleRecording);
router.post('/status', (req, res) => res.sendStatus(200));

module.exports = router;
