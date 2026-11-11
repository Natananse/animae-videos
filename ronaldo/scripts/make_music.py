"""Prepare the quiet dramatic score; narration and Foley are left untouched."""
from pathlib import Path
import hashlib
import json
import subprocess
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / '.cache/music/sb_ascension.mp3'
URL = 'https://www.scottbuckley.com.au/library/wp-content/uploads/2019/02/sb_ascension.mp3'
EXPECTED = '72cce153866fbb5b0c5d8ffb0be2ea73bf64190e2b70a50cbcc8c83b5a8e0dbf'
SOURCE.parent.mkdir(parents=True, exist_ok=True)
if not SOURCE.exists():
    incoming = SOURCE.with_suffix('.incoming')
    urllib.request.urlretrieve(URL, incoming)
    if hashlib.sha256(incoming.read_bytes()).hexdigest() != EXPECTED:
        incoming.unlink()
        raise SystemExit('Music download checksum differs from the verified composer source.')
    incoming.replace(SOURCE)
if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != EXPECTED:
    raise SystemExit('Music source checksum differs from the verified composer source.')
story = json.loads((ROOT / 'script/script.json').read_text())
duration = sum(scene['duration'] for scene in story['scenes'])
offset = 50
out = ROOT / 'public/music'
out.mkdir(exist_ok=True, parents=True)
# A continuous selection builds into the featured kick. Gentle filtering leaves
# space for the narrator; AudioMix applies the actual speech-aware ducking.
audio_filter = (
    'highpass=f=45,equalizer=f=1800:t=q:w=0.8:g=-2.5,'
    'loudnorm=I=-18:TP=-2:LRA=11,'
    f'afade=t=in:st=0:d=0.25,afade=t=out:st={duration-6}:d=6'
)
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                '-ss', str(offset), '-i', str(SOURCE), '-t', str(duration),
                '-af', audio_filter, '-ar', '48000', '-ac', '2',
                '-c:a', 'libmp3lame', '-b:a', '192k', str(out / 'bg.mp3')], check=True)
credit = "'Ascension' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au"
(out / 'CREDITS.txt').write_text(credit + '\nSource: https://www.scottbuckley.com.au/library/ascension/\n'
    'License: https://creativecommons.org/licenses/by/4.0/\n'
    'Edited: continuous 50–250 second excerpt, gentle bass/midrange filtering, loudness adjustment, opening and closing fades; speech-aware playback ducking.\n')
(out / 'license.json').write_text(json.dumps({
    'title': 'Ascension', 'author': 'Scott Buckley', 'license': 'CC BY 4.0',
    'source': 'https://www.scottbuckley.com.au/library/ascension/', 'download': URL,
    'licenseUrl': 'https://creativecommons.org/licenses/by/4.0/',
    'verifiedOn': '2026-11-11', 'sourceSha256': EXPECTED, 'credit': credit,
    'excerpt': {'sourceStartSeconds': offset, 'durationSeconds': duration},
    'edits': ['45 Hz high-pass', 'gentle -2.5 dB dip at 1800 Hz for narration space',
              '-18 LUFS / -2 dBTP source normalization target', '0.25-second opening fade',
              '6-second closing fade', 'speech-aware gain and quiet farewell applied by AudioMix'],
    'playbackVolume': {'narration': .10, 'gaps': .38},
}, indent=2) + '\n')
print(out / 'bg.mp3')
