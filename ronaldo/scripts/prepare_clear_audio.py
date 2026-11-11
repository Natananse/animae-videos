#!/usr/bin/env python3
"""Build the sample-aligned, narration-first mix used by both video exports.

The cached Edge voice files and word boundaries are read-only inputs. All EQ,
level control and mixing happen in derived files, at their original positions.
Requires Python's standard library and FFmpeg; no speech regeneration/denoising.
"""
from array import array
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import wave

ROOT = Path(__file__).resolve().parents[1]
RATE = 48000
CACHE = ROOT / '.cache/clear_audio'
OUTPUT = ROOT / 'public/audio/clear_master.wav'
MANIFEST = ROOT / 'public/audio/clear_master.json'
REPORT = ROOT / 'out/v4_clear_checks/audio-clarity.json'
TIMING_FILE = ROOT / 'public/timing.json'
CUES_FILE = ROOT / '.cache/sound_cues.json'
timing = json.loads(TIMING_FILE.read_text())
duration = timing['totalFrames'] / timing['fps']
sample_count = round(duration * RATE)
VOICE_FILTER = ('highpass=f=75:p=2,'
                'equalizer=f=250:t=q:w=0.8:g=-1.5,'
                'equalizer=f=2600:t=q:w=0.8:g=1.5,'
                'acompressor=threshold=0.09:ratio=2.1:attack=12:release=140:'
                'knee=2.828:makeup=1:detection=rms')
VOICE_TARGET = -16.5  # stereo, center voice; the final mix stays near -16 LUFS
CEILING = -2.0
CONTACT_GAINS = {'step': .045, 'touch': .06, 'kick': .12, 'land': .06}
inputs = [TIMING_FILE, CUES_FILE, Path(__file__), ROOT / 'public/music/bg.mp3',
          ROOT / 'public/music/license.json']
inputs += [ROOT / f'public/voice/{scene["id"]}.{ext}'
           for scene in timing['scenes'] for ext in ['mp3', 'json']]
inputs += [ROOT / f'public/sfx/{kind}.wav' for kind in CONTACT_GAINS]


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def relative(path):
    return str(path.relative_to(ROOT))


