const axios = require('axios');

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

const langNames = {
  hi: 'Hindi', kn: 'Kannada', mr: 'Marathi', te: 'Telugu', en: 'English'
};

/**
 * Generates a real, grounded answer to a farmer's spoken question — not a
 * scripted/templated response. The model is given the farmer's actual
 * queue/token/centre data and instructed to answer only from it, in the
 * farmer's own language, in a short spoken style (this becomes a TTS call).
 * @param {string} question - transcribed farmer question
 * @param {string} langCode - 'hi' | 'kn' | 'mr' | 'te' | 'en'
 * @param {object|null} context - output of farmerContextService.getFarmerContext
 * @returns {Promise<string>} the answer text, in the requested language
 */
async function answerFarmerQuestion(question, langCode, context) {
  if (!API_KEY) {
    const error = new Error('LLM is not configured (missing ANTHROPIC_API_KEY)');
    error.statusCode = 503;
    throw error;
  }

  const languageName = langNames[langCode] || 'Hindi';

  const systemPrompt = `You are a voice assistant for KisanSetuAI, speaking on a phone call with a farmer.
Rules:
- Answer ONLY using the DATA provided below. Never invent numbers, times, or centre names.
- If the DATA doesn't contain what's needed to answer, say so plainly and suggest they contact their centre - do not guess.
- Respond in ${languageName} only, using natural spoken phrasing (this will be read aloud by text-to-speech).
- Keep it to 1-3 short sentences. No lists, no markdown, no punctuation that sounds odd when spoken aloud.

DATA:
${context ? JSON.stringify(context, null, 2) : 'No active token or profile data available for this farmer.'}`;

  try {
    const { data } = await axios.post(
      ANTHROPIC_URL,
      {
        model: MODEL,
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: question }]
      },
      {
        headers: {
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 12000
      }
    );

    const answer = data.content?.find(block => block.type === 'text')?.text;
    return (answer && answer.trim()) || "Sorry, I couldn't find an answer to that right now.";
  } catch (err) {
    console.error('LLM Service Error:', err.message);
    const error = new Error('Failed to generate an answer');
    error.statusCode = 502;
    throw error;
  }
}

module.exports = { answerFarmerQuestion };
