#!/usr/bin/env node
// Run after rendering/transcoding has stopped: this is a real-time HTML5 media
// smoke test, so competing GPU work would make dropped-frame results ambiguous.
import {openBrowser} from '@remotion/renderer';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Map(process.argv.slice(2).map(arg => {
  const i = arg.indexOf('='); return i < 0 ? [arg, true] : [arg.slice(0, i), arg.slice(i + 1)];
}));
if (!args.has('--video')) {
  console.error('Usage: node scripts/check_browser_playback.mjs --video=out/video.mp4 --output=out/checks/browser-playback.json [--starts=0,75,160,191] [--seconds=3.5]');
  process.exit(2);
}
const video = path.resolve(root, args.get('--video'));
const output = path.resolve(root, args.get('--output') ?? 'out/browser-playback.json');
const starts = String(args.get('--starts') ?? '0,75,160,191').split(',').map(Number);
const seconds = Number(args.get('--seconds') ?? 3.5);
if (!starts.every(n => Number.isFinite(n) && n >= 0) || !(seconds >= 2 && seconds <= 10)) throw new Error('Invalid playback sample times');
const stat = await fs.stat(video);
const requests = [];
const html = `<!doctype html><meta charset="utf-8"><title>Local delivery playback check</title>
<style>body{margin:0;background:#111}video{width:960px;height:540px;display:block}</style>
<video id="video" src="/video.mp4" muted playsinline preload="metadata" controls></video>`;
const server = http.createServer((req, res) => {
  if (req.url === '/') {res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}); res.end(html); return;}
  if (req.url !== '/video.mp4') {res.writeHead(404); res.end(); return;}
  const record = {method: req.method, range: req.headers.range ?? null, status: 0, start: 0, end: stat.size - 1, bytes: 0};
  requests.push(record);
  const headers = {'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store'};
  let start = 0, end = stat.size - 1;
  if (req.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (!match || (!match[1] && !match[2])) {
      record.status = 416; res.writeHead(416, {...headers, 'Content-Range': `bytes */${stat.size}`}); res.end(); return;
    }
    if (!match[1]) start = Math.max(0, stat.size - Number(match[2]));
    else start = Number(match[1]);
    if (match[1] && match[2]) end = Math.min(end, Number(match[2]));
    if (start > end || start >= stat.size) {
      record.status = 416; res.writeHead(416, {...headers, 'Content-Range': `bytes */${stat.size}`}); res.end(); return;
    }
    headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
    record.status = 206;
  } else record.status = 200;
  record.start = start; record.end = end;
  res.writeHead(record.status, {...headers, 'Content-Length': end - start + 1});
  if (req.method === 'HEAD') {res.end(); return;}
  const stream = createReadStream(video, {start, end});
  stream.on('data', chunk => {record.bytes += chunk.length;});
  stream.on('error', () => res.destroy());
  res.on('close', () => stream.destroy());
  stream.pipe(res);
});
await new Promise((resolve, reject) => {server.once('error', reject); server.listen(0, '127.0.0.1', resolve);});
const url = `http://127.0.0.1:${server.address().port}`;
let browser;
const result = {checkedAt: new Date().toISOString(), video: path.relative(root, video), bytes: stat.size,
  method: 'Actual muted HTML5 playback and seeking in installed headless Chrome, via local HTTP byte ranges, after rendering/transcoding stopped. Local playback verifies decoding and seeking; it does not measure the viewer’s internet connection.',
  thresholds: {minimumMediaToWallTimeRatio: .85, minimumDisplayedFrameCallbacksPerSecond: 20,
    maximumFrameCallbackGapSeconds: .5, maximumNoClockProgressSeconds: .75, maximumSeekMilliseconds: 2500,
    maximumPlayPromiseMilliseconds: 1500},
  sampleSeconds: seconds, segments: [], errors: [], passed: false};
