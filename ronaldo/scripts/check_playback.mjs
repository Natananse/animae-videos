#!/usr/bin/env node
// Decode the delivered file, rather than inferring playback quality from the
// source composition. Animated film grain is deliberately excluded from the
// render-side pose check: changing noise must not disguise a locked character.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createReadStream} from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const options = new Map(process.argv.slice(2).map(arg => {
  const split = arg.indexOf('=');
  return split < 0 ? [arg, true] : [arg.slice(0, split), arg.slice(split + 1)];
}));
if (!options.has('--video')) {
  console.error('Usage: node scripts/check_playback.mjs --video=out/video.mp4 --audit=out/checks/preview-audit.ndjson --output=out/checks/playback-preview.json [--fps=30] [--duration=200] [--offset=0] [--audio-levels] [--baseline]');
  process.exit(2);
}
const absolute = value => path.resolve(root, value);
const video = absolute(options.get('--video'));
const auditPath = options.has('--audit') ? absolute(options.get('--audit')) : null;
const output = absolute(options.get('--output') ?? 'out/playback-check.json');
const expectedFps = Number(options.get('--fps') ?? 30);
const expectedDuration = Number(options.get('--duration') ?? 200);
const auditOffsetSeconds = Number(options.get('--offset') ?? 0);
const baseline = options.has('--baseline');
const expectedFrames = Math.round(expectedFps * expectedDuration);
const sampleWidth = 480;
const sampleHeight = 270;
const frameBytes = sampleWidth * sampleHeight;
const sampleEvery = Math.max(1, Math.round(expectedFps / 10));
const poseWindowSeconds = .75;
const poseMinimumRange = .002; // radians (joints) or metres (root translation).
const checks = [];
function check(name, passed, details) {
  checks.push({name, passed: Boolean(passed), ...details});
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}: ${details.message ?? ''}`);
}
async function capture(command, args, {returnStderr = false} = {}) {
  const child = spawn(command, args, {cwd: root, stdio: ['ignore', 'pipe', 'pipe']});
  let stdout = '', stderr = '';
  child.stdout.on('data', chunk => {stdout += chunk;});
  child.stderr.on('data', chunk => {stderr += chunk;});
  const code = await new Promise((resolve, reject) => {
    child.on('error', reject); child.on('close', resolve);
  });
  if (code !== 0) throw new Error(`${command} exited ${code}: ${stderr.slice(-4000)}`);
  return returnStderr ? stderr : stdout;
}
async function fileHash(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
function range(numbers) {
  return numbers.length ? Math.max(...numbers) - Math.min(...numbers) : 0;
}
function consecutiveRuns(records, predicate, endExtension = 0) {
  const runs = [];
  let run = null;
  for (const record of records) {
    if (predicate(record)) {
      if (!run || record.sceneId !== run.sceneId || record.time - run.last > .151) {
        if (run) runs.push(run);
        run = {start: record.time, last: record.time, sceneId: record.sceneId, samples: 0, sum: 0};
      }
      run.last = record.time; run.samples++; run.sum += record.mae ?? record.maximumRange ?? 0;
    } else if (run) {runs.push(run); run = null;}
  }
  if (run) runs.push(run);
  return runs.map(r => ({start: Number(r.start.toFixed(4)), end: Number((r.last + endExtension).toFixed(4)),
    duration: Number((r.last + endExtension - r.start).toFixed(4)), sceneId: r.sceneId, samples: r.samples,
    average: r.sum / r.samples}));
}

const probe = JSON.parse(await capture('ffprobe', ['-v', 'error', '-show_streams', '-show_format',
  '-show_packets', '-show_entries', 'packet=stream_index,pts_time,dts_time,duration_time,size,flags', '-of', 'json', video]));
const videoStream = probe.streams.find(s => s.codec_type === 'video');
const audioStream = probe.streams.find(s => s.codec_type === 'audio');
assert(videoStream, 'Video stream is missing');
const fpsParts = videoStream.avg_frame_rate.split('/').map(Number);
const actualFps = fpsParts[0] / fpsParts[1];
const videoPackets = probe.packets.filter(p => p.stream_index === videoStream.index);
const presentation = videoPackets.map(p => Number(p.pts_time)).sort((a, b) => a - b);
const dts = videoPackets.map(p => Number(p.dts_time));
const audioPackets = probe.packets.filter(p => p.stream_index === audioStream?.index);
const frameInterval = 1 / expectedFps;
const timestampErrors = [];
for (let i = 0; i < presentation.length; i++) {
  if (!Number.isFinite(presentation[i]) || Math.abs(presentation[i] - i * frameInterval) > 2e-5) {
    timestampErrors.push({frame: i, pts: presentation[i], expected: i * frameInterval});
  }
}
const nonMonotonicDts = dts.flatMap((t, i) => i && !(t > dts[i - 1]) ? [{packet: i, dts: t}] : []);
check('constant frame cadence', Math.abs(actualFps - expectedFps) < 1e-7 && videoPackets.length === expectedFrames &&
  timestampErrors.length === 0 && nonMonotonicDts.length === 0, {
  message: `${videoPackets.length}/${expectedFrames} frames, ${actualFps} fps; ${timestampErrors.length} presentation errors, ${nonMonotonicDts.length} decode-order errors`,
  actualFps, expectedFps, expectedFrames, packetCount: videoPackets.length,
  firstPts: presentation[0], lastPts: presentation.at(-1), timestampErrors: timestampErrors.slice(0, 20),
  nonMonotonicDts: nonMonotonicDts.slice(0, 20),
});
const audioPts = audioPackets.map(p => Number(p.pts_time));
const aacInterval = 1024 / Number(audioStream?.sample_rate);
const audioTimestampErrors = audioPts.flatMap((time, i) => i &&
  (!(time > audioPts[i - 1]) || Math.abs(time - audioPts[i - 1] - aacInterval) > 4e-6)
  ? [{packet: i, pts: time, previousPts: audioPts[i - 1]}] : []);
check('continuous audio timestamps', audioPackets.length > 0 && audioTimestampErrors.length === 0 &&
  Math.abs(Number(audioStream?.duration) - expectedDuration) <= frameInterval, {
  message: `${audioPackets.length} audio packets; ${audioTimestampErrors.length} gaps or reversals`,
  packetCount: audioPackets.length, errors: audioTimestampErrors.slice(0, 20),
  firstPts: audioPts[0], lastPts: audioPts.at(-1), duration: Number(audioStream?.duration),
});
const keys = videoPackets.filter(p => p.flags?.includes('K')).map(p => Number(p.pts_time)).sort((a, b) => a - b);
const keyGaps = [...keys.slice(1).map((t, i) => t - keys[i]), expectedDuration - (keys.at(-1) ?? 0)];
const maximumKeyframeGap = Math.max(...keyGaps);
check('seek interval', keys[0] === 0 && maximumKeyframeGap <= 2 + frameInterval + 1e-5, {
  message: `longest keyframe gap ${maximumKeyframeGap.toFixed(3)}s (limit 2s plus one frame)`, maximumKeyframeGap, keyframeCount: keys.length,
});
const atoms = [];
const handle = await fs.open(video, 'r');
try {
  const stat = await handle.stat();
  let position = 0;
  while (position + 8 <= stat.size) {
    const bytes = Buffer.alloc(16);
    await handle.read(bytes, 0, 16, position);
    let size = bytes.readUInt32BE(0);
    const type = bytes.toString('ascii', 4, 8);
    if (size === 1) size = Number(bytes.readBigUInt64BE(8));
    if (size === 0) size = stat.size - position;
    if (size < 8 || position + size > stat.size) throw new Error(`Malformed MP4 atom ${type}`);
    atoms.push({type, offset: position, size}); position += size;
  }
} finally {await handle.close();}
const moov = atoms.find(a => a.type === 'moov');
const mdat = atoms.find(a => a.type === 'mdat');
check('fast start', moov && mdat && moov.offset < mdat.offset, {
  message: `moov ${moov?.offset}, mdat ${mdat?.offset}`, atoms,
});
const averageVideoBitrate = Number(videoStream.bit_rate);
let peakTwoSecondBitrate = 0;
for (let start = 0; start < expectedDuration; start += .5) {
  if (start + 2 > expectedDuration) continue;
  const bits = videoPackets.reduce((n, p) => n + (Number(p.pts_time) >= start && Number(p.pts_time) < start + 2 ? Number(p.size) * 8 : 0), 0);
  peakTwoSecondBitrate = Math.max(peakTwoSecondBitrate, bits / 2);
}
check('browser compatible encoding', videoStream.codec_name === 'h264' && videoStream.pix_fmt === 'yuv420p' &&
  videoStream.color_range === 'tv' && videoStream.color_space === 'bt709' && videoStream.level <= 40 &&
  averageVideoBitrate <= 8_000_000 && audioStream?.codec_name === 'aac', {
  message: `${videoStream.codec_name} ${videoStream.profile} level ${videoStream.level / 10}, ${videoStream.pix_fmt}, ${videoStream.color_range}/${videoStream.color_space}, ${(averageVideoBitrate / 1e6).toFixed(2)} Mbps average; ${audioStream?.codec_name} audio`,
  codec: videoStream.codec_name, profile: videoStream.profile, level: videoStream.level, pixelFormat: videoStream.pix_fmt,
  colorRange: videoStream.color_range, colorSpace: videoStream.color_space, averageVideoBitrate, peakTwoSecondBitrate,
  audioCodec: audioStream?.codec_name, audioSampleRate: Number(audioStream?.sample_rate), audioChannels: audioStream?.channels,
});
if (options.has('--audio-levels')) {
  const meterLog = await capture('ffmpeg', ['-hide_banner', '-nostats', '-v', 'info', '-threads', '2', '-i', video,
    '-map', '0:a:0', '-vn', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '/dev/null'], {returnStderr: true});
  const measured = JSON.parse(meterLog.slice(meterLog.lastIndexOf('{'), meterLog.lastIndexOf('}') + 1));
  const integratedLufs = Number(measured.input_i), truePeakDbtp = Number(measured.input_tp);
  check('encoded audio clarity levels', integratedLufs >= -18 && integratedLufs <= -15 && truePeakDbtp <= -1, {
    message: `${integratedLufs.toFixed(1)} LUFS integrated; ${truePeakDbtp.toFixed(1)} dBTP true peak`,
    integratedLufs, truePeakDbtp, loudnessRangeLu: Number(measured.input_lra),
    acceptedIntegratedLufs: [-18, -15], maximumTruePeakDbtp: -1,
    method: 'FFmpeg loudnorm input measurements on the delivered AAC stream; output-normalized measurements are ignored. Full-programme loudness range -18 to -15 LUFS and at least 1dB true-peak headroom.',
  });
}

let audits = [];
if (auditPath) audits = (await fs.readFile(auditPath, 'utf8')).split('\n').filter(Boolean)
  .map(line => JSON.parse(line.replace(/^FRAME_AUDIT /, '')))
  .filter(a => a.globalTime >= auditOffsetSeconds - 1e-6 && a.globalTime < auditOffsetSeconds + expectedDuration - 1e-6);
const auditForFrame = new Map(audits.map(a => [Math.round((a.globalTime - auditOffsetSeconds) * expectedFps), a]));
const poseSamples = [];
const poseWindowFrames = Math.round(poseWindowSeconds * expectedFps);
for (let i = 0; i + poseWindowFrames < expectedFrames; i += sampleEvery) {
  const window = [];
  for (let j = i; j <= i + poseWindowFrames; j++) {
    const a = auditForFrame.get(j);
    if (a?.motionSignature?.length && a.motionSignature.every(Number.isFinite)) window.push(a);
  }
  if (window.length !== poseWindowFrames + 1 || window[0].sceneId !== window.at(-1).sceneId) continue;
  // Signature coordinates 0..4 are root translation/yaw/hip height. Require
  // actual joint movement as well, so sliding a locked model cannot pass.
  const coordinateRanges = window[0].motionSignature.map((_, k) => range(window.map(a => a.motionSignature[k])));
  const maximumRange = Math.max(...coordinateRanges.slice(5));
  poseSamples.push({time: i / expectedFps, sceneId: window[0].sceneId, maximumRange,
    maximumRootRange: Math.max(...coordinateRanges.slice(0, 5))});
}
const lockedPoseWindows = poseSamples.filter(r => r.maximumRange < poseMinimumRange);
const poseHolds = consecutiveRuns(poseSamples, r => r.maximumRange < poseMinimumRange, poseWindowSeconds);
const leadFrames = audits.filter(a => a.subject === 'character' && !a.insert);
const signatureFrames = leadFrames.filter(a => a.motionSignature?.length && a.motionSignature.every(Number.isFinite));
check('lead animation continues', audits.length === expectedFrames && signatureFrames.length === leadFrames.length && leadFrames.length >= expectedFrames * .9 &&
  lockedPoseWindows.length === 0 && poseSamples.length > 0, {
  message: `${signatureFrames.length}/${leadFrames.length} lead frames have pose signatures; ${lockedPoseWindows.length} locked ${poseWindowSeconds}s windows`,
  baselineWithoutPoseEvidence: baseline && !signatureFrames.length, signatureFrames: signatureFrames.length, leadFrames: leadFrames.length,
  windowSeconds: poseWindowSeconds, minimumRange: poseMinimumRange, windowsChecked: poseSamples.length,
  minimumObservedRange: poseSamples.length ? Math.min(...poseSamples.map(p => p.maximumRange)) : null,
  holds: poseHolds,
  method: 'Maximum articulated-joint coordinate range in every overlapping 0.75s window, sampled every 0.1s; excludes root translation, yaw, hip height, breathing, film grain, lighting and camera motion. Near-zero range below 0.002 radians is a locked-pose failure. Scene cuts are excluded.',
});

// The native-resolution decoded checksum catches actual held image frames. A
// second, smoothed/tracked crop warns about visually quiet poses independently
// of the grain and encoded presentation timestamps. Pixel warnings are review
// aids, not a substitute for the render-side joint test above.
const decoder = spawn('ffmpeg', ['-hide_banner', '-v', 'error', '-xerror', '-threads', '2', '-i', video,
  '-map', '0:v:0', '-an', '-threads:v', '1', '-f', 'framemd5', 'pipe:3',
  '-map', '0:v:0', '-an', '-vf', `scale=${sampleWidth}:${sampleHeight}:flags=area,gblur=sigma=0.7,format=gray`,
  '-threads:v', '1', '-fps_mode', 'passthrough', '-f', 'rawvideo', 'pipe:1',
  '-map', '0:a:0?', '-vn', '-f', 'null', '/dev/null'], {cwd: root, stdio: ['ignore', 'pipe', 'pipe', 'pipe']});
let decoderError = '', pending = Buffer.alloc(0), decodedFrames = 0, nativeHashes = 0;
let previousHash = null, duplicateRun = null;
const duplicateHolds = [], roiSamples = [];
decoder.stderr.on('data', chunk => {decoderError += chunk;});
const nativeLines = readline.createInterface({input: decoder.stdio[3]});
nativeLines.on('line', line => {
  if (!line || line.startsWith('#')) return;
  const parts = line.split(',').map(s => s.trim());
  const hash = parts.at(-1);
  if (hash === previousHash) {
    duplicateRun ??= {startFrame: nativeHashes - 1, endFrame: nativeHashes};
    duplicateRun.endFrame = nativeHashes;
  } else if (duplicateRun) {duplicateHolds.push(duplicateRun); duplicateRun = null;}
  previousHash = hash; nativeHashes++;
});
function crop(frame, b) {
  const result = new Float32Array(32 * 64);
  // The upper 80% excludes the common lower-third subtitle band and captures
  // the head, shoulders, torso and hands without treating a backdrop as motion.
  const left = (b.x + b.width * .08) * sampleWidth;
  const top = (b.y + b.height * .03) * sampleHeight;
  const width = b.width * .84 * sampleWidth, height = b.height * .77 * sampleHeight;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 32; x++) {
    const px = Math.max(0, Math.min(sampleWidth - 2, left + (x + .5) * width / 32));
    const py = Math.max(0, Math.min(sampleHeight - 2, top + (y + .5) * height / 64));
    const ix = Math.floor(px), iy = Math.floor(py), dx = px - ix, dy = py - iy;
    const offset = iy * sampleWidth + ix;
    result[y * 32 + x] = (frame[offset] * (1 - dx) + frame[offset + 1] * dx) * (1 - dy) +
      (frame[offset + sampleWidth] * (1 - dx) + frame[offset + sampleWidth + 1] * dx) * dy;
  }
  return result;
}
decoder.stdout.on('data', chunk => {
  pending = pending.length ? Buffer.concat([pending, chunk]) : chunk;
  let offset = 0;
  while (pending.length - offset >= frameBytes) {
    const frame = pending.subarray(offset, offset + frameBytes);
    if (decodedFrames % sampleEvery === 0) {
      const audit = auditForFrame.get(decodedFrames);
      if (audit?.characterBox?.visible) roiSamples.push({time: decodedFrames / expectedFps, sceneId: audit.sceneId, pixels: crop(frame, audit.characterBox)});
    }
    decodedFrames++; offset += frameBytes;
  }
  pending = Buffer.from(pending.subarray(offset));
});
let heartbeat = setInterval(() => console.log(`Playback decode: ${decodedFrames}/${expectedFrames} frames`), 15000);
let decoderCode;
try {
  decoderCode = await new Promise((resolve, reject) => {decoder.on('error', reject); decoder.on('close', resolve);});
} finally {clearInterval(heartbeat);}
if (duplicateRun) duplicateHolds.push(duplicateRun);
const heldFrames = duplicateHolds.filter(h => (h.endFrame - h.startFrame + 1) / expectedFps >= .5).map(h => ({...h,
  start: h.startFrame / expectedFps, end: (h.endFrame + 1) / expectedFps,
  duration: (h.endFrame - h.startFrame + 1) / expectedFps}));
check('full audio/video decode', decoderCode === 0 && !decoderError.trim() && decodedFrames === expectedFrames && nativeHashes === expectedFrames && pending.length === 0, {
  message: `${decodedFrames}/${expectedFrames} downscaled frames, ${nativeHashes}/${expectedFrames} native checksums, decoder exit ${decoderCode}`,
  decoderCode, errors: decoderError, decodedFrames, nativeResolutionChecksums: nativeHashes, trailingBytes: pending.length,
});
check('no decoded image holds', heldFrames.length === 0, {
  message: `${heldFrames.length} identical image holds lasting at least 0.5s`, holds: heldFrames,
  longestIdenticalRunFrames: Math.max(1, ...duplicateHolds.map(h => h.endFrame - h.startFrame + 1)),
  method: 'MD5 of every decoded frame at native resolution, before the grayscale analysis; repeated-image holds of at least 0.5s fail.',
});
const roiWindows = [];
const comparisonSamples = Math.max(1, Math.round(.5 * expectedFps / sampleEvery));
for (let i = comparisonSamples; i < roiSamples.length; i++) {
  const a = roiSamples[i - comparisonSamples], b = roiSamples[i];
  if (a.sceneId !== b.sceneId || Math.abs(b.time - a.time - .5) > .02) continue;
  let difference = 0;
  for (let p = 0; p < a.pixels.length; p++) difference += Math.abs(a.pixels[p] - b.pixels[p]);
  roiWindows.push({time: a.time, sceneId: a.sceneId, mae: difference / a.pixels.length});
}
const quietRoiHolds = consecutiveRuns(roiWindows, r => r.mae < .8, .5).filter(r => r.samples >= 6);
const byScene = [...new Set(roiWindows.map(r => r.sceneId))].map(sceneId => {
  const values = roiWindows.filter(r => r.sceneId === sceneId).map(r => r.mae).sort((a, b) => a - b);
  return {sceneId, windows: values.length, minimum: values[0], median: values[Math.floor(values.length / 2)],
    tenthPercentile: values[Math.floor(values.length * .1)]};
});
const report = {checkedAt: new Date().toISOString(), video: path.relative(root, video), videoSha256: await fileHash(video),
  audit: auditPath ? path.relative(root, auditPath) : null, auditSha256: auditPath ? await fileHash(auditPath) : null, auditOffsetSeconds,
  baseline, passed: checks.every(c => c.passed), checks,
  visualMotionReview: {advisory: true, framesSampled: roiSamples.length, comparisonSeconds: .5,
    quietThresholdMeanAbsoluteDifference: .8, quietHolds: quietRoiHolds, byScene,
    method: '480x270 grayscale with Gaussian blur sigma0.7; lead projected bounding box tracked into a normalized 32x64 upper-body crop. Compare 0.5s apart at 10Hz. MAE<0.8/255 for at least six consecutive windows is flagged for review. Slow deliberate acting may be flagged; film grain or camera movement cannot establish character articulation. The independent pose check supplies that evidence.',
  }};
await fs.mkdir(path.dirname(output), {recursive: true});
await fs.writeFile(output, JSON.stringify(report, null, 2) + '\n');
const summaryPath = output.endsWith('.json') ? output.slice(0, -5) + '.md' : output + '.md';
const markdown = [
  '# Playback and animation checks', '',
  `File: \`${report.video}\`. SHA-256: \`${report.videoSha256}\`.`, '',
  '| Check | Result | Evidence |', '| --- | --- | --- |',
  ...checks.map(c => `| ${c.name} | ${c.passed ? 'PASS' : 'FAIL'} | ${(c.message ?? '').replaceAll('|', '\\|')} |`), '',
  `The joint check inspects every overlapping ${poseWindowSeconds}s window at 0.1s intervals. Its ${poseMinimumRange} radian threshold excludes root movement, breath, camera movement and grain.`, '',
  '## Quiet upper-body intervals for visual review', '',
  'This pixel test is advisory: a slow expression can be intentional. It compares smoothed, tracked character crops 0.5s apart, independently of the exact decoded-image and joint tests.', '',
  ...(quietRoiHolds.length ? ['| Start | End | Scene | Mean change / 255 |', '| --- | --- | --- | --- |',
    ...quietRoiHolds.map(r => `| ${r.start.toFixed(2)}s | ${r.end.toFixed(2)}s | ${r.sceneId} | ${r.average.toFixed(3)} |`)] : ['No intervals meet the quiet-crop threshold.']), '',
  ...(baseline && !signatureFrames.length ? ['The preserved baseline export has no joint signatures; its articulated animation cannot be certified from the old audit. The decoded frame and tracked-crop evidence remain valid.', ''] : []),
];
await fs.writeFile(summaryPath, markdown.join('\n'));
console.log(`${report.passed ? 'PASS' : 'FAIL'} playback report: ${path.relative(root, output)}; ${quietRoiHolds.length} quiet upper-body intervals require visual review.`);
process.exitCode = report.passed ? 0 : 1;
