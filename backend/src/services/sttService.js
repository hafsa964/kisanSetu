const axios = require('axios');

const ULCA_AUTH_URL = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline';
const USER_ID = process.env.BHASHINI_USER_ID;
const API_KEY = process.env.BHASHINI_API_KEY;
const ASR_PIPELINE_ID = process.env.BHASHINI_ASR_PIPELINE_ID || process.env.BHASHINI_PIPELINE_ID;

const langMap = { hi: 'hi', kn: 'kn', mr: 'mr', te: 'te', en: 'en' };

/**
 * Transcribes speech to text using Bhashini's ULCA ASR pipeline.
 * Same two-step config -> compute flow as ttsService, but taskType 'asr'
 * and the audio goes IN as base64 instead of coming out.
 * @param {string} base64Audio - base64-encoded audio (WAV, 16kHz preferred).
 * @param {string} langCode - 'hi', 'kn', 'mr', 'te', etc.
 * @returns {Promise<string>} - Transcribed text.
 */
async function transcribeSpeech(base64Audio, langCode) {
  if (!base64Audio) {
    const error = new Error('Audio data is required for transcription');
    error.statusCode = 400;
    throw error;
  }

  const sourceLanguage = langMap[langCode] || 'hi';

  try {
    const configRes = await axios.post(
      ULCA_AUTH_URL,
      {
        pipelineTasks: [
          { taskType: 'asr', config: { language: { sourceLanguage } } }
        ],
        pipelineRequestConfig: { pipelineId: ASR_PIPELINE_ID }
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

    const computeRes = await axios.post(
      computeUrl,
      {
        pipelineTasks: [
          {
            taskType: 'asr',
            config: {
              language: { sourceLanguage },
              serviceId,
              audioFormat: 'wav',
              samplingRate: 16000
            }
          }
        ],
        inputData: { audio: [{ audioContent: base64Audio }] }
      },
      {
        headers: {
          [inferenceApiKey.name]: inferenceApiKey.value,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return computeRes.data.pipelineResponse[0].output[0].source || '';
  } catch (err) {
    console.error('STT Service Error:', err.message);
    const error = new Error('Failed to transcribe speech');
    error.statusCode = 502;
    throw error;
  }
}

module.exports = { transcribeSpeech };
