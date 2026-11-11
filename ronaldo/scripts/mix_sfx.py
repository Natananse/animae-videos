#!/usr/bin/env python3
"""Mix only essential contact sounds, without synthetic hiss or ambience beds."""
from array import array
import hashlib
import json
import math
from pathlib import Path
import wave

ROOT = Path(__file__).resolve().parents[1]
RATE = 48000
SFX = ROOT / 'public/sfx'
timing_file = ROOT / 'public/timing.json'
cues_file = ROOT / '.cache/sound_cues.json'
story = json.loads((ROOT / 'script/script.json').read_text())
timing = json.loads(timing_file.read_text())
cues = json.loads(cues_file.read_text())
allowed_kinds = {'kick', 'touch', 'step', 'land'}
retained_cues = [cue for cue in cues if cue['kind'] in allowed_kinds]
duration = timing['totalFrames'] / timing['fps']
destination = SFX / 'action_mix.wav'
signature = hashlib.sha256(timing_file.read_bytes() + cues_file.read_bytes() + Path(__file__).read_bytes())
for file in sorted(SFX.glob('*.wav')):
    if file.name != destination.name:
        signature.update(file.read_bytes())
key = signature.hexdigest()
cache = ROOT / '.cache/sound_mix.json'
if destination.exists() and cache.exists() and json.loads(cache.read_text()).get('key') == key:
    print('Action sound mix is cached.')
    raise SystemExit(0)


def load(name):
    with wave.open(str(SFX / f'{name}.wav'), 'rb') as source:
        assert source.getframerate() == RATE and source.getsampwidth() == 2
        channels = source.getnchannels()
        samples = array('h', source.readframes(source.getnframes()))
    return samples, channels


speech = []
for scene in timing['scenes']:
    base = scene['from'] / timing['fps']
    speech.extend((base + r['start'], base + r['end']) for r in scene.get('speechRanges', []))
count = round(duration * RATE)
mix = array('f', [0]) * (count * 2)


# Street/stadium beds and breath/cloth/cheer/applause/net effects were
# synthesized from filtered white noise. Exclude these sources completely;
# denoising the finished voice/music mix would unnecessarily damage them.
loaded = {}
for cue in retained_cues:
    name = cue['kind']
    if name not in loaded:
        loaded[name] = load(name)
    data, channels = loaded[name]
    offset = round(cue['time'] * RATE)
    gain = cue['gain']
    length = min(len(data) // channels, count - offset)
    for frame in range(length):
        if offset + frame < 0:
            continue
        fade = min(1, (length - frame) / (RATE * .045))
        mix[(offset + frame) * 2] += data[frame * channels] / 32768 * gain * fade
        mix[(offset + frame) * 2 + 1] += data[frame * channels + channels - 1] / 32768 * gain * fade

# Ten-millisecond control blocks keep Foley intelligible around the narration.
# The original impact onset remains exactly on the contact sample.
for block in range(0, count, 480):
    t = block / RATE
    gain = .62 if any(start <= t < end for start, end in speech) else 1
    for i in range(block * 2, min((block + 480) * 2, len(mix))):
        mix[i] *= gain
# Smooth the residual fizzy grain in the procedural contact sounds only.
# Two causal low-pass stages keep their low thuds and sub-millisecond timing;
# neither narration nor the approved music passes through this filter.
cutoff = 1800
alpha = 1 - math.exp(-2 * math.pi * cutoff / RATE)
first_left = first_right = second_left = second_right = 0.0
for frame in range(count):
    i = frame * 2
    first_left += alpha * (mix[i] - first_left)
    first_right += alpha * (mix[i + 1] - first_right)
    second_left += alpha * (first_left - second_left)
    second_right += alpha * (first_right - second_right)
    mix[i] = second_left
    mix[i + 1] = second_right
peak = max(abs(value) for value in mix) or 1
headroom = min(1, .86 / peak)
pcm = array('h', (round(max(-1, min(1, value * headroom)) * 32767) for value in mix))
with wave.open(str(destination), 'wb') as output:
    output.setnchannels(2); output.setsampwidth(2); output.setframerate(RATE)
    output.writeframes(pcm.tobytes())
cache.write_text(json.dumps({'key': key, 'duration': duration, 'cues': len(retained_cues),
    'removedCues': len(cues) - len(retained_cues), 'ambienceBeds': False,
    'retainedKinds': sorted(allowed_kinds),
    'contactLowpassHz': cutoff,
    'peakBeforeHeadroom': peak, 'headroomGain': headroom}, indent=2) + '\n')
print(f'Clean action mix: {duration}s, {len(retained_cues)} contact cues, no noise beds, {headroom:.3f} headroom gain.')