try {
  const rangeProbe = await fetch(`${url}/video.mp4`, {headers: {Range: 'bytes=12345-12444'}});
  const rangeBytes = (await rangeProbe.arrayBuffer()).byteLength;
  result.rangeProbe = {status: rangeProbe.status, contentRange: rangeProbe.headers.get('content-range'), bytes: rangeBytes,
    passed: rangeProbe.status === 206 && rangeBytes === 100 && rangeProbe.headers.get('content-range') === `bytes 12345-12444/${stat.size}`};
  if (!result.rangeProbe.passed) throw new Error('Local HTTP byte-range verification failed');
  browser = await openBrowser('chrome', {browserExecutable: process.env.BROWSER_EXECUTABLE ?? '/usr/bin/google-chrome',
    chromeMode: 'chrome-for-testing', chromiumOptions: {gl: process.env.CHROMIUM_GL ?? 'angle', enableMultiProcessOnLinux: true}, logLevel: 'warn'});
  const page = await browser.newPage({context: () => null, logLevel: 'warn', indent: false, pageIndex: 0,
    onBrowserLog: null, onLog: () => {}});
  await page.setViewport({width: 1000, height: 600, deviceScaleFactor: 1});
  await page.goto({url, timeout: 30000});
  await page.bringToFront();
  result.browser = await page.evaluate(async () => {
    const video = document.querySelector('video');
    video.muted = true;
    if (!video.readyState) await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Video metadata timed out')), 15000);
      video.addEventListener('loadedmetadata', () => {clearTimeout(timer); resolve();}, {once: true});
      video.addEventListener('error', () => {clearTimeout(timer); reject(new Error(`Media error ${video.error?.code}`));}, {once: true});
    });
    return {userAgent: navigator.userAgent, visibility: document.visibilityState, duration: video.duration,
      width: video.videoWidth, height: video.videoHeight, requestVideoFrameCallback: typeof video.requestVideoFrameCallback === 'function',
      h264AacSupport: video.canPlayType('video/mp4; codecs="avc1.42E01F, mp4a.40.2"')};
  });
  for (const start of starts) {
    const segment = await page.evaluate(async (target, sampleSeconds) => {
      const video = document.querySelector('video');
      if (!(target + sampleSeconds < video.duration)) throw new Error('Playback sample exceeds the video duration');
      const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
      video.pause();
      const seekStarted = performance.now();
      if (Math.abs(video.currentTime - target) > .01) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => {cleanup(); reject(new Error(`Seek to ${target}s timed out`));}, 10000);
          const done = () => {cleanup(); resolve();};
          const error = () => {cleanup(); reject(new Error(`Media seek error ${video.error?.code}`));};
          function cleanup() {clearTimeout(timer); video.removeEventListener('seeked', done); video.removeEventListener('error', error);}
          video.addEventListener('seeked', done); video.addEventListener('error', error);
          video.currentTime = target;
        });
      }
      const seekMilliseconds = performance.now() - seekStarted;
      const events = [];
      const listeners = new Map(['stalled', 'waiting', 'error', 'playing', 'pause'].map(name => {
        const callback = () => events.push({event: name, wallTime: performance.now(), mediaTime: video.currentTime, readyState: video.readyState});
        video.addEventListener(name, callback); return [name, callback];
      }));
      let callbackId, callbackCount = 0, maximumCallbackGap = 0, lastCallback, mediaFirst, mediaLast;
      const onFrame = (now, metadata) => {
        callbackCount++;
        maximumCallbackGap = Math.max(maximumCallbackGap, (now - (lastCallback ?? startClock)) / 1000);
        lastCallback = now; mediaFirst ??= metadata.mediaTime; mediaLast = metadata.mediaTime;
        callbackId = video.requestVideoFrameCallback(onFrame);
      };
      const qualityBefore = video.getVideoPlaybackQuality?.();
      const playStarted = performance.now();
      let playTimer;
      try {
        await Promise.race([video.play(), new Promise((_, reject) => {
          playTimer = setTimeout(() => reject(new Error(`Playback at ${target}s timed out`)), 10000);
        })]);
      } catch (error) {
        video.pause();
        for (const [name, listener] of listeners) video.removeEventListener(name, listener);
        throw error;
      } finally {clearTimeout(playTimer);}
      const playPromiseMilliseconds = performance.now() - playStarted;
      const startClock = performance.now(), startMedia = video.currentTime;
      if (typeof video.requestVideoFrameCallback === 'function') callbackId = video.requestVideoFrameCallback(onFrame);
      let lastProgress = startClock, previousTime = video.currentTime, maximumNoProgress = 0;
      while (performance.now() - startClock < sampleSeconds * 1000) {
        await sleep(100);
        const now = performance.now();
        if (video.currentTime - previousTime >= .01) {lastProgress = now; previousTime = video.currentTime;}
        maximumNoProgress = Math.max(maximumNoProgress, (now - lastProgress) / 1000);
      }
      const wallSeconds = (performance.now() - startClock) / 1000, endMedia = video.currentTime;
      maximumCallbackGap = Math.max(maximumCallbackGap, (performance.now() - (lastCallback ?? startClock)) / 1000);
      if (callbackId !== undefined) video.cancelVideoFrameCallback(callbackId);
      const qualityAfter = video.getVideoPlaybackQuality?.();
      for (const [name, listener] of listeners) video.removeEventListener(name, listener);
      video.pause();
      return {start: target, seekMilliseconds, playPromiseMilliseconds, wallSeconds, mediaSecondsAdvanced: endMedia - startMedia,
        startMedia, endMedia, callbackCount, callbackMediaSecondsAdvanced: mediaLast === undefined ? 0 : mediaLast - mediaFirst,
        maximumCallbackGap, maximumNoProgress, videoError: video.error ? {code: video.error.code, message: video.error.message} : null,
        totalVideoFrames: qualityAfter && qualityBefore ? qualityAfter.totalVideoFrames - qualityBefore.totalVideoFrames : null,
        droppedFrames: qualityAfter && qualityBefore ? qualityAfter.droppedVideoFrames - qualityBefore.droppedVideoFrames : null,
        readyState: video.readyState, events: events.map(e => ({...e, afterPlayMilliseconds: e.wallTime - startClock, wallTime: undefined}))};
    }, start, seconds);
    segment.passed = segment.mediaSecondsAdvanced >= segment.wallSeconds * .85 &&
      segment.callbackCount >= seconds * 20 && segment.maximumCallbackGap < .5 && segment.maximumNoProgress < .75 &&
      segment.seekMilliseconds < 2500 && segment.playPromiseMilliseconds < 1500 && !segment.videoError;
    result.segments.push(segment);
    console.log(`${segment.passed ? 'PASS' : 'FAIL'} Chrome ${start.toFixed(1)}s: advanced ${segment.mediaSecondsAdvanced.toFixed(3)}s in ${segment.wallSeconds.toFixed(3)}s; ${segment.callbackCount} displayed frame callbacks, seek ${segment.seekMilliseconds.toFixed(1)}ms, longest callback gap ${segment.maximumCallbackGap.toFixed(3)}s`);
  }
  result.passed = result.rangeProbe.passed && result.browser.requestVideoFrameCallback && result.segments.every(s => s.passed);
} catch (error) {result.errors.push(error.stack ?? String(error));}
finally {
  if (browser) await browser.close({silent: true});
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
const hash = createHash('sha256');
for await (const chunk of createReadStream(video)) hash.update(chunk);
result.videoSha256 = hash.digest('hex');
result.httpRequests = requests;
await fs.mkdir(path.dirname(output), {recursive: true});
await fs.writeFile(output, JSON.stringify(result, null, 2) + '\n');
await fs.writeFile(output.replace(/\.json$/, '') + '.md', [
  '# Browser playback smoke test', '', `File: \`${result.video}\`. Overall: **${result.passed ? 'PASS' : 'FAIL'}**.`, '',
  '| Position | Playback advance | Displayed frames | Longest frame gap | Seek | Result |', '| --- | --- | --- | --- | --- | --- |',
  ...result.segments.map(s => `| ${s.start}s | ${s.mediaSecondsAdvanced.toFixed(3)}s / ${s.wallSeconds.toFixed(3)}s | ${s.callbackCount} | ${s.maximumCallbackGap.toFixed(3)}s | ${s.seekMilliseconds.toFixed(1)}ms | ${s.passed ? 'PASS' : 'FAIL'} |`), '',
  result.method, '', ...result.errors.map(e => `\`\`\`\n${e}\n\`\`\``), '',
].join('\n'));
console.log(`${result.passed ? 'PASS' : 'FAIL'} browser playback: ${path.relative(root, output)}`);
process.exitCode = result.passed ? 0 : 1;
