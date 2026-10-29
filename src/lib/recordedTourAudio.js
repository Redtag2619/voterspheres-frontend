import { recordingIdentity } from './tourRecordingSpec';
import hosting from '../config/tourAudioHosting.json';

// Playback is static-file-only. A missing recording never triggers generation.
export async function loadRecordedTourAudio(text, signal, {
  fetchImpl = globalThis.fetch, cryptoImpl = globalThis.crypto,
  baseUrl = '/', audioBaseUrl = hosting.base_url || '', createObjectURL = blob => URL.createObjectURL(blob),
} = {}) {
  const bytes = new TextEncoder().encode(recordingIdentity(text));
  const digest = await cryptoImpl.subtle.digest('SHA-256', bytes);
  const id = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  if (audioBaseUrl) {
    const remote = new URL(audioBaseUrl);
    if (remote.protocol !== 'https:' || !remote.hostname.endsWith('.public.blob.vercel-storage.com') || remote.username || remote.password || remote.pathname !== '/' || remote.search || remote.hash) throw new Error('Invalid saved tour audio host.');
  }
  const base = (audioBaseUrl || baseUrl).replace(/\/?$/, '/');
  const response = await fetchImpl(`${base}tour-audio/${id}.mp3`, { method: 'GET', signal, cache: 'force-cache' });
  if (!response.ok || !String(response.headers.get('content-type') || '').startsWith('audio/')) {
    throw new Error('Saved tour recording is missing or invalid. Run the recording verifier before deployment.');
  }
  const blob = await response.blob();
  if (!blob.size) throw new Error('Saved tour recording is empty.');
  if (signal?.aborted) throw new DOMException('Tour playback cancelled', 'AbortError');
  return createObjectURL(blob);
}
