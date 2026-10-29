import fs from 'node:fs/promises';
import path from 'node:path';
import { buildRecordingPlan, inspectRecordings, generateRecordings } from './lib/tourRecordingPlan.mjs';
const args = process.argv.slice(2);
const value = name => args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const allowed = /^(--apply|--verify|--plan=[a-f0-9]{64}|--max-new-clips=\d+|--key-env-file=.+)$/;
let lock;
try {
  if (args.some(arg => !allowed.test(arg)) || (args.includes('--apply') && args.includes('--verify'))) throw new Error('Unknown/conflicting options. Preview is default.');
  const apply = args.includes('--apply'); const verify = args.includes('--verify');
  const maxNew = Number(value('max-new-clips') || '100');
  if (!Number.isSafeInteger(maxNew) || maxNew < 1 || maxNew > 500) throw new Error('max-new-clips must be 1–500.');
  const repo = process.cwd(); const directory = path.join(repo, 'public/tour-audio');
  const plan = await buildRecordingPlan(repo);
  const state = await inspectRecordings(plan, directory);
  if (apply) {
    if (value('plan') !== plan.plan) throw new Error('Apply requires the matching reviewed --plan=<hash>. No paid requests made.');
    if (value('key-env-file')) process.loadEnvFile(path.resolve(value('key-env-file')));
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY missing. Use a local environment or --key-env-file=<backend .env path>; never commit the key.');
    await fs.mkdir(directory, { recursive: true });
    lock = path.join(directory, '.recording.lock');
    try { await fs.writeFile(lock, String(process.pid), { flag: 'wx' }); }
    catch (error) { lock = undefined; throw new Error('Recording lock exists. Ensure no recording process is active before reviewing a stale lock.'); }
    const generated = await generateRecordings({ plan, directory, key, maxNew,
      signal: AbortSignal.timeout(60 * 60 * 1000),
      onSaved: number => console.log(JSON.stringify({ saved_this_run: number, limit: maxNew })),
    });
    const after = await inspectRecordings(plan, directory);
    console.log(JSON.stringify({ ok: true, mode: 'recording', plan: plan.plan, generated, missing: after.missing.length,
      policy: 'Existing valid clips were reused. Re-run the reviewed command to continue if missing > 0. Run --verify before deployment.' }, null, 2));
  } else if (verify) {
    if (state.missing.length || state.invalid.length) throw new Error(`Recordings incomplete: ${state.missing.length} missing, ${state.invalid.length} invalid. Do not deploy static playback yet.`);
    await fs.writeFile(path.join(directory, 'manifest.json'), JSON.stringify({ version: 1, plan: plan.plan, clips: state.existing }, null, 2));
    console.log(JSON.stringify({ ok: true, mode: 'verified', clips: state.existing.length,
      audio_mib: Number((state.existing.reduce((sum, clip) => sum + clip.bytes, 0) / 1048576).toFixed(2)), policy: 'No API requests. Manifest records exact audio checksums.' }, null, 2));
  } else {
    console.log(JSON.stringify({ ok: true, mode: 'preview', plan: plan.plan, required_clips: plan.clips.length,
      existing: state.existing.length, missing: state.missing.length, invalid: state.invalid.length,
      total_text_characters: plan.clips.reduce((sum, clip) => sum + clip.input.text.length, 0),
      max_new_clips_per_apply: maxNew,
      policy: 'No writes, no API calls, no charges. Includes exact wording variants for hidden/reordered sections and both existing tour modes. Missing audio requires paid one-time generation; no generation during playback.' }, null, 2));
  }
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error.message })); process.exitCode = 1;
} finally { if (lock) await fs.rm(lock, { force: true }); }
