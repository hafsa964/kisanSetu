const axios = require('axios');

const ULCA_AUTH_URL = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline';
const USER_ID = process.env.BHASHINI_USER_ID;
const API_KEY = process.env.BHASHINI_API_KEY;
const PIPELINE_ID = process.env.BHASHINI_PIPELINE_ID; // from ULCA portal

// Mapping Farmer model language codes to Bhashini/ULCA ISO codes
const langMap = { hi: 'hi', kn: 'kn', mr: 'mr', te: 'te', en: 'en' };

/**
 * Converts text to speech using Bhashini's ULCA pipeline.
 * Bhashini has no single fixed "synthesize" endpoint — it's a two-step flow:
 *   1) config call, which returns the actual inference endpoint + auth to use
 *   2) compute call against that endpoint, which returns base64 audio in JSON
 * @param {string} text - The alert message.
 * @param {string} langCode - 'hi', 'kn', 'mr', 'te', etc.
 * @returns {Promise<Buffer>} - Decoded audio data buffer (WAV).
 */
async function generateSpeech(text, langCode) {
  if (!text || !text.trim()) {
    const error = new Error('Text is required for speech synthesis');
    error.statusCode = 400;
    throw error;
  }

  const sourceLanguage = langMap[langCode] || 'hi';

  try {
    // Step 1: ask ULCA which model/endpoint serves TTS for this language
    const configRes = await axios.post(
      ULCA_AUTH_URL,
      {
        pipelineTasks: [
          { taskType: 'tts', config: { language: { sourceLanguage } } }
        ],
        pipelineRequestConfig: { pipelineId: PIPELINE_ID }
      },
      {
        headers: { userID: USER_ID, ulcaApiKey: API_KEY },
        timeout: 5000
      }
    );

    const endpoint = configRes.data.pipelineInferenceAPIEndPoint;
    const computeUrl = endpoint.callbackUrl;
    const inferenceApiKey = endpoint.inferenceApiKey;
    const serviceId = configRes.data.pipelineResponseConfig[0].config[0].serviceId;

    // Step 2: actually synthesize the audio
    const computeRes = await axios.post(
      computeUrl,
      {
        pipelineTasks: [
          {
            taskType: 'tts',
            config: {
              language: { sourceLanguage },
              serviceId,
              gender: 'female',
              samplingRate: 8000
            }
          }
        ],
        inputData: { input: [{ source: text }] }
      },
      {
        headers: {
          [inferenceApiKey.name]: inferenceApiKey.value,
          'Content-Type': 'application/json'
        },
        timeout: 8000
      }
    );

    const base64Audio = computeRes.data.pipelineResponse[0].audio[0].audioContent;
    return Buffer.from(base64Audio, 'base64');
  } catch (err) {
    console.error('TTS Service Error:', err.message);
    const error = new Error('Failed to synthesize speech');
    error.statusCode = 502;
    throw error;
  }
}

module.exports = { generateSpeech };
