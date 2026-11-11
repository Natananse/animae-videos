import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, selectComposition} from '@remotion/renderer';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync, writeFileSync, renameSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {version, finalFile, previewFile, manifestFile} from './delivery.mjs';

process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const option = (name, fallback) => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const originalFinal = option('video', 'out/ronaldo_emotional_v3.mp4');
const originalPreview = option('preview-video', 'out/ronaldo_emotional_v3_preview.mp4');
if (path.resolve(originalFinal) === path.resolve(finalFile) || path.resolve(originalPreview) === path.resolve(previewFile)) {
  throw new Error('Music-only export must use separate output filenames to preserve its source videos.');
}
for (const file of [originalFinal, originalPreview, 'public/sfx/action_mix.wav']) {
  if (!existsSync(file)) throw new Error(`Music-only remix requires the preserved input: ${file}`);
}
const digest = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const dryFiles = ['public/timing.json', 'public/sfx/action_mix.wav',
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
console.log('Rendering the audio-only revision; narration is not regenerated.');
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public'),
  outDir: path.resolve('.render/music-only-bundle')});
const browser = await openBrowser('chrome', {browserExecutable: process.env.BROWSER_EXECUTABLE ?? '/usr/bin/google-chrome',
  chromiumOptions: {gl: process.env.CHROMIUM_GL ?? 'angle'}, chromeMode: 'chrome-for-testing'});
try {
  const composition = await selectComposition({serveUrl, id: 'RonaldoAudio', puppeteerInstance: browser});
  await renderMedia({serveUrl, composition, puppeteerInstance: browser, codec: 'wav', audioCodec: 'pcm-16',
    sampleRate: 48000, outputLocation: master, concurrency: 1, overwrite: true,
    timeoutInMilliseconds: 120000, logLevel: 'warn'});
} finally {await browser.close({silent: true});}
const pictureHash = file => execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-map', '0:v:0', '-c:v', 'copy',
  '-f', 'hash', '-hash', 'sha256', '-'], {encoding: 'utf8'}).trim();
const updated = [];
for (const [source, target, audio, encode, frames, fps, width, height, mode] of [
  [originalFinal, finalFile, master, true, 6000, 30, 1920, 1080, 'final'],
  [originalPreview, previewFile, finalFile, false, 3000, 15, 960, 540, 'preview'],
]) {
  const before = pictureHash(source);
  const temporary = target.replace('.mp4', '_incoming.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', source, '-i', audio, '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', ...(encode ? ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000'] : ['-c:a', 'copy']),
    '-movflags', '+faststart', temporary], {stdio: 'inherit'});
  if (pictureHash(temporary) !== before) throw new Error(`Picture stream changed: ${target}`);
  const meta = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', temporary], {encoding: 'utf8'}));
  const v = meta.streams.find(s => s.codec_type === 'video');
  const a = meta.streams.find(s => s.codec_type === 'audio');
  if (v.width !== width || v.height !== height || v.r_frame_rate !== `${fps}/1` || Number(v.nb_frames) !== frames
      || v.codec_name !== 'h264' || a.codec_name !== 'aac' || Math.abs(Number(meta.format.duration) - 200) > .05
      || Number(v.start_time) !== 0 || Number(a.start_time) !== 0) throw new Error(`Invalid remux timing/format: ${target}`);
  renameSync(temporary, target);
  const record = {mode, outputLocation: target, pictureCopiedFrom: source, picturePacketSha256: before, pictureUnchanged: true,
    audioSourceHash, music: music.title, fps, width, height, durationInFrames: frames, durationSeconds: 200,
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
