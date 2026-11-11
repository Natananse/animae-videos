import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {version, finalFile, previewFile, reviews, reviewFile} from './delivery.mjs';
process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const script = JSON.parse(fs.readFileSync('script/script.json', 'utf8'));
const timing = JSON.parse(fs.readFileSync('public/timing.json', 'utf8'));
const words = script.scenes.map((s) => s.narration).join(' ').trim().split(/\s+/).length;
assert(words >= 350 && words <= 430, `Narration has ${words} words`);
assert.equal(words, script.wordCount);
assert.equal(timing.totalFrames, script.totalDuration * 30);
assert.equal(timing.fps, 30);
assert.equal(timing.scenes.length, 8);
let end = 0;
for (const [i, scene] of timing.scenes.entries()) {
  assert.equal(scene.id, script.scenes[i].id);
  assert.equal(scene.from, end);
  assert(scene.words.length > 0);
  assert(scene.voiceFrom >= 0);
  assert(scene.voiceFrom + scene.voiceDuration * 30 <= scene.durationInFrames + 2);
  assert(scene.speechRanges.length > 0);
  let speechEnd = 0;
  for (const range of scene.speechRanges) {
    assert(range.start >= speechEnd && range.end > range.start);
    assert(range.end <= scene.durationInFrames / 30);
    speechEnd = range.end;
  }
  let last = -1;
  for (const word of scene.words) {
    assert(word.startMs >= last && word.endMs > word.startMs);
    assert(word.endMs <= scene.voiceDuration * 1000 + 30);
    last = word.startMs;
  }
  const metadata = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_format', '-of', 'json', `public/voice/${scene.id}.mp3`], {encoding: 'utf8'}));
  assert(Math.abs(Number(metadata.format.duration) - scene.voiceDuration) < .05);
  const voiceManifest = JSON.parse(fs.readFileSync(`public/voice/${scene.id}.json`, 'utf8'));
  assert(!('tempo' in voiceManifest), 'Revised speech must use native delivery, without stretching');
  assert(script.scenes[i].verify.every((v) => v.startsWith('VERIFY:')));
  end += scene.durationInFrames;
}
assert.equal(end, script.totalDuration * 30);
const last = timing.scenes.at(-1);
const lastVoice = last.from / 30 + last.speechRanges.at(-1).end;
assert(lastVoice <= script.totalDuration - 6, `Voice ends too late: ${lastVoice}`);
assert(!timing.scenes[4].speechRanges.some((r) => r.start < 19.1 && r.end > 11.8), 'Let the kick and reaction breathe');
assert(fs.statSync('public/music/bg.mp3').size < 50_000_000);
const report = {sourcePassed: true, words, totalFrames: end, finalNarrationEnds: lastVoice, renders: []};
const targets = [[finalFile, 1920, 1080, 30, script.totalDuration],
  [previewFile, 960, 540, 15, script.totalDuration],
  ...Object.entries(reviews).map(([mode, [start, end]]) => [reviewFile(mode), 960, 540, 30, end - start])];
if (process.argv.includes('--require-final')) assert(fs.existsSync(finalFile), 'Final video is missing');
for (const [file, width, height, fps, seconds] of targets) {
  if (!fs.existsSync(file)) continue;
  const meta = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], {encoding: 'utf8'}));
  const video = meta.streams.find((s) => s.codec_type === 'video');
  const audio = meta.streams.find((s) => s.codec_type === 'audio');
  assert.equal(video.width, width); assert.equal(video.height, height);
  assert.equal(video.codec_name, 'h264'); assert.equal(video.r_frame_rate, `${fps}/1`);
  const frames = seconds * fps;
  assert.equal(Number(video.nb_frames), frames); assert.equal(audio.codec_name, 'aac');
  assert(Math.abs(Number(meta.format.duration) - seconds) < .08);
  execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], {stdio: ['ignore', 'pipe', 'pipe']});
  report.renders.push({file, passed: true, width, height, fps, frames, duration: meta.format.duration});
}
fs.mkdirSync('out', {recursive: true});
fs.writeFileSync(`out/${version}_validation.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
