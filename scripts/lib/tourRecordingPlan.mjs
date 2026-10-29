import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
export const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const moduleUrl = text => `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
export async function buildRecordingPlan(repo) {
  const read = rel => fs.readFile(path.join(repo, rel), 'utf8');
  const nav = moduleUrl(await read('src/config/navigation.js'));
  const sections = moduleUrl(await read('src/config/platformTourSections.js'));
  const config = (await read('src/config/platformTourSteps.js'))
    .replace('"./navigation"', JSON.stringify(nav))
    .replace('"./platformTourSections"', JSON.stringify(sections));
  const pageSource = (await read('src/config/unifiedPlatformTour.js'))
    .replace("'./platformTourSteps'", JSON.stringify(moduleUrl(config)));
  const { getUnifiedTourPages } = await import(moduleUrl(pageSource));
  const { sectionNarration, splitNarration } = await import(moduleUrl(await read('src/lib/unifiedTourPlayback.js')));
  const { recordingInput } = await import(moduleUrl(await read('src/lib/tourRecordingSpec.js')));
  const recordings = new Map(); let pages = 0;
  const add = text => {
    for (const chunk of splitNarration(text)) {
      const input = recordingInput(chunk); const id = hash(JSON.stringify(input));
      if (!recordings.has(id)) recordings.set(id, { id, input });
    }
  };
  for (const mode of ['platform', 'admin']) {
    for (const page of getUnifiedTourPages(mode)) {
      pages++;
      // Visibility and ordering affect transitions and the last-section summary.
      // Enumerate the exact existing wording variants rather than changing copy.
      for (const segment of page.segments) {
        if (!segment.sectionDetail) {
          add(sectionNarration(segment, 0, 1, page.value));
          add(sectionNarration(segment, 0, 2, page.value));
        } else {
          for (const index of [1, 2, 3, 4]) {
            add(sectionNarration(segment, index, index + 1, page.value));
            add(sectionNarration(segment, index, index + 2, page.value));
          }
        }
      }
    }
  }
  const clips = [...recordings.values()].sort((a,b) => a.id.localeCompare(b.id));
  return { version: 1, plan: hash(JSON.stringify(clips)), page_entries: pages, clips };
}
export function validAudio(bytes) {
  return bytes.length >= 32 && (bytes.subarray(0,3).toString() === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224));
}
export async function inspectRecordings(plan, directory) {
  const existing = []; const missing = []; const invalid = [];
  for (const clip of plan.clips) {
    const file = path.join(directory, `${clip.id}.mp3`);
    try {
      const bytes = await fs.readFile(file);
      if (!validAudio(bytes)) { invalid.push(clip.id); continue; }
      existing.push({ id: clip.id, bytes: bytes.length, sha256: hash(bytes) });
    } catch (error) { if (error.code === 'ENOENT') missing.push(clip.id); else throw error; }
  }
  return { existing, missing, invalid };
}
// Paid requests only occur when called by the explicit --apply CLI branch.
export async function generateRecordings({ plan, directory, key, maxNew, fetchImpl = fetch, signal, onSaved = () => {} }) {
  const state = await inspectRecordings(plan, directory);
  if (state.invalid.length) throw new Error('Invalid existing recording; restore/review it before generation.');
  const needed = new Set(state.missing); let generated = 0;
  await fs.mkdir(directory, { recursive: true });
  for (const clip of plan.clips) {
    if (!needed.has(clip.id)) continue;
    if (generated >= maxNew) break;
    const { text, voice, model, style } = clip.input;
    const response = await fetchImpl('https://api.openai.com/v1/audio/speech', {
      method: 'POST', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(60000)]) : AbortSignal.timeout(60000),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, voice, input: text, instructions: style, response_format: 'mp3' }),
    });
    if (!response.ok) {
      let code = 'VOICE_GENERATION_FAILED';
      try { const body = await response.json(); if (/^[a-z0-9_]+$/i.test(body.error?.code || '')) code = body.error.code; } catch {}
      throw new Error(`Generation stopped: HTTP ${response.status}, ${code}. Saved clips preserved; no automatic retries.`);
    }
    if (!String(response.headers.get('content-type') || '').startsWith('audio/')) throw new Error('Generation returned non-audio content.');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 10 * 1024 * 1024 || !validAudio(bytes)) throw new Error('Generation returned invalid audio.');
    const file = path.join(directory, `${clip.id}.mp3`); const temp = `${file}.${process.pid}.tmp`;
    try { await fs.writeFile(temp, bytes, { flag: 'wx' }); await fs.rename(temp, file); }
    finally { await fs.rm(temp, { force: true }); }
    generated++; onSaved(generated);
  }
  return generated;
}
