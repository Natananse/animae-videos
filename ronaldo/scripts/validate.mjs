import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {version, finalFile, previewFile, reviews, reviewFile} from './delivery.mjs';
process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const script = JSON.parse(fs.readFileSync('script/script.json', 'utf8'));
const timing = JSON.parse(fs.readFileSync('public/timing.json', 'utf8'));
const sync = JSON.parse(fs.readFileSync('public/sync.json', 'utf8'));
const normalized = (value) => value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const sha256 = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
let sentenceCount = 0;
let nativeWordCount = 0;
const words = script.scenes.map((s) => s.narration).join(' ').trim().split(/\s+/).length;
assert(words >= 300 && words <= 430, `Narration has ${words} words`);
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
  assert.equal(voiceManifest.audioSha256, sha256(`public/voice/${scene.id}.mp3`), `${scene.id}: stale voice manifest`);
  assert.equal(sync.audioSha256[scene.id], voiceManifest.audioSha256, `${scene.id}: stale sync audio fingerprint`);
  assert.deepEqual(scene.words, voiceManifest.words, `${scene.id}: timing differs from captured Edge boundaries`);
  assert(scene.words.every((word) => word.text.trim().split(/\s+/).length === 1), `${scene.id}: a native event groups multiple narration words`);
  const authored = script.scenes[i];
  assert.equal(scene.words.length, authored.narration.trim().split(/\s+/).length, `${scene.id}: native word count`);
  assert.equal(normalized(scene.words.map((word) => word.text).join(' ')), normalized(authored.narration), `${scene.id}: stale narration`);
  assert.equal(normalized(authored.sentences.map((sentence) => sentence.text).join(' ')), normalized(authored.narration), `${scene.id}: missing sentence`);
  const syncRows = sync.sentences.filter((sentence) => sentence.sceneId === scene.id);
  assert.equal(syncRows.length, authored.sentences.length, `${scene.id}: incomplete sync rows`);
  for (const [index, sentence] of authored.sentences.entries()) {
    const row = syncRows[index];
    assert.equal(row.id, sentence.id); assert.equal(row.text, sentence.text);
    assert.deepEqual(row.visual_cue, sentence.visual_cue, `${sentence.id}: stale visual cue`);
    for (const field of ['action', 'outfit', 'camera', 'start_word']) assert.equal(typeof sentence.visual_cue[field], 'string', `${sentence.id}: missing ${field}`);
    assert(Array.isArray(sentence.visual_cue.props), `${sentence.id}: missing props`);
    assert(normalized(sentence.text).includes(normalized(sentence.visual_cue.start_word)), `${sentence.id}: start_word missing from sentence`);
    assert(scene.words.some((word) => Math.abs(word.startMs / 1000 - row.keySeconds) < .00002), `${sentence.id}: cue not on captured word boundary`);
    assert(Math.abs(row.absoluteKeySeconds - (scene.from / 30 + row.keySeconds)) < .00002);
    assert.equal(row.years.length, sentence.year_cues.length, `${sentence.id}: missing numeric year card`);
    for (const year of row.years) assert(scene.words.some((word) => Math.abs(word.startMs / 1000 - year.startSeconds) < .00002), `${sentence.id}: year not on word boundary`);
  }
  sentenceCount += authored.sentences.length; nativeWordCount += scene.words.length;
  assert(authored.verify.every((v) => v.startsWith('VERIFY:')));
  end += scene.durationInFrames;
}
assert.equal(end, script.totalDuration * 30);
const last = timing.scenes.at(-1);
const lastVoice = last.from / 30 + last.speechRanges.at(-1).end;
assert(lastVoice <= script.totalDuration - 6, `Voice ends too late: ${lastVoice}`);
assert(!timing.scenes[4].speechRanges.some((r) => r.start < 19.1 && r.end > 11.8), 'Let the kick and reaction breathe');
assert(fs.statSync('public/music/bg.mp3').size < 50_000_000);
assert.equal(nativeWordCount, words);
assert.equal(sync.wordTimingAudit.nativeWordBoundaries, words);
assert.equal(sync.wordTimingAudit.narrationWords, words);
assert.equal(sync.wordTimingAudit.allBoundariesSingleWord, true);
assert.equal(sync.sentences.length, sentenceCount);
const authoredYears = script.scenes.flatMap((scene) => scene.sentences.flatMap((sentence) => sentence.year_cues));
assert.equal(sync.yearEvents.length, authoredYears.length);
assert.equal(sync.yearEvents.length, 21);
assert.equal(sync.trophyEvents.length, 19);
assert.equal(sync.trophyEvents.reduce((sum, event) => sum + event.count, 0), 15);
assert.equal(sync.trophyEvents.filter((event) => event.count === 0).length, 4);
assert.deepEqual(sync.trophyEvents.filter((event) => event.year === 2008 && event.count > 0).map((event) => event.kind).sort(),
  ['ballon-dor', 'champions-league', 'fifa-player', 'premier-league']);
assert.deepEqual(sync.trophyEvents.filter((event) => event.kind === 'ballon-dor' && event.count > 0).map((event) => event.year), [2008, 2013, 2014, 2016, 2017]);
assert.deepEqual(sync.trophyEvents.filter((event) => event.kind === 'champions-league' && event.count > 0).map((event) => event.year), [2008, 2014, 2016, 2017, 2018]);
assert.deepEqual(sync.trophyEvents.filter((event) => event.kind === 'nations-league' && event.count > 0).map((event) => event.year), [2019, 2025]);
assert.equal(sync.trophyEvents.find((event) => event.kind === 'euro').year, 2016);
const sourceOnly = process.argv.includes('--source-only');
const report = {sourcePassed: true, sourceOnly, words, nativeWordBoundaries: nativeWordCount, sentenceCues: sentenceCount, yearCues: sync.yearEvents.length,
  trophyEvents: sync.trophyEvents.length, namedTrophies: 15, totalFrames: end, finalNarrationEnds: lastVoice, renders: []};
const targets = [[finalFile, 1920, 1080, 30, script.totalDuration],
  [previewFile, 960, 540, 15, script.totalDuration],
  ...Object.entries(reviews).map(([mode, [start, end]]) => [reviewFile(mode), 960, 540, 30, end - start])];
if (process.argv.includes('--require-final')) assert(fs.existsSync(finalFile), 'Final video is missing');
for (const [file, width, height, fps, seconds] of sourceOnly ? [] : targets) {
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
