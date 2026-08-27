const axios = require('axios');
const twilio = require('twilio');
const path = require('path');
const fs = require('fs');
const Alert = require('../models/Alert');
const { transcribeSpeech } = require('../services/sttService');
const { placeAlertCall } = require('../services/ivrService');
const { generateSpeech } = require('../services/ttsService');
const { answerFarmerQuestion } = require('../services/llmService');
const { getFarmerContext } = require('../services/farmerContextService');

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const AUDIO_DIR = path.join(__dirname, '..', '..', 'public', 'audio');
const MAX_VOICE_TURNS = parseInt(process.env.MAX_VOICE_TURNS || '4', 10);

// --- App-based voice input (farmer records in the app, we transcribe it) ---
exports.transcribeAudio = async (req, res, next) => {
  try {
    const { audioBase64, langCode } = req.body;
    const text = await transcribeSpeech(audioBase64, langCode);
    res.json({ text });
  } catch (err) { next(err); }
};

// --- Trigger an outbound IVR call for a given alert ---
exports.callFarmerForAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.alertId).populate('farmer', 'phone');
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    if (!alert.farmer?.phone) return res.status(400).json({ message: 'Farmer has no phone on file' });

    const result = await placeAlertCall(alert._id.toString(), alert.farmer.phone);
    res.json({ success: true, call: result });
  } catch (err) { next(err); }
};

// --- Twilio fetches this to know what to say/do on the call ---
exports.getTwimlForAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.alertId);
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    if (alert?.audioUrl && process.env.PUBLIC_BASE_URL) {
      twiml.play(`${process.env.PUBLIC_BASE_URL}${alert.audioUrl}`);
    } else if (alert?.message) {
      // Fallback to Twilio's own TTS if our Bhashini audio isn't available
      twiml.say({ language: 'hi-IN' }, alert.message);
    } else {
      twiml.say('No alert found.');
    }

    twiml.record({
      maxLength: 20,
      action: `${process.env.PUBLIC_BASE_URL}/api/voice/recording/${req.params.alertId}?turn=1`,
      playBeep: true
    });

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (err) { next(err); }
};

// --- Twilio posts the recording here once the farmer finishes speaking.
// This is the real understand -> answer -> respond loop: transcribe what
// the farmer said, generate a genuine answer from their real queue data
// (not a scripted response), speak it back in their language, then let
// them ask a follow-up — capped at MAX_VOICE_TURNS so a call can't run forever.
exports.handleRecording = async (req, res, next) => {
  try {
    const { RecordingUrl } = req.body;
    const turn = parseInt(req.query.turn || '1', 10);
    const alert = await Alert.findById(req.params.alertId);
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    if (!alert || !RecordingUrl) {
      twiml.say({ language: 'hi-IN' }, 'Maaf kijiye, kuch samajh nahi aaya.');
      res.type('text/xml');
      return res.send(twiml.toString());
    }

    let question = '';
    let answerText = null;

    try {
      const audioRes = await axios.get(`${RecordingUrl}.wav`, {
        responseType: 'arraybuffer',
        auth: { username: ACCOUNT_SID, password: AUTH_TOKEN },
        timeout: 8000
      });
      const base64Audio = Buffer.from(audioRes.data).toString('base64');
      question = await transcribeSpeech(base64Audio, alert.language);
      alert.farmerResponse = question;

      // Ground the answer in the farmer's real, current data — not a guess
      const context = await getFarmerContext(alert.farmer);
      answerText = await answerFarmerQuestion(question, alert.language, context);
    } catch (turnErr) {
      console.error('Voice turn failed:', turnErr.message);
    }

    if (answerText) {
      try {
        const audioBuffer = await generateSpeech(answerText, alert.language);
        if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
        const fileName = `${alert._id}-reply-${turn}.wav`;
        fs.writeFileSync(path.join(AUDIO_DIR, fileName), audioBuffer);
        twiml.play(`${process.env.PUBLIC_BASE_URL}/public/audio/${fileName}`);
      } catch (ttsErr) {
        console.error('Reply TTS failed, falling back to Twilio Say:', ttsErr.message);
        twiml.say({ language: 'hi-IN' }, answerText);
      }
    } else {
      twiml.say({ language: 'hi-IN' }, 'Maaf kijiye, main iska jawaab nahi de paaya. Kripya centre se sampark karein.');
    }

    await alert.save();

    if (turn < MAX_VOICE_TURNS) {
      twiml.record({
        maxLength: 20,
        action: `${process.env.PUBLIC_BASE_URL}/api/voice/recording/${req.params.alertId}?turn=${turn + 1}`,
        playBeep: true
      });
    } else {
      twiml.say({ language: 'hi-IN' }, 'Dhanyavaad.');
    }

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (err) { next(err); }
};
