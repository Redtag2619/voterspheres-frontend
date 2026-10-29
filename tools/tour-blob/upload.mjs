import fs from 'node:fs/promises';
import path from 'node:path';
import { inspectLocal, uploadAudio } from './uploadCore.mjs';
const args = process.argv.slice(2);
const option = name => args.find(a => a.startsWith(`--${name}=`))?.slice(name.length + 3);
let lock;
try {
  const allowed = /^(--apply|--verify|--plan=[a-f0-9]{64}|--max-files=\d+|--audio-dir=.+)$/;
  if (args.some(a => !allowed.test(a)) || (args.includes('--apply') && args.includes('--verify'))) throw new Error('Unknown/conflicting upload options.');
  const apply = args.includes('--apply'); const verifyOnly = args.includes('--verify');
  const directory = path.resolve(option('audio-dir') || 'public/tour-audio');
  const local = await inspectLocal(directory);
  const maxFiles = Number(option('max-files') || 200);
  if (!Number.isSafeInteger(maxFiles) || maxFiles < 1 || maxFiles > 5000) throw new Error('max-files must be 1–5000.');
  if (!apply && !verifyOnly) {
    console.log(JSON.stringify({ ok: true, mode: 'preview', upload_plan: local.uploadPlan, clips: local.manifest.clips.length,
      audio_mib: Number((local.manifest.clips.reduce((n,c) => n+c.bytes,0)/1048576).toFixed(2)), max_files: maxFiles,
      policy: 'Local checksums verified. No network calls, uploads, generation, or configuration writes.' }, null, 2));
  } else {
    if (apply && option('plan') !== local.uploadPlan) throw new Error('Apply requires the matching reviewed --plan=<upload_plan>.');
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) throw new Error('BLOB_READ_WRITE_TOKEN missing. Enter it privately through Upload-TourAudio.ps1.');
    lock = path.join(directory, '.blob-upload.lock');
    try { await fs.writeFile(lock, String(process.pid), { flag: 'wx' }); }
    catch { lock = undefined; throw new Error('Upload lock exists; check for another active uploader.'); }
    const { list, put } = await import('@vercel/blob');
    const result = await uploadAudio({ local, directory, token, list, put, maxFiles, verifyOnly,
      onProgress: progress => { if (progress.verified % 25 === 0 || progress.verified === progress.total) console.log(JSON.stringify(progress)); } });
    if (result.complete) {
      const target = path.resolve('src/config/tourAudioHosting.json');
      const temp = `${target}.upload.tmp`;
      await fs.writeFile(temp, JSON.stringify({ ...result.hosting, verified_at: new Date().toISOString() }, null, 2) + '\n');
      await fs.rename(temp, target);
    }
    console.log(JSON.stringify({ ok: true, mode: verifyOnly ? 'remote-verified' : 'uploaded', ...result,
      policy: result.complete ? 'All remote audio checksums match. Playback configuration saved locally. No deployment or OpenAI calls.' : 'Partial upload preserved. Run the same command to resume. Configuration unchanged.' }, null, 2));
  }
} catch (error) {
  // SDK errors may contain request details. Print only safe, local errors.
  const safe = /^(Invalid|Local|Remote|Unexpected|Mixed|Apply|BLOB_|Upload lock|Unknown|max-files|Duplicate)/.test(error.message || '');
  console.error(JSON.stringify({ ok: false, error: safe ? error.message : 'Blob upload interrupted. Saved objects remain; verify the store token/network and resume.', error_type: error.name }));
  process.exitCode = 1;
} finally { if (lock) await fs.rm(lock, { force: true }); }
