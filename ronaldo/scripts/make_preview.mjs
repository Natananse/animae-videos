import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {finalFile, previewFile, manifestFile} from './delivery.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function makePreview() {
  process.chdir(root);
  const started = Date.now();
  const final = finalFile;
  const output = previewFile;
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', final,
    '-map', '0:v:0', '-map', '0:a:0', '-vf', 'fps=30,scale=960:540:flags=lanczos',
    '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p', '-g', '60', '-maxrate', '3M', '-bufsize', '6M',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-c:a', 'copy', '-movflags', '+faststart', output], {stdio: 'inherit'});
  const original = JSON.parse(readFileSync(manifestFile('final'), 'utf8'));
  writeFileSync(manifestFile('preview'), JSON.stringify({...original, mode: 'preview',
    outputLocation: output, width: 960, height: 540, fps: 30,
    durationInFrames: original.durationInFrames, derivedFrom: final,
    method: 'Downscaled final picture; identical AAC stream copied without re-encoding',
    elapsedSeconds: (Date.now() - started) / 1000, completedAt: new Date().toISOString()}, null, 2) + '\n');
  console.log(`Preview derived from final: ${output}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) makePreview();