def run(*args):
    result = subprocess.run([str(arg) for arg in args], cwd=ROOT,
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode:
        raise RuntimeError(result.stderr.decode(errors='replace'))
    return result


def ffmpeg(*args):
    return run('ffmpeg', '-hide_banner', '-nostdin', '-y', *args)


def loudness(path):
    log = ffmpeg('-i', path, '-vn', '-af', 'ebur128=peak=true:framelog=verbose',
                 '-f', 'null', '-').stderr.decode(errors='replace')
    summary = log.rsplit('Summary:', 1)[-1]
    return {
        'integratedLUFS': float(re.search(r'I:\s*([\-\d.]+) LUFS', summary)[1]),
        'rangeLU': float(re.search(r'LRA:\s*([\-\d.]+) LU', summary)[1]),
        'truePeakDbTP': float(re.search(r'Peak:\s*([\-\d.]+) dBFS', summary)[1]),
    }


def pcm(path):
    data = ffmpeg('-v', 'error', '-i', path, '-vn', '-ar', RATE, '-ac', 2,
                  '-c:a', 'pcm_f32le', '-f', 'f32le', '-').stdout
    values = array('f')
    values.frombytes(data)
    if sys.byteorder != 'little':
        values.byteswap()
    return values


def raw_write(path, values):
    if sys.byteorder != 'little':
        values.byteswap()
    with path.open('wb') as file:
        values.tofile(file)


speech = []
word_ranges = []
for scene in timing['scenes']:
    base = (scene['from'] + scene.get('voiceFrom', 0)) / timing['fps']
    speech.extend((base + r['start'], base + r['end'])
                  for r in scene.get('speechRanges', []))
    word_ranges.extend((base + w['startMs'] / 1000, base + w['endMs'] / 1000)
                       for w in scene['words'])


def clamp(value):
    return max(0, min(1, value))


def music_gain(seconds):
    # Open the space before the first consonant. Slow release avoids pumping
    # between words/sentences and a smooth envelope avoids gain clicks.
    duck = max((min(clamp((seconds - start + .20) / .20),
                    clamp((end + .55 - seconds) / .55))
                for start, end in speech), default=0)
    gain = .22 - .145 * duck  # .075 under narration, .22 in action windows
    farewell = 1 - .55 * clamp((seconds - 171.5) / .5)
    if seconds >= 190:
        farewell = .45 + .55 * clamp((seconds - 190) / 7)
    opening_quiet = min(clamp((seconds - 2.8) / .2), clamp((6.6 - seconds) / .2))
    opening = 1 - .6 * opening_quiet
    fade = clamp(seconds / .5) * clamp((duration - seconds) / 1.5)
    return gain * farewell * opening * fade


def make_envelope():
    # Linear interpolation at sample rate between 5 ms control points is
    # smoother than the previous video-frame audio automation.
    envelope = array('f')
    block = 240
    for offset in range(0, sample_count, block):
        length = min(block, sample_count - offset)
        begin, end = music_gain(offset / RATE), music_gain((offset + length) / RATE)
        for index in range(length):
            envelope.append(begin + (end - begin) * index / length)
    path = CACHE / 'music-envelope.f32'
    raw_write(path, envelope)
    return path


def make_contacts():
    cues = json.loads(CUES_FILE.read_text())
    samples = {}
    for kind in CONTACT_GAINS:
        with wave.open(str(ROOT / f'public/sfx/{kind}.wav'), 'rb') as source:
            assert source.getsampwidth() == 2 and source.getframerate() == RATE
            channels = source.getnchannels()
            values = array('h', source.readframes(source.getnframes()))
            samples[kind] = (values, channels)
    mix = array('f', [0]) * sample_count  # centered, quiet contact effects
    retained = []
    for cue in cues:
        if cue['kind'] not in CONTACT_GAINS:
            continue
        offset = round(cue['time'] * RATE)
        values, channels = samples[cue['kind']]
        length = min(len(values) // channels, sample_count - offset)
        under_speech = any(start - .1 <= cue['time'] <= end + .1 for start, end in speech)
        gain = cue['gain'] * CONTACT_GAINS[cue['kind']] * (.55 if under_speech else 1)
        for index in range(max(0, -offset), length):
            fade = min(1, (length - index) / (RATE * .045))
            mix[offset + index] += values[index * channels] / 32768 * gain * fade
        retained.append({'time': cue['time'], 'kind': cue['kind'], 'gain': gain})
    raw = CACHE / 'contacts.f32'
    raw_write(raw, mix)
    destination = CACHE / 'contacts.wav'
    ffmpeg('-v', 'error', '-f', 'f32le', '-ar', RATE, '-ac', 1, '-i', raw,
           '-af', 'highpass=f=85,lowpass=f=1500,pan=stereo|c0=c0|c1=c0',
           '-c:a', 'pcm_f32le', destination)
    return destination, retained


def assemble_voice():
    args, filters = [], []
    for index, scene in enumerate(timing['scenes']):
        args.extend(['-i', ROOT / f'public/voice/{scene["id"]}.mp3'])
        start_sample = round((scene['from'] + scene.get('voiceFrom', 0)) / timing['fps'] * RATE)
        filters.append(f'[{index}:a]aresample={RATE},asetpts=PTS-STARTPTS,'
                       f'adelay={start_sample}S:all=1[v{index}]')
    labels = ''.join(f'[v{i}]' for i in range(len(timing['scenes'])))
    filters.append(f'{labels}amix=inputs={len(timing["scenes"])}:normalize=0,'
                   f'apad,atrim=end_sample={sample_count},'
                   'pan=stereo|c0=c0|c1=c0[out]')
    raw = CACHE / 'voice-original.wav'
    ffmpeg('-v', 'error', *args, '-filter_complex', ';'.join(filters),
           '-map', '[out]', '-c:a', 'pcm_f32le', '-ar', RATE, raw)
    shaped = CACHE / 'voice-shaped.wav'
    ffmpeg('-v', 'error', '-i', raw, '-af', VOICE_FILTER, '-c:a', 'pcm_f32le', shaped)
    measured = loudness(shaped)
    # A fixed gain preserves pauses and phrasing. The soft compressor above
    # controls loud syllables; a latency-compensated limiter only catches peaks.
    gain_db = VOICE_TARGET - measured['integratedLUFS']
    destination = CACHE / 'voice-clear.wav'
    ffmpeg('-v', 'error', '-i', shaped,
           '-af', f'volume={gain_db}dB,alimiter=limit={10 ** (-2.5 / 20)}:'
                  'attack=5:release=90:level=false:latency=true',
           '-c:a', 'pcm_f32le', destination)
    return raw, destination, gain_db


def word_balance(voice_path, music_path, contact_path):
    # Broad-band RMS is measured inside each actual spoken word (not silent
    # action windows), so a long quiet passage cannot hide competing effects.
    voice, music, contacts = pcm(voice_path), pcm(music_path), pcm(contact_path)
    records = []
    for (start, end) in word_ranges:
        first, last = round(start * RATE) * 2, round(end * RATE) * 2
        n = last - first
        v = sum(x * x for x in voice[first:last]) / n
        m = sum(x * x for x in music[first:last]) / n
        c = sum(x * x for x in contacts[first:last]) / n
        # Native boundaries can include the unvoiced lead of a word. Ignore
        # effectively silent tokens rather than asserting SNR from silence.
        if v < 10 ** (-40 / 10):
            continue
        records.append({'start': start, 'end': end,
                        'voiceOverMusicDb': 10 * math.log10(v / max(m, 1e-20)),
                        'voiceOverContactsDb': 10 * math.log10(v / max(c, 1e-20))})
    ordered = sorted(r['voiceOverMusicDb'] for r in records)
    contact = sorted(r['voiceOverContactsDb'] for r in records)
    return {'measuredWords': len(records), 'wordCount': len(word_ranges),
            'voiceOverMusicMedianDb': ordered[len(ordered) // 2],
            'voiceOverMusic10thPercentileDb': ordered[round((len(ordered) - 1) * .1)],
            'voiceOverMusicMinimumDb': ordered[0],
            'voiceOverContactsMedianDb': contact[len(contact) // 2],
            'voiceOverContactsMinimumDb': contact[0],
            'words': records}


def onset_alignment(original, clear):
    # Compare 10 ms energy envelopes at the beginning of all spoken passages.
    # No resampling/time stretching/trim is permitted in this pipeline.
    raw, clean = pcm(original), pcm(clear)
    errors = []
    for start, _ in speech:
        first = max(0, round((start - .10) * RATE))
        last = min(sample_count, round((start + .50) * RATE))
        block = 240  # 5 ms
        def first_audible(values):
            for index in range(first, last, block):
                part = values[index * 2:min(last, index + block) * 2]
                if part and math.sqrt(sum(x * x for x in part) / len(part)) >= .002:
                    return index
            return None
        before, after = first_audible(raw), first_audible(clean)
        if before is not None and after is not None:
            errors.append(abs(after - before) / RATE)
    return {'checkedPassages': len(errors), 'maximumOnsetDifferenceSeconds': max(errors, default=0),
            'timingChanged': False, 'sampleRate': RATE, 'durationSeconds': duration}


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    hashes = {relative(path): sha256(path) for path in inputs}
    key = hashlib.sha256(json.dumps(hashes, sort_keys=True).encode()).hexdigest()
    if OUTPUT.exists() and MANIFEST.exists() and REPORT.exists():
        previous = json.loads(MANIFEST.read_text())
        if (previous.get('inputHash') == key and previous.get('masterSha256') == sha256(OUTPUT)
                and previous.get('checks') and all(previous['checks'].values())):
            print(f'Clear audio master is cached: {relative(OUTPUT)}')
            return
    print('Preparing centered narration and soft contact sounds...', flush=True)
    with ThreadPoolExecutor(max_workers=2) as pool:
        contact_job = pool.submit(make_contacts)
        raw_voice, clear_voice, voice_gain = assemble_voice()
        contacts, retained = contact_job.result()
    envelope = make_envelope()
    music = CACHE / 'music-ducked.wav'
    ffmpeg('-v', 'error', '-i', ROOT / 'public/music/bg.mp3',
           '-f', 'f32le', '-ar', RATE, '-ac', 1, '-i', envelope,
           '-filter_complex', '[1:a]pan=stereo|c0=c0|c1=c0[env];'
                              '[0:a][env]amultiply[out]',
           '-map', '[out]', '-ar', RATE, '-c:a', 'pcm_f32le', music)
    print('Mixing the 48 kHz master; checking loudness, peaks and word balance...', flush=True)
    ffmpeg('-v', 'error', '-i', clear_voice, '-i', music, '-i', contacts,
           '-filter_complex', '[0:a][1:a][2:a]amix=inputs=3:normalize=0,'
                              f'alimiter=limit={10 ** (CEILING / 20)}:'
                              'attack=5:release=90:level=false:latency=true,'
                              f'atrim=end_sample={sample_count}[out]',
           '-map', '[out]', '-ar', RATE, '-c:a', 'pcm_s24le', OUTPUT)
    with ThreadPoolExecutor(max_workers=3) as pool:
        measures = dict(zip(['master', 'voice', 'music', 'contacts', 'originalVoice'],
                            pool.map(loudness, [OUTPUT, clear_voice, music, contacts, raw_voice])))
    previous_export = ROOT / 'out/ronaldo_emotional_v3_sync2.mp4'
    previous_mix = loudness(previous_export) if previous_export.exists() else None
    balance = word_balance(clear_voice, music, contacts)
    alignment = onset_alignment(raw_voice, clear_voice)
    with wave.open(str(OUTPUT), 'rb') as master:
        exact_samples = master.getnframes()
        format_ok = master.getnchannels() == 2 and master.getframerate() == RATE
    checks = {
        'durationSamples': exact_samples == sample_count,
        'stereo48kHz': format_ok,
        'masterLoudness': -17.5 <= measures['master']['integratedLUFS'] <= -15.5,
        'truePeakHeadroom': measures['master']['truePeakDbTP'] <= -1.5,
        'voiceMusicSeparation': balance['voiceOverMusic10thPercentileDb'] >= 16,
        'softContacts': measures['contacts']['truePeakDbTP'] <= -24,
        'wordTimingPreserved': alignment['maximumOnsetDifferenceSeconds'] <= .02,
        'sourceFilesUnchanged': all(sha256(path) == hashes[relative(path)] for path in inputs),
    }
    manifest = {'master': relative(OUTPUT), 'masterSha256': sha256(OUTPUT), 'inputHash': key,
                'inputHashes': hashes, 'sampleRate': RATE, 'channels': 2, 'bitsPerSample': 24,
                'durationSamples': sample_count, 'durationSeconds': duration,
                'voiceFilter': VOICE_FILTER, 'voiceFixedGainDb': voice_gain,
                'musicGain': {'speech': .075, 'actionWindows': .22,
                              'attackSeconds': .20, 'releaseSeconds': .55},
                'contactGains': CONTACT_GAINS, 'contactCount': len(retained),
                'noDenoisingOrSpeechRegeneration': True,
                'musicCredit': json.loads((ROOT / 'public/music/license.json').read_text())['credit'],
                'checks': checks}
    report = {'checks': checks, 'passed': all(checks.values()), 'measurements': measures,
              'previousExport': {'path': relative(previous_export), 'measurements': previous_mix},
              'wordBalance': balance, 'alignment': alignment, 'manifest': manifest,
              'contactCues': retained}
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
    REPORT.write_text(json.dumps(report, indent=2) + '\n')
    before_level = str(previous_mix['integratedLUFS']) if previous_mix else 'unavailable'
    summary = f'''# Audio clarity checks

The new mix puts the narrator in front, with softer contact sounds and slower,
continuous music ducking. The original narration, licensed score, contact times,
word timestamps and 200-second edit are preserved. No noise reduction was used:
the cached narration has clean pauses and no recorded room-noise problem.

| Check | Previous export | New master | Result |
| --- | ---: | ---: | --- |
| Integrated loudness | {before_level} LUFS | {measures['master']['integratedLUFS']} LUFS | {'PASS' if checks['masterLoudness'] else 'FAIL'} |
| True peak | {previous_mix['truePeakDbTP'] if previous_mix else 'unavailable'} dBTP | {measures['master']['truePeakDbTP']} dBTP | {'PASS' if checks['truePeakHeadroom'] else 'FAIL'} |
| Voice over music, median spoken word | — | {balance['voiceOverMusicMedianDb']:.1f} dB | {'PASS' if checks['voiceMusicSeparation'] else 'FAIL'} |
| Voice over music, 10th percentile | — | {balance['voiceOverMusic10thPercentileDb']:.1f} dB | {'PASS' if checks['voiceMusicSeparation'] else 'FAIL'} |
| Contact bus peak | -7.5 dBTP | {measures['contacts']['truePeakDbTP']} dBTP | {'PASS' if checks['softContacts'] else 'FAIL'} |
| Passage-onset difference | — | {alignment['maximumOnsetDifferenceSeconds'] * 1000:.0f} ms | {'PASS' if checks['wordTimingPreserved'] else 'FAIL'} |
| Stereo 48 kHz / exactly {sample_count:,} samples | — | {exact_samples:,} samples | {'PASS' if checks['durationSamples'] and checks['stereo48kHz'] else 'FAIL'} |
| Source files and word metadata | original files | unchanged | {'PASS' if checks['sourceFilesUnchanged'] else 'FAIL'} |

Narration treatment: 75 Hz high-pass; -1.5 dB at 250 Hz; +1.5 dB at 2.6 kHz;
gentle 2.1:1 compression; one fixed loudness gain; rare-peak limiting with
latency compensation. The narration stays centered; the score stays stereo.
The music envelope uses 5 ms control points interpolated at the audio sample
rate, so it sounds the same in preview and full resolution exports.

Music credit: {manifest['musicCredit']}

The final AAC export should be checked separately for codec peak overshoot and
duration. Listen once on headphones and phone speakers for preferred voice tone
and balance; these listening choices cannot be established by level meters.
'''
    REPORT.with_suffix('.md').write_text(summary)
    print(json.dumps({'master': relative(OUTPUT), 'loudness': measures['master'],
                      'wordBalance': {k: v for k, v in balance.items() if k != 'words'},
                      'checks': checks}, indent=2), flush=True)
    if not all(checks.values()):
        raise RuntimeError('Clarity master checks failed; see ' + relative(REPORT))


if __name__ == '__main__':
    main()
