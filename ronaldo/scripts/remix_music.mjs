import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {copyFileSync, existsSync, readFileSync, writeFileSync, renameSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {version, finalFile, previewFile, manifestFile} from './delivery.mjs';

process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const option = (name, fallback) => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const originalFinal = option('video');
const originalPreview = option('preview-video');
if (!originalFinal || !originalPreview) {
  throw new Error('The score is baked into the clear master. Use npm run audio:update for current exports. '
    + 'The legacy remux tool requires explicit --video=... and --preview-video=... sources.');
}
if (path.resolve(originalFinal) === path.resolve(finalFile) || path.resolve(originalPreview) === path.resolve(previewFile)) {
  throw new Error('Music-only export must use separate output filenames to preserve its source videos.');
}
// An explicit source is still insufficient authorization to replace a newer
// picture export with older picture packets. This helper only creates outputs.
for (const target of [finalFile, previewFile]) {
  if (existsSync(target)) throw new Error(`Refusing to replace an existing export: ${target}. Use audio:update.`);
}
for (const file of [originalFinal, originalPreview]) {
  if (!existsSync(file)) throw new Error(`Music-only remix requires the preserved input: ${file}`);
}
execFileSync(process.execPath, ['scripts/make_sound_cues.mjs'], {stdio: 'inherit'});
execFileSync(process.env.PYTHON ?? 'python3', ['scripts/prepare_clear_audio.py'], {stdio: 'inherit'});
const digest = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const dryFiles = ['public/timing.json', 'public/audio/clear_master.wav', 'public/audio/clear_master.json',
  ...Array.from({length: 8}, (_, i) => ['mp3', 'json'].map(ext => `public/voice/scene${String(i + 1).padStart(2, '0')}.${ext}`)).flat()];
const dryBefore = Object.fromEntries(dryFiles.map(file => [file, digest(file)]));
const frozenMusic = Object.fromEntries(['public/music/bg.mp3', 'public/music/license.json',
  'src/components/AudioMix.tsx'].map(file => [file, digest(file)]));
const originalFiles = Object.fromEntries([originalFinal, originalPreview].map(file => [file, digest(file)]));
const timing = JSON.parse(readFileSync('public/timing.json', 'utf8'));
if (timing.totalFrames !== 6000 || timing.fps !== 30) throw new Error('Expected the unchanged 200-second v3 timing.');
const music = JSON.parse(readFileSync('public/music/license.json', 'utf8'));
const audioSignature = createHash('sha256');
for (const file of ['src/components/AudioMix.tsx', 'public/music/bg.mp3', ...dryFiles]) audioSignature.update(readFileSync(file));
const audioSourceHash = audioSignature.digest('hex');
const master = `out/${version}_audio_master.wav`;
const started = Date.now();
console.log('Copying the verified clear audio master; narration is not regenerated.');
copyFileSync('public/audio/clear_master.wav', master);
const pictureHash = file => execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-map', '0:v:0', '-c:v', 'copy',
  '-f', 'hash', '-hash', 'sha256', '-'], {encoding: 'utf8'}).trim();
const updated = [];
for (const [source, target, audio, encode, frames, fps, width, height, mode] of [
  [originalFinal, finalFile, master, true, 6000, 30, 1920, 1080, 'final'],
  [originalPreview, previewFile, finalFile, false, null, null, null, null, 'preview'],
]) {
  const before = pictureHash(source);
  const temporary = target.replace('.mp4', '_incoming.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', source, '-i', audio, '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', ...(encode ? ['-c:a', 'aac', '-b:a', '320k', '-ar', '48000'] : ['-c:a', 'copy']),
    '-movflags', '+faststart', temporary], {stdio: 'inherit'});
  if (pictureHash(temporary) !== before) throw new Error(`Picture stream changed: ${target}`);
  const meta = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', temporary], {encoding: 'utf8'}));
  const v = meta.streams.find(s => s.codec_type === 'video');
  const a = meta.streams.find(s => s.codec_type === 'audio');
  const sourceMeta = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', source], {encoding: 'utf8'}));
  const sourceVideo = sourceMeta.streams.find(s => s.codec_type === 'video');
  if (v.width !== (width ?? sourceVideo.width) || v.height !== (height ?? sourceVideo.height)
      || v.r_frame_rate !== (fps === null ? sourceVideo.r_frame_rate : `${fps}/1`)
      || Number(v.nb_frames) !== (frames ?? Number(sourceVideo.nb_frames))
      || v.codec_name !== 'h264' || a.codec_name !== 'aac' || Math.abs(Number(meta.format.duration) - 200) > .05
      || Number(v.start_time) !== 0 || Number(a.start_time) !== 0) throw new Error(`Invalid remux timing/format: ${target}`);
  renameSync(temporary, target);
  const record = {mode, outputLocation: target, pictureCopiedFrom: source, picturePacketSha256: before, pictureUnchanged: true,
    audioSourceHash, music: music.title, fps: Number(v.r_frame_rate.split('/')[0]) / Number(v.r_frame_rate.split('/')[1]),
    width: v.width, height: v.height, durationInFrames: Number(v.nb_frames), durationSeconds: 200,
    method: 'Audio-only remux; original encoded picture packets copied without re-encoding', completedAt: new Date().toISOString()};
  writeFileSync(manifestFile(mode), JSON.stringify(record, null, 2) + '\n');
  updated.push(record);
  console.log(`Verified unchanged picture: ${target}`);
}
for (const [file, before] of Object.entries({...dryBefore, ...frozenMusic, ...originalFiles})) {
  if (digest(file) !== before) throw new Error(`Preserved input was modified: ${file}`);
}
writeFileSync(`out/${version}_audio_revision.json`, JSON.stringify({music, master, audioSourceHash,
  masterSha256: digest(master), inputsUnchangedDuringExport: true, dryInputHashes: dryBefore,
  frozenMusicHashes: frozenMusic,
  originalVideosUnchanged: true, originalFileHashes: originalFiles, updated,
  elapsedSeconds: (Date.now() - started) / 1000}, null, 2) + '\n');
console.log('Audio-only export complete: picture packets, narration, music and timing preserved during export.');
