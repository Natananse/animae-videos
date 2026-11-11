import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {copyFileSync, existsSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {version, finalFile, reviews, reviewFile} from './delivery.mjs';

process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
execFileSync(process.execPath, ['scripts/make_sound_cues.mjs'], {stdio: 'inherit'});
execFileSync(process.env.PYTHON ?? 'python3', ['scripts/prepare_clear_audio.py'], {stdio: 'inherit'});
const master = `out/${version}_audio_master.wav`;
const signature = createHash('sha256');
for (const file of ['src/components/AudioMix.tsx', 'public/timing.json', 'public/music/bg.mp3',
  'public/audio/clear_master.wav', 'public/audio/clear_master.json',
  ...Array.from({length: 8}, (_, i) => `public/voice/scene${String(i + 1).padStart(2, '0')}.mp3`)]) {
  signature.update(readFileSync(file));
}
const inputHash = signature.digest('hex');
const cacheFile = `.cache/${version}_audio_master.json`;
const cached = existsSync(master) && existsSync(cacheFile) && JSON.parse(readFileSync(cacheFile, 'utf8')).inputHash === inputHash;
if (!cached) {
// AudioMix plays this exact offline master. Copying it preserves its 24-bit
// samples and does not launch a competing browser or re-quantize the audio.
copyFileSync('public/audio/clear_master.wav', master);
writeFileSync(cacheFile, JSON.stringify({inputHash, completedAt: new Date().toISOString()}, null, 2) + '\n');
} else console.log('Canonical audio master is cached.');
if (process.argv.includes('--master-only')) {
  console.log(`Prepared canonical audio master: ${master}`);
  process.exit(0);
}

const pictureHash = (file) => execFileSync('ffmpeg', ['-v', 'error', '-i', file,
  '-map', '0:v:0', '-c:v', 'copy', '-f', 'hash', '-hash', 'sha256', '-'], {encoding: 'utf8'}).trim();
const updated = [];
for (const [file, start, seconds] of [
  [finalFile, 0, 200], ...Object.entries(reviews).map(([mode, [start, end]]) => [reviewFile(mode), start, end - start]),
]) {
  if (!existsSync(file)) continue;
  const before = pictureHash(file);
  const temporary = file.replace('.mp4', '_audio_updated.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-ss', String(start), '-t', String(seconds), '-i', master,
    '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k',
    '-ar', '48000', '-movflags', '+faststart', temporary], {stdio: 'inherit'});
  if (pictureHash(temporary) !== before) throw new Error(`Picture packets changed during audio update: ${file}`);
  renameSync(temporary, file);
  updated.push({file, start, seconds, picturePacketSha256: before, pictureUnchanged: true});
}
writeFileSync(`out/${version}_audio_revision.json`, JSON.stringify({master,
  masterSha256: createHash('sha256').update(readFileSync(master)).digest('hex'),
  completedAt: new Date().toISOString(), updated}, null, 2) + '\n');
console.log(`Updated ${updated.length} audio streams; all picture packet hashes unchanged.`);
if (existsSync(finalFile)) {
  const {makePreview} = await import('./make_preview.mjs');
  makePreview();
}
