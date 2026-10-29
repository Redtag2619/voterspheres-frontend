import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
export const hash = value => crypto.createHash('sha256').update(value).digest('hex');
export function publicOrigin(value) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || !u.hostname.endsWith('.public.blob.vercel-storage.com') || u.username || u.password || u.search || u.hash) throw new Error('Unexpected public Blob URL.');
  return u.origin;
}
export async function inspectLocal(directory) {
  const raw = await fs.readFile(path.join(directory, 'manifest.json'));
  const manifest = JSON.parse(raw);
  if (manifest.version !== 1 || !/^[a-f0-9]{64}$/.test(manifest.plan || '') || !Array.isArray(manifest.clips) || !manifest.clips.length) throw new Error('Invalid audio manifest. Run the existing recording verifier.');
  const seen = new Set();
  for (const clip of manifest.clips) {
    if (!/^[a-f0-9]{64}$/.test(clip.id) || !/^[a-f0-9]{64}$/.test(clip.sha256) || !Number.isSafeInteger(clip.bytes) || clip.bytes < 32 || seen.has(clip.id)) throw new Error('Invalid/duplicate audio manifest entry.');
    seen.add(clip.id);
    const bytes = await fs.readFile(path.join(directory, `${clip.id}.mp3`));
    if (bytes.length !== clip.bytes || hash(bytes) !== clip.sha256) throw new Error(`Local checksum mismatch: ${clip.id}.mp3`);
  }
  const manifestHash = hash(raw);
  return { manifest, manifestHash, uploadPlan: hash(JSON.stringify({ manifestHash, prefix: 'tour-audio/' })) };
}
export async function readRemote(list, token) {
  const map = new Map(); const cursors = new Set(); let cursor;
  do {
    const result = await list({ prefix: 'tour-audio/', limit: 1000, token, ...(cursor ? { cursor } : {}), abortSignal: AbortSignal.timeout(60000) });
    for (const item of result.blobs) {
      if (map.has(item.pathname)) throw new Error('Duplicate remote pathname.');
      publicOrigin(item.url); map.set(item.pathname, item);
    }
    cursor = result.hasMore ? result.cursor : undefined;
    if (result.hasMore && (!cursor || cursors.has(cursor))) throw new Error('Remote listing cursor did not advance.');
    if (cursor) cursors.add(cursor);
  } while (cursor);
  return map;
}
export async function uploadAudio({ local, directory, token, list, put, maxFiles, verifyOnly = false, fetchImpl = fetch, onProgress = () => {} }) {
  const remote = await readRemote(list, token);
  let uploaded = 0; let verified = 0; let origin;
  for (const clip of local.manifest.clips) {
    const pathname = `tour-audio/${clip.id}.mp3`;
    let blob = remote.get(pathname);
    if (!blob) {
      if (verifyOnly) throw new Error('Remote audio incomplete. No configuration written.');
      if (uploaded >= maxFiles) continue;
      const bytes = await fs.readFile(path.join(directory, `${clip.id}.mp3`));
      if (hash(bytes) !== clip.sha256) throw new Error('Local audio changed after preview.');
      blob = await put(pathname, bytes, { access: 'public', token, addRandomSuffix: false, allowOverwrite: false,
        contentType: 'audio/mpeg', cacheControlMaxAge: 31536000, abortSignal: AbortSignal.timeout(90000) });
      uploaded++;
    }
    const currentOrigin = publicOrigin(blob.url);
    if (origin && origin !== currentOrigin) throw new Error('Mixed Blob store origins.');
    origin = currentOrigin;
    if (new URL(blob.url).pathname !== `/${pathname}`) throw new Error('Remote filename changed. Upload stopped.');
    const response = await fetchImpl(blob.url, { method: 'GET', signal: AbortSignal.timeout(90000) });
    if (!response.ok || !String(response.headers.get('content-type') || '').startsWith('audio/')) throw new Error('Remote audio unavailable or incorrect content type.');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length !== clip.bytes || hash(bytes) !== clip.sha256) throw new Error('Remote checksum mismatch. Existing object was not overwritten.');
    verified++; onProgress({ uploaded_this_run: uploaded, verified, total: local.manifest.clips.length });
  }
  return { uploaded, verified, total: local.manifest.clips.length, complete: verified === local.manifest.clips.length,
    hosting: { version: 1, base_url: origin || '', plan: local.manifest.plan, manifest_sha256: local.manifestHash, verified_clips: verified } };
}
