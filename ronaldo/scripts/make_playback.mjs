import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, renameSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {version, finalFile, playbackFile} from './delivery.mjs';
process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const probe = file => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], {encoding: 'utf8'}));
const meta = probe(finalFile), source = meta.streams.find(s => s.codec_type === 'video');
if (source.width !== 1920 || source.height !== 1080 || source.r_frame_rate !== '30/1' || Number(source.nb_frames) !== 6000)
  throw new Error('The 720p delivery must be derived from the current native 1080p/30 final.');
const before = createHash('sha256').update(readFileSync(finalFile)).digest('hex');
const master = 'public/audio/clear_master.wav';
const masterInfo = JSON.parse(readFileSync('public/audio/clear_master.json', 'utf8'));
const nativeInfo = JSON.parse(readFileSync(`out/${version}_final_render.json`, 'utf8'));
const masterHash = createHash('sha256').update(readFileSync(master)).digest('hex');
if (masterHash !== masterInfo.masterSha256 || nativeInfo.audioMasterSha256 !== masterHash)
  throw new Error('The playback audio master must match the native final master.');
const incoming = playbackFile.replace('.mp4', '_incoming.mp4');
const started = Date.now();
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', finalFile, '-i', master,
  '-map', '0:v:0', '-map', '1:a:0', '-map_metadata', '-1',
  '-vf', 'scale=1280:720:flags=lanczos,setsar=1', '-r', '30',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '21', '-profile:v', 'baseline', '-level:v', '3.1',
  '-pix_fmt', 'yuv420p', '-bf', '0', '-refs', '2', '-g', '30', '-keyint_min', '30', '-sc_threshold', '0',
  '-maxrate', '2M', '-bufsize', '4M', '-colorspace', 'bt709', '-color_primaries', 'bt709',
  '-color_trc', 'bt709', '-color_range', 'tv', '-video_track_timescale', '90000',
  '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', incoming], {stdio: 'inherit'});
const output = probe(incoming), v = output.streams.find(s => s.codec_type === 'video');
if (v.width !== 1280 || v.height !== 720 || v.r_frame_rate !== '30/1' || Number(v.nb_frames) !== 6000 ||
  v.pix_fmt !== 'yuv420p' || v.color_space !== 'bt709' || v.color_range !== 'tv' || Math.abs(Number(output.format.duration) - 200) > .05)
  throw new Error('720p playback format/duration check failed.');
if (createHash('sha256').update(readFileSync(finalFile)).digest('hex') !== before) throw new Error('Native final changed.');
renameSync(incoming, playbackFile);
writeFileSync(`out/${version}_720p_render.json`, JSON.stringify({outputLocation: playbackFile,
  derivedFrom: finalFile, nativeSourceSha256: before, audioMasterSha256: masterHash, width: 1280, height: 720, fps: 30, durationInFrames: 6000,
  durationSeconds: 200, profile: 'baseline', level: '3.1', pixelFormat: 'yuv420p', colorSpace: 'bt709',
  maximumVideoRate: '2M', maximumKeyframeSeconds: 1, audioBitrate: '192k', faststart: true,
  method: 'Native final downscaled to 720p; every source frame retained. No interpolation or held-frame conversion.',
  bytes: Number(output.format.size), elapsedSeconds: (Date.now() - started) / 1000, completedAt: new Date().toISOString()}, null, 2) + '\n');
console.log(`Playback-friendly 720p export: ${playbackFile}`);
