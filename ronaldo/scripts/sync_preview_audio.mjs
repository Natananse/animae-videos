import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {version, finalFile, previewFile, manifestFile} from './delivery.mjs';

process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const preview = previewFile;
const final = finalFile;
if (!existsSync(preview) || !existsSync(final)) throw new Error('Render both the preview and final first.');
const temporary = `out/ronaldo_emotional_${version}_preview_audio_updated.mp4`;
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', preview, '-i', final,
  '-map', '0:v:0', '-map', '1:a:0', '-c', 'copy', '-movflags', '+faststart', temporary], {stdio: 'inherit'});
renameSync(temporary, preview);
if (existsSync(manifestFile('preview')) && existsSync(manifestFile('final'))) {
  const provenance = JSON.parse(readFileSync(manifestFile('preview'), 'utf8'));
  const finalProvenance = JSON.parse(readFileSync(manifestFile('final'), 'utf8'));
  provenance.audioUpdatedFrom = final;
  provenance.audioSourceHash = finalProvenance.sourceHash;
  provenance.audioUpdatedAt = new Date().toISOString();
  writeFileSync(manifestFile('preview'), JSON.stringify(provenance, null, 2) + '\n');
}
console.log('Preview retains its original video frames and now uses the final audio stream.');
