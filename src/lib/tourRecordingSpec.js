// Exact voice settings from the approved tour. Changing these creates new files.
export const TOUR_VOICE_SPEC = Object.freeze({
  voice: 'marin',
  model: 'gpt-4o-mini-tts',
  style: 'Speak as a warm, natural, confident female enterprise product specialist. Use lifelike conversational American pacing, subtle emotional warmth, natural sentence rhythm, and short pauses between ideas. Sound polished and human, never robotic, rushed, theatrical, or excessively enthusiastic.',
});
export function recordingInput(text) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized || normalized.length > 1700) throw new Error('Invalid recorded tour segment length.');
  return { text: normalized, ...TOUR_VOICE_SPEC };
}
export function recordingIdentity(text) { return JSON.stringify(recordingInput(text)); }
