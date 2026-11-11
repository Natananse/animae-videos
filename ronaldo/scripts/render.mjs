import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {mkdir, writeFile, readFile, readdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {version, finalFile, previewFile, reviews, reviewFile, manifestFile, checkDir} from './delivery.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const mode = process.argv[2] ?? 'final';
const isReview = mode in reviews;
if (!['final', 'preview', 'stills', 'benchmark'].includes(mode) && !isReview) throw new Error(`Unknown mode: ${mode}`);
await mkdir('out', {recursive: true});
const start = Date.now();
const frameAudits = new Map();
const onBrowserLog = ({text}) => {
  if (!text.startsWith('FRAME_AUDIT ')) return;
  const audit = JSON.parse(text.slice(12));
  frameAudits.set(audit.globalTime.toFixed(6), audit);
};
// Pre-mix Foley once so the UHD 620 does not evaluate hundreds of audio nodes.
execFileSync(process.execPath, ['scripts/make_sound_cues.mjs'], {stdio: 'inherit'});
execFileSync(process.env.PYTHON ?? 'python3', ['scripts/prepare_clear_audio.py'], {stdio: 'inherit'});
const clearAudio = JSON.parse(await readFile('public/audio/clear_master.json', 'utf8'));
const sourceHash = createHash('sha256');
async function hashDirectory(directory) {
  for (const item of (await readdir(directory, {withFileTypes: true})).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) await hashDirectory(file);
    else {sourceHash.update(file); sourceHash.update(await readFile(file));}
  }
}
await hashDirectory('src'); await hashDirectory('public');
sourceHash.update(await readFile('package-lock.json'));
const fingerprint = sourceHash.digest('hex');
let cached = false;
try {cached = (await readFile('.render/bundle-hash.txt', 'utf8')) === fingerprint;
  await access('.render/bundle/index.html');} catch {cached = false;}
let serveUrl = path.join(root, '.render/bundle');
if (cached) console.log('Reusing unchanged documentary bundle.');
else {
  console.log('Bundling the documentary…');
  serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'),
    publicDir: path.join(root, 'public'), outDir: serveUrl});
  await writeFile('.render/bundle-hash.txt', fingerprint);
}
const chromiumOptions = {gl: process.env.CHROMIUM_GL ?? 'angle', enableMultiProcessOnLinux: true};
const browser = await openBrowser('chrome', {
  browserExecutable: process.env.BROWSER_EXECUTABLE ?? '/usr/bin/google-chrome',
  chromiumOptions, chromeMode: 'chrome-for-testing', logLevel: 'warn',
});
try {
  const composition = await selectComposition({serveUrl,
    id: isReview ? 'RonaldoReview' : mode === 'preview' ? 'RonaldoPreview' : 'Ronaldo', puppeteerInstance: browser});
  if (mode === 'stills') {
    const seconds = process.env.STILL_SECONDS ? process.env.STILL_SECONDS.split(',').map(Number)
      : [1.2, 3.8, 5.2, 7.5, 16, 26, 33, 44, 72, 106.6, 108.05, 145, 178, 188, 195];
    for (const second of seconds) {
      const output = `out/${version}_still_${String(second).replace('.', '_')}.png`;
      await renderStill({composition, serveUrl, puppeteerInstance: browser,
        frame: Math.round(second * composition.fps), output, imageFormat: 'png',
        timeoutInMilliseconds: 120000, onBrowserLog, logLevel: 'warn'});
      console.log(output);
    }
  } else {
    const outputLocation = isReview ? reviewFile(mode) : mode === 'preview' ? previewFile
      : mode === 'benchmark' ? `out/${version}_benchmark.mp4` : finalFile;
    const frameRange = process.env.RENDER_FRAMES
      ? process.env.RENDER_FRAMES.split('-').map(Number)
      : isReview ? [Math.round(reviews[mode][0] * composition.fps), Math.round(reviews[mode][1] * composition.fps) - 1]
      : mode === 'benchmark' ? [0, 89] : undefined;
    let lastLog = 0;
    await renderMedia({composition, serveUrl, puppeteerInstance: browser,
      codec: 'h264', audioCodec: 'aac', audioBitrate: '320k', sampleRate: 48000,
      crf: mode === 'preview' || isReview ? 21 : 18, x264Preset: 'fast', pixelFormat: 'yuv420p',
      colorSpace: 'bt709', gopSize: composition.fps * 2,
      encodingMaxRate: mode === 'preview' || isReview ? '3M' : '8M',
      encodingBufferSize: mode === 'preview' || isReview ? '6M' : '16M',
      imageFormat: 'jpeg', jpegQuality: mode === 'preview' ? 92 : 97,
      concurrency: Number(process.env.RENDER_CONCURRENCY ?? 1),
      timeoutInMilliseconds: 120000, frameRange, outputLocation, overwrite: true,
      onBrowserLog, logLevel: 'warn', onProgress: (progress) => {
        const now = Date.now();
        if (now - lastLog > 10000 || progress.progress === 1) {
          const remaining = Math.round(progress.renderEstimatedTime / 1000);
          console.log(`${mode}: ${progress.renderedFrames} frames, ${(progress.progress * 100).toFixed(1)}%, estimated ${remaining}s remaining`);
          lastLog = now;
        }
      },
    });
    const evidence = {mode, outputLocation, sourceHash: fingerprint, audioMasterSha256: clearAudio.masterSha256,
      colorSpace: 'bt709', pixelFormat: 'yuv420p', audioBitrate: '320k', maxKeyframeSeconds: 2,
      graphicsBackend: chromiumOptions.gl, concurrency: Number(process.env.RENDER_CONCURRENCY ?? 1), fps: composition.fps,
      width: composition.width, height: composition.height,
      durationInFrames: composition.durationInFrames, frameRange: frameRange ?? null,
      elapsedSeconds: (Date.now() - start) / 1000, completedAt: new Date().toISOString()};
    await mkdir(checkDir, {recursive: true});
    await writeFile(`${checkDir}/${mode}-audit.ndjson`, [...frameAudits.values()].sort((a,b) => a.globalTime-b.globalTime).map(a => JSON.stringify(a)).join('\n') + '\n');
    await writeFile(manifestFile(mode), JSON.stringify(evidence, null, 2) + '\n');
    console.log(`Complete: ${outputLocation} (${evidence.elapsedSeconds.toFixed(1)} seconds to render)`);
  }
} finally {
  await browser.close({silent: true});
}
if (mode === 'final' && process.env.DERIVE_PREVIEW === '1') {
  const {makePreview} = await import('./make_preview.mjs');
  makePreview();
}
